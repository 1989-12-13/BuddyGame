// ============================================================
// 120调度台 — ASK_QUESTION reducer 处理器
// 叙述式问询：来电者絮叨回答，玩家需从混乱中摘取关键信息
// ============================================================

import type { WorldState, DialogueLine, InfoQuality, JudgmentPrompt, CallerVoice, StressTier } from '../../types'
import { stressToLevel, PROTOCOL_REF } from '../../types'
import { rng } from '../random'
import { hasPerk } from '../perks'
import { getCaller } from '../../npc/personas'
import { getVoice } from '../../npc/voices'
import { voiceAnswerLines, type VoiceContext } from '../callerVoice'
import {
  pickNarrativeAnswer,
  generateLocationNarrative,
  generateEventNarrative,
  generateAgeNarrative,
  generateVitalsNarrative,
  getQuestionTimeCost,
  splitSentences,
} from './narrative'
import { getPronoun } from '../../content/pronouns'
import { createEventSink } from './helpers'

/** 中文 CalleeStressLevel → 英文 StressTier 映射（stressToLevel 返回中文，脚本 key 用英文） */
function toTier(level: string): StressTier {
  switch (level) {
    case '镇定': return 'calm'
    case '紧张': return 'tense'
    case '恐慌': return 'panic'
    case '失控': return 'lost'
    default: return 'calm'
  }
}

/** 把一组短句展开成逐条 caller 对话行（timestamp 递增，模拟一句一句说） */
function pushCallerLines(newDialogue: DialogueLine[], lines: string[], now: number): number {
  const start = newDialogue.length
  lines.forEach((text, i) => newDialogue.push({ speaker: 'caller', text, timestamp: now + i }))
  return start
}

/** 对一段连续 caller 回答做整块声音合成：头尾点缀只加一次，不耐烦前缀加在首句 */
function synthesizeCallerBlock(
  lines: DialogueLine[],
  voice: CallerVoice,
  ctx: VoiceContext,
  isRetry: boolean,
  cooperation: number,
): DialogueLine[] {
  const out: DialogueLine[] = []
  let block: DialogueLine[] = []
  const flush = () => {
    if (!block.length) return
    const texts = voiceAnswerLines(block.map(b => b.text), voice, ctx)
    const annoyed = isRetry && cooperation < 60 && rng() < 0.75
    block.forEach((b, i) => {
      let t = texts[i] ?? b.text
      if (i === 0 && annoyed) t = `我不是刚说过了嘛——${t}`
      out.push({ ...b, text: t })
    })
    block = []
  }
  for (const line of lines) {
    if (line.speaker === 'caller') block.push(line)
    else { flush(); out.push(line) }
  }
  flush()
  return out
}

/** 对话回合带来的修饰：措辞、情绪代价、时间代价 */
export interface TurnModifiers {
  spokenLine?: string
  stressDelta?: number
  extraTime?: number
}

export function handleAskQuestion(state: WorldState, questionId: string, turn?: TurnModifiers): WorldState {
  const call = state.currentCall
  const cs = state.callerState
  // 清晰答案只问一次；模糊答案在安抚后允许再确认一次。
  if (!call || !cs) return state
  if (state.callPhase !== 'questioning' && state.callPhase !== 'connected') return state
  const callerProfile = getCaller(call.callerId)
  const voice = getVoice(call.callerId)
  const attemptCount = cs.questionAttempts[questionId] ?? 0
  const previousQuality = cs.questionQuality[questionId]
  const previousStress = cs.questionStress[questionId] ?? cs.stress
  const isRetry = attemptCount > 0
  // 脚本标记 requireComplete 的问题允许重问（最多2次），且不受"清晰答案只问一次"限制
  const scriptedEarly = state.currentCall?.script?.[questionId]
  const isRequireComplete = scriptedEarly?.requireComplete ?? false
  const maxAttempts = isRequireComplete ? 2 : 2
  if (attemptCount >= maxAttempts) return state
  if (!isRequireComplete && isRetry && (previousQuality === 'clear' || cs.stress >= previousStress)) return state

  const now = state.shiftElapsed
  const newDialogue: DialogueLine[] = []
  const newRevealed = { ...cs.revealedInfo }
  const newInfoQuality: Record<string, InfoQuality> = { ...cs.infoQuality }
  const newAskedMPDS = [...cs.askedMPDS]
  const newQuestionAttempts = { ...cs.questionAttempts }
  const newQuestionQuality = { ...cs.questionQuality }
  const newQuestionStress = { ...cs.questionStress }
  let answerQuality: InfoQuality = 'clear'
  let newAddress: 'none' | 'vague' | 'partial' | 'full' = newRevealed.address
  let newStress = cs.stress
  let stressEffect = 0
  const newJudgments: JudgmentPrompt[] = [...(state.pendingJudgments ?? [])]
  let newTerminal = { ...state.terminal }
  const sink = createEventSink(state)

  // ==========================================
  // 手写对话脚本优先：场景定义了 script 时直接使用，跳过 narrative 生成和 callerVoice 合成
  // ==========================================
  const scripted = call.script?.[questionId]
  if (scripted) {
    stressEffect = -5 // 脚本对话默认降压，具体值由情绪档位决定
    const operatorLine = isRetry && scripted.operatorRetry ? scripted.operatorRetry : scripted.operator
    newDialogue.push({ speaker: 'operator', text: operatorLine, timestamp: now })

    // 按当前情绪档位选台词（stressToLevel 返回中文，脚本 key 用英文，需映射）
    const tier: StressTier = toTier(stressToLevel(newStress).toString())
    let callerLines = scripted.caller[tier] ?? scripted.caller.calm ?? []
    const infoMissing = callerLines.length === 0

    if (infoMissing) {
      const fallback: Record<StressTier, string> = {
        calm: '……什么？',
        tense: '你……你等我一下……我脑子有点乱……',
        panic: '我不知道！我什么都不知道了！！你说什么我听不进去！！',
        lost: '……我不行了……什么都想不起来了……',
      }
      callerLines = [fallback[tier]]
    }

    // 重问不耐烦前缀
    if (isRetry && scripted.caller.retryPrefix) {
      callerLines = [`${scripted.caller.retryPrefix}${callerLines[0] ?? ''}`, ...callerLines.slice(1)]
    }

    pushCallerLines(newDialogue, callerLines, now)

    // ==========================================
    // 信息完整性检查：requireComplete 标记的问题
    // 地址需要 partial 以上（calm/tense 档位回答才算完整）
    // 电话需要 calm/tense 档位回答才算清晰
    // 第一次回答不完整 → 设置 pendingReask 提示，不加入 askedMPDS
    // 重问 → 强制使用 calm 档位回答（重问必得全部信息）
    // ==========================================
    let isComplete = true
    let reaskPrompt = ''
    if (scripted.requireComplete && !infoMissing) {
      if (isRetry) {
        // 重问：强制使用 calm 档位回答，视为完整
        isComplete = true
      } else {
        // 第一次问：检查档位是否清晰
        if (tier === 'panic' || tier === 'lost') {
          isComplete = false
          if (questionId === 'step1_location' || questionId === 'ask_landmark') {
            reaskPrompt = '地址不够清晰，请重新确认地址'
          } else if (questionId === 'ask_contact') {
            reaskPrompt = '电话号码没听清，请重新确认'
          } else {
            reaskPrompt = '信息不够清晰，请重新确认'
          }
        }
      }
    }

    // 重问时强制用 calm 档位的回答覆盖终端
    if (isRetry && scripted.requireComplete) {
      const calmLines = scripted.caller.calm ?? []
      if (calmLines.length > 0) {
        // 用 calm 回答覆盖最后几行 caller 对话
        const callerStart = newDialogue.findIndex((d, i) => d.speaker === 'caller' && i > 0)
        if (callerStart >= 0) {
          newDialogue.splice(callerStart)
          pushCallerLines(newDialogue, calmLines, now)
        }
      }
    }

    // 填终端：只有来电者真正给出了信息（!infoMissing）且回答完整（isComplete）才填
    const canFill = !infoMissing && isComplete
    if (canFill && scripted.fillTerminal) {
      newTerminal = { ...newTerminal, ...scripted.fillTerminal }
    }

    // 信息质量
    answerQuality = infoMissing ? 'vague' : (isComplete ? 'clear' : 'partial')
    newInfoQuality[questionId] = answerQuality
    if (canFill) {
      if (scripted.fillTerminal?.address) newRevealed.address = 'full'
      if (scripted.fillTerminal?.chiefComplaint) newRevealed.chiefComplaint = true
      if (scripted.fillTerminal?.patientGender) newRevealed.gender = true
      if (scripted.fillTerminal?.patientAge) newRevealed.age = true
      if (scripted.fillTerminal && 'conscious' in scripted.fillTerminal) newRevealed.consciousness = true
      if (scripted.fillTerminal && 'breathing' in scripted.fillTerminal) newRevealed.breathing = true
      if (scripted.fillTerminal?.contact) newRevealed.contact = true
    }
    // ask_purpose 永远标记为已揭示
    if (questionId === 'ask_purpose' && !infoMissing) newRevealed.purpose = true

    // 只有信息完整才算问完；不完整则设置 pendingReask
    if (canFill && !newAskedMPDS.includes(questionId)) newAskedMPDS.push(questionId)
    newQuestionAttempts[questionId] = attemptCount + 1
    newQuestionQuality[questionId] = answerQuality
    const scriptedPenalty = Math.max(0, cs.questionCount - 4) * 3
    newStress = Math.max(0, Math.min(100, newStress + stressEffect + scriptedPenalty + (turn?.stressDelta ?? 0)))
    newQuestionStress[questionId] = newStress
    const sCoopDelta = turn?.stressDelta == null ? 0 : turn.stressDelta < 0 ? 5 : turn.stressDelta > 0 ? -4 : 0
    const sCooperation = Math.max(5, Math.min(100, cs.cooperation + sCoopDelta + (isRetry ? -3 : 0)))
    const sStressLevel = stressToLevel(newStress)

    // 情绪爆发（脚本版：使用脚本里该轮手写的爆发台词）
    if (cs.stressLevel !== '失控' && sStressLevel === '失控' && scripted.outburst) {
      newDialogue.push({ speaker: 'caller', text: scripted.outburst, timestamp: now })
    }

    // 脚本版 step2_event：生成协议编号判断题（与非脚本版一致）
    if (questionId === 'step2_event' && !isRetry && canFill) {
      const correctProtocol = call.mpdsCard.number
      const allProtocols = PROTOCOL_REF.map(([n]) => n)
      const distractorProtocols = allProtocols.filter(n => n !== correctProtocol)
      const shuffledDists = distractorProtocols.sort(() => rng() - 0.5).slice(0, 3)
      const protoOptions = [correctProtocol, ...shuffledDists].sort(() => rng() - 0.5)
      const protoNameMap = Object.fromEntries(PROTOCOL_REF)
      newJudgments.push({
        id: `judge_step2_protocol_${sink.seq++}`,
        questionId: 'step2_event',
        dialogueIndex: state.dialogueLog.length + newDialogue.findIndex(d => d.speaker === 'caller'),
        question: '根据来电者描述，此情况最可能对应哪个 MPDS 协议？',
        options: protoOptions.map(n => ({
          label: `${n} — ${protoNameMap[n] ?? '未知'}`,
          fills: [{ field: 'protocolNumber' as const, value: String(n) }],
          isCorrect: n === correctProtocol,
        })),
        chosenOptionIndex: null,
      })
    }

    const sTimeCost = getQuestionTimeCost(questionId, call)
    return {
      ...state,
      eventSeq: sink.seq,
      actionEndsAt: state.shiftElapsed + Math.max(0, (hasPerk(state.perks, 'rapid_intake') && cs.questionCount === 0 ? 0 : sTimeCost) + (turn?.extraTime ?? 0)),
      calmCount: 0,
      questionCost: state.questionCost + Math.max(0, (hasPerk(state.perks, 'rapid_intake') && cs.questionCount === 0 ? 0 : sTimeCost) + (turn?.extraTime ?? 0)),
      callPhase: 'questioning',
      pendingJudgments: newJudgments,
      pendingReask: !isComplete && reaskPrompt ? { questionId, prompt: reaskPrompt } : null,
      terminal: newTerminal,
      callerState: {
        ...cs,
        cooperation: sCooperation,
        revealedInfo: { ...newRevealed, address: canFill && scripted.fillTerminal?.address ? 'full' : newRevealed.address },
        infoQuality: newInfoQuality,
        askedMPDS: newAskedMPDS,
        questionAttempts: newQuestionAttempts,
        questionQuality: newQuestionQuality,
        questionStress: newQuestionStress,
        stress: newStress,
        stressLevel: sStressLevel,
        questionCount: cs.questionCount + 1,
      },
      // 脚本对话不做 callerVoice 合成，直接使用原文
      dialogueLog: [...state.dialogueLog, ...newDialogue],
    }
  }

  // ==========================================
  // 5步标准协议 (Protocol 0) — 每通电话必须依次完成
  // ==========================================

  // --- 步骤1：位置确认 ---
  if (questionId === 'step1_location') {
    stressEffect = -5
    newDialogue.push({ speaker: 'operator', text: '您在哪儿？具体地址说一下。', timestamp: now })
    const nq = generateLocationNarrative(
      call.fourElements.address.partial,
      call.fourElements.address.vague,
      newStress,
    )
    pushCallerLines(newDialogue, nq.lines, now)
    newAddress = nq.quality === 'clear' ? 'partial' : 'vague'
    answerQuality = nq.quality
    newInfoQuality['address'] = nq.quality
    // 自动填写调度卡：事件地址
    newTerminal = { ...newTerminal, address: newAddress === 'partial' ? call.fourElements.address.partial : call.fourElements.address.vague }
  }

  // --- 步骤1b：标志建筑（补充精确地址）---
  else if (questionId === 'ask_landmark') {
    stressEffect = -3
    newDialogue.push({ speaker: 'operator', text: '旁边有什么明显的店或者牌子吗？', timestamp: now })
    const nq = pickNarrativeAnswer(
      newStress,
      call.fourElements.address.full,
      call.fourElements.address.partial,
      call.fourElements.address.vague,
    )
    pushCallerLines(newDialogue, nq.lines, now)
    newAddress = nq.quality === 'clear' ? 'full' : (nq.quality === 'partial' ? 'partial' : newRevealed.address)
    answerQuality = nq.quality
    newInfoQuality['address'] = nq.quality
    // 自动填写调度卡：完整地址（覆盖步骤1的部分地址）
    newTerminal = { ...newTerminal, address: newAddress === 'full' ? call.fourElements.address.full : newAddress === 'partial' ? call.fourElements.address.partial : call.fourElements.address.vague }
  }

  // --- 步骤2：事件简述 ---
  else if (questionId === 'step2_event') {
    stressEffect = -8
    newDialogue.push({ speaker: 'operator', text: '好，告诉我到底怎么了。', timestamp: now })
    const nq = generateEventNarrative(
      call.fourElements.condition.chiefComplaint,
      call.fourElements.condition.gender,
      newStress,
      callerProfile.relationship,
      voice,
    )
    pushCallerLines(newDialogue, nq.lines, now)
    newRevealed.chiefComplaint = nq.quality !== 'vague'
    answerQuality = nq.quality
    newInfoQuality['chiefComplaint'] = nq.quality
    if (nq.quality !== 'vague' && call.fourElements.condition.gender !== '不详') {
      newRevealed.gender = true
      newInfoQuality['gender'] = nq.quality
    }
    // 自动填写调度卡：主诉 + 性别
    newTerminal = {
      ...newTerminal,
      chiefComplaint: call.fourElements.condition.chiefComplaint,
    }
    if (call.fourElements.condition.gender !== '不详') {
      newTerminal = { ...newTerminal, patientGender: call.fourElements.condition.gender }
    }

    // 生成协议判断选择题
    const correctProtocol = call.mpdsCard.number
    // 从全部33个协议中随机取3个不同的干扰项
    const allProtocols = PROTOCOL_REF.map(([n]) => n)
    const distractorProtocols = allProtocols.filter(n => n !== correctProtocol)
    const shuffledDists = distractorProtocols.sort(() => rng() - 0.5).slice(0, 3)
    const options = [correctProtocol, ...shuffledDists].sort(() => rng() - 0.5)
    const protoNameMap = Object.fromEntries(PROTOCOL_REF)
    const callerIdx = newDialogue.findIndex(d => d.speaker === 'caller')
    if (!isRetry) newJudgments.push({
      id: `judge_step2_protocol_${sink.seq++}`,
      questionId: 'step2_event',
      dialogueIndex: state.dialogueLog.length + (callerIdx >= 0 ? callerIdx : 1),
      question: '根据来电者描述，此情况最可能对应哪个 MPDS 协议？',
      options: options.map(n => ({
        label: `${n} — ${protoNameMap[n] ?? '未知'}`,
        fills: [{ field: 'protocolNumber' as const, value: String(n) }],
        isCorrect: n === correctProtocol,
      })),
      chosenOptionIndex: null,
    })
  }

  // --- 步骤3：患者年龄（自动填入调度卡，不再弹出选择题）---
  else if (questionId === 'step3_age') {
    stressEffect = -4
    newDialogue.push({ speaker: 'operator', text: 'TA多大岁数了？', timestamp: now })
    const age = call.fourElements.condition.age
    const ageLines = generateAgeNarrative(age, newStress, callerProfile.relationship)
    pushCallerLines(newDialogue, ageLines, now)
    newRevealed.age = newStress < 75
    newInfoQuality['age'] = newStress >= 75 ? 'vague' : newStress >= 50 ? 'partial' : 'clear'
    answerQuality = newInfoQuality['age']

    // 自动填写调度卡：患者年龄
    const ageStripped = age.replace(/左右|约|多岁|大概|男性|女性|男|女|不详/gi, '').trim()
    newTerminal = { ...newTerminal, patientAge: ageStripped }
  }

  // --- 步骤4：意识与呼吸（最关键评估）---
  else if (questionId === 'step4_vitals') {
    stressEffect = -10
    const pronoun = getPronoun(call.fourElements.condition.gender)
    newDialogue.push({ speaker: 'operator', text: `${pronoun}还有意识吗？还在喘气吗？`, timestamp: now })
    const consciousness = call.fourElements.condition.consciousness
    const breathing = call.fourElements.condition.breathing
    const vitalsLines = generateVitalsNarrative(consciousness, breathing, newStress)
    pushCallerLines(newDialogue, vitalsLines, now)
    newRevealed.consciousness = newStress < 75
    newRevealed.breathing = newStress < 75
    newInfoQuality['consciousness'] = newStress >= 75 ? 'vague' : newStress >= 50 ? 'partial' : 'clear'
    newInfoQuality['breathing'] = newStress >= 75 ? 'vague' : newStress >= 50 ? 'partial' : 'clear'
    answerQuality = newInfoQuality['breathing']

    // 生成意识+呼吸判断卡
    const isUnconscious = consciousness.includes('无意识') || consciousness.includes('不醒') || consciousness.includes('呼之不应') || consciousness.includes('昏迷')
    const isNotBreathing = breathing.includes('没有呼吸') || breathing.includes('无呼吸') || breathing.includes('窒息') || breathing.includes('胸口不动')
    const isBreathingAbnormal = breathing.includes('急促') || breathing.includes('喘') || breathing.includes('异常')
    const callerIdx2 = newDialogue.findIndex(d => d.speaker === 'caller')
    if (!isRetry) newJudgments.push({
      id: `judge_step4_${sink.seq++}`,
      questionId: 'step4_vitals',
      dialogueIndex: state.dialogueLog.length + (callerIdx2 >= 0 ? callerIdx2 : 1),
      question: '根据来电者描述，请判断患者意识与呼吸状态：',
      options: [
        { label: '有意识，呼吸正常', fills: [{ field: 'conscious', value: true }, { field: 'breathing', value: true }], isCorrect: !isUnconscious && !isNotBreathing && !isBreathingAbnormal },
        { label: '有意识，呼吸困难', fills: [{ field: 'conscious', value: true }, { field: 'breathing', value: false }, { field: 'conditionNote', value: '呼吸异常' }], isCorrect: !isUnconscious && isBreathingAbnormal },
        { label: '无意识，无呼吸', fills: [{ field: 'conscious', value: false }, { field: 'breathing', value: false }], isCorrect: isUnconscious && isNotBreathing },
        { label: '无意识，有呼吸', fills: [{ field: 'conscious', value: false }, { field: 'breathing', value: true }], isCorrect: isUnconscious && !isNotBreathing },
      ],
      chosenOptionIndex: null,
    })
  }

  // --- 联系电话（补充信息，随时可问）---
  else if (questionId === 'ask_contact') {
    stressEffect = -2
    newDialogue.push({ speaker: 'operator', text: '您的电话号码是多少？我记一下。', timestamp: now })
    const contactAnswer = newStress >= 50
      ? '就是我这个手机吧...哎我现在脑子都是乱的...你打我这个号就行...这个是...等一下我看看...'
      : newStress >= 25
        ? '138...后面是...等一下 7162？不对...你等一下我念给你...'
        : call.fourElements.contact
    const cq: { text: string; quality: InfoQuality; distorted: boolean } =
      newStress >= 75 ? { text: '我...我不知道...你打这个能打通吧...', quality: 'vague', distorted: true } :
      newStress >= 50 ? { text: contactAnswer, quality: 'partial', distorted: true } :
      newStress >= 25 ? { text: contactAnswer, quality: 'partial', distorted: false } :
      { text: call.fourElements.contact, quality: 'clear', distorted: false }
    pushCallerLines(newDialogue, splitSentences(cq.text), now)
    newRevealed.contact = cq.quality !== 'vague'
    newInfoQuality['contact'] = cq.quality
    answerQuality = cq.quality
    // 自动填写调度卡：联系电话
    newTerminal = { ...newTerminal, contact: call.fourElements.contact }
  }

  // --- MPDS 标准问询 ---
  else {
    const mpdsQ = call.mpdsQuestions.find(q => q.id === questionId)
    if (!mpdsQ) return state

    stressEffect = mpdsQ.stressEffect

    newDialogue.push({ speaker: 'operator', text: mpdsQ.questionText, timestamp: now })

    // 使用叙述式回答，基于情绪选择版本（句子流逐句入队）
    const nq = pickNarrativeAnswer(newStress, mpdsQ.answer, mpdsQ.ramblingAnswer, mpdsQ.panickedAnswer)
    answerQuality = nq.quality
    pushCallerLines(newDialogue, nq.lines, now)

    // 为每个揭示的字段标记信息质量（仅用于评分计算，不展示给玩家）
    for (const field of mpdsQ.reveals) {
      newInfoQuality[field] = nq.quality
      if (field === 'consciousness') {
        newRevealed.consciousness = nq.quality !== 'vague'
      } else if (field === 'breathing') {
        newRevealed.breathing = nq.quality !== 'vague'
      } else if (field === 'age') {
        newRevealed.age = nq.quality !== 'vague'
      } else if (field === 'gender') {
        newRevealed.gender = nq.quality !== 'vague'
      } else if (field === 'chiefComplaint') {
        newRevealed.chiefComplaint = nq.quality !== 'vague'
      } else if (field === 'additional') {
        const allAdditional = call.fourElements.condition.additional
        for (let i = 0; i < allAdditional.length; i++) {
          if (!newRevealed.additional.includes(allAdditional[i])) {
            newRevealed.additional = [...newRevealed.additional, allAdditional[i]]
            newInfoQuality[`additional_${i}`] = nq.quality
            break
          }
        }
      }
    }

    // 若该问询定义了临床判断选择题，为来电者回答生成判断卡
    if (mpdsQ.judgment && !isRetry) {
      const callerIdx = newDialogue.findIndex(d => d.speaker === 'caller')
      newJudgments.push({
        id: `judge_${questionId}_${sink.seq++}`,
        questionId,
        dialogueIndex: state.dialogueLog.length + (callerIdx >= 0 ? callerIdx : 1),
        question: mpdsQ.judgment.question,
        options: mpdsQ.judgment.options,
        chosenOptionIndex: null,
      })
    }
  }

  // --- 统一收尾 ---
  if (!newAskedMPDS.includes(questionId)) newAskedMPDS.push(questionId)
  newQuestionAttempts[questionId] = attemptCount + 1
  newQuestionQuality[questionId] = answerQuality
  const questionPenalty = Math.max(0, cs.questionCount - 4) * 3
  newStress = Math.max(0, Math.min(100, newStress + stressEffect + questionPenalty + (turn?.stressDelta ?? 0)))
  newQuestionStress[questionId] = newStress

  // 语气 → 配合度：温和（负压力修饰）拉近距离，催促（正压力修饰）伤配合；重问再扣一份耐心
  const coopDelta = turn?.stressDelta == null ? 0 : turn.stressDelta < 0 ? 5 : turn.stressDelta > 0 ? -4 : 0
  const newCooperation = Math.max(5, Math.min(100, cs.cooperation + coopDelta + (isRetry ? -3 : 0)))
  const newStressLevel = stressToLevel(newStress)
  const stressDelta = turn?.stressDelta ?? 0
  const attitudeEvidence = {
    ...state.attitudeEvidence,
    supportiveTurns: state.attitudeEvidence.supportiveTurns + (stressDelta < 0 ? 1 : 0),
    neutralTurns: state.attitudeEvidence.neutralTurns + (stressDelta === 0 ? 1 : 0),
    pressuringTurns: state.attitudeEvidence.pressuringTurns + (stressDelta > 0 ? 1 : 0),
    playerCausedLossControl: state.attitudeEvidence.playerCausedLossControl
      || (stressDelta > 0 && cs.stressLevel !== '失控' && newStressLevel === '失控'),
  }

  // 情绪爆发
  if (cs.stressLevel !== '失控' && newStressLevel === '失控') {
    newDialogue.push({
      speaker: 'caller', text: '不行了！你们到底在哪儿！', timestamp: now,
    })
  } else if (cs.stressLevel === '镇定' && newStressLevel === '恐慌') {
    newDialogue.push({
      speaker: 'caller', text: '越来越不对劲了……你们快点……', timestamp: now,
    })
  }

  if (questionId === 'step1_location' && hasPerk(state.perks, 'address_memory') && newAddress === 'vague') {
    newAddress = 'partial'
    newTerminal = { ...newTerminal, address: newAddress === 'partial' ? call.fourElements.address.partial : call.fourElements.address.vague }
    newInfoQuality['address'] = 'partial'
    newQuestionQuality[questionId] = 'partial'
  }

  const updatedRevealed = { ...newRevealed, address: newAddress }
  const baseQuestionTimeCost = getQuestionTimeCost(questionId, call)
  // 对话回合：用玩家选定的措辞替换默认问话
  if (turn?.spokenLine && newDialogue[0]?.speaker === 'operator') {
    newDialogue[0] = { ...newDialogue[0], text: turn.spokenLine }
  }
  const questionTimeCost = Math.max(0, (hasPerk(state.perks, 'rapid_intake') && cs.questionCount === 0
    ? 0
    : baseQuestionTimeCost) + (turn?.extraTime ?? 0))

  return {
    ...state,
    eventSeq: sink.seq,
    actionEndsAt: state.shiftElapsed + questionTimeCost,
    calmCount: 0,
    questionCost: state.questionCost + questionTimeCost,
    attitudeEvidence,
    callPhase: 'questioning',
    pendingJudgments: newJudgments,
    terminal: newTerminal,
    callerState: {
      ...cs,
      cooperation: newCooperation,
      revealedInfo: updatedRevealed,
      infoQuality: newInfoQuality,
      askedMPDS: newAskedMPDS,
      questionAttempts: newQuestionAttempts,
      questionQuality: newQuestionQuality,
      questionStress: newQuestionStress,
      stress: newStress,
      stressLevel: newStressLevel,
      questionCount: cs.questionCount + 1,
    },
    // 说话特质层：对整块连续来电者回答做一次合成（头尾点缀只加一次、不耐烦前缀加首句）
    dialogueLog: [...state.dialogueLog, ...synthesizeCallerBlock(
      newDialogue,
      voice,
      { stressLevel: newStressLevel, relation: callerProfile.relationship },
      isRetry,
      newCooperation,
    )],
  }
}
