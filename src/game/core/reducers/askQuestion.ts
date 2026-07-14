// ============================================================
// 零点接线台 — ASK_QUESTION reducer 处理器
// 叙述式问询：来电者絮叨回答，玩家需从混乱中摘取关键信息
// ============================================================

import type { WorldState, DialogueLine, InfoQuality, JudgmentPrompt } from '../../types'
import { stressToLevel, PROTOCOL_REF } from '../../types'
import { rng } from '../random'
import { hasPerk } from '../perks'
import { getCaller } from '../../npc/personas'
import {
  pickNarrativeAnswer,
  generateLocationNarrative,
  generateEventNarrative,
  generateAgeNarrative,
  generateVitalsNarrative,
  getQuestionTimeCost,
} from './narrative'
import { getPronoun } from '../../content/pronouns'
import { createEventSink } from './helpers'

export function handleAskQuestion(state: WorldState, questionId: string): WorldState {
  const call = state.currentCall
  const cs = state.callerState
  // 防御：必须满足前置条件，且不重复问同一个问题
  if (!call || !cs) return state
  if (state.callPhase !== 'questioning' && state.callPhase !== 'connected') return state
  if (cs.askedMPDS.includes(questionId)) return state

  const now = state.shiftElapsed
  const newDialogue: DialogueLine[] = []
  const newRevealed = { ...cs.revealedInfo }
  const newInfoQuality: Record<string, InfoQuality> = { ...cs.infoQuality }
  const newAskedMPDS = [...cs.askedMPDS]
  let newAddress: 'none' | 'vague' | 'partial' | 'full' = newRevealed.address
  let newStress = cs.stress
  let stressEffect = 0
  const newJudgments: JudgmentPrompt[] = [...(state.pendingJudgments ?? [])]
  let newTerminal = { ...state.terminal }
  const sink = createEventSink(state)

  // ==========================================
  // 5步标准协议 (Protocol 0) — 每通电话必须依次完成
  // ==========================================

  // --- 步骤1：位置确认 ---
  if (questionId === 'step1_location') {
    stressEffect = -5
    newDialogue.push({ speaker: 'operator', text: '请问事发的确切地址是哪里？', timestamp: now })
    const nq = generateLocationNarrative(
      call.fourElements.address.partial,
      call.fourElements.address.vague,
      newStress,
    )
    newDialogue.push({ speaker: 'caller', text: nq.text, timestamp: now })
    newAddress = nq.quality === 'clear' ? 'partial' : 'vague'
    newInfoQuality['address'] = nq.quality
    // 自动填写调度卡：事件地址
    newTerminal = { ...newTerminal, address: call.fourElements.address.partial }
  }

  // --- 步骤1b：标志建筑（补充精确地址）---
  else if (questionId === 'ask_landmark') {
    stressEffect = -3
    newDialogue.push({ speaker: 'operator', text: '旁边有什么明显的标志物或者店铺吗？', timestamp: now })
    const nq = pickNarrativeAnswer(
      newStress,
      call.fourElements.address.full,
      call.fourElements.address.partial,
      call.fourElements.address.vague,
    )
    newDialogue.push({ speaker: 'caller', text: nq.text, timestamp: now })
    newAddress = nq.quality === 'clear' ? 'full' : (nq.quality === 'partial' ? 'partial' : newRevealed.address)
    newInfoQuality['address'] = nq.quality
    // 自动填写调度卡：完整地址（覆盖步骤1的部分地址）
    newTerminal = { ...newTerminal, address: call.fourElements.address.full }
  }

  // --- 步骤2：事件简述 ---
  else if (questionId === 'step2_event') {
    stressEffect = -8
    newDialogue.push({ speaker: 'operator', text: '好的，请告诉我具体发生了什么事？', timestamp: now })
    const caller = getCaller(call.callerId)
    const nq = generateEventNarrative(
      call.fourElements.condition.chiefComplaint,
      call.fourElements.condition.gender,
      newStress,
      caller.relationship,
    )
    newDialogue.push({ speaker: 'caller', text: nq.text, timestamp: now })
    newRevealed.chiefComplaint = nq.quality !== 'vague'
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
    newJudgments.push({
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
    newDialogue.push({ speaker: 'operator', text: '患者多大年龄了？', timestamp: now })
    const age = call.fourElements.condition.age
    const ageText = generateAgeNarrative(age, newStress)
    newDialogue.push({ speaker: 'caller', text: ageText, timestamp: now })
    newRevealed.age = newStress < 75
    newInfoQuality['age'] = newStress >= 75 ? 'vague' : newStress >= 50 ? 'partial' : 'clear'

    // 自动填写调度卡：患者年龄
    const ageStripped = age.replace(/左右|约|多岁|大概|男性|女性|男|女|不详/gi, '').trim()
    newTerminal = { ...newTerminal, patientAge: ageStripped }
  }

  // --- 步骤4：意识与呼吸（最关键评估）---
  else if (questionId === 'step4_vitals') {
    stressEffect = -10
    const pronoun = getPronoun(call.fourElements.condition.gender)
    newDialogue.push({ speaker: 'operator', text: `患者清醒吗？${pronoun}还有呼吸吗？`, timestamp: now })
    const consciousness = call.fourElements.condition.consciousness
    const breathing = call.fourElements.condition.breathing
    const vitalsText = generateVitalsNarrative(consciousness, breathing, newStress)
    newDialogue.push({ speaker: 'caller', text: vitalsText, timestamp: now })
    newRevealed.consciousness = newStress < 75
    newRevealed.breathing = newStress < 75
    newInfoQuality['consciousness'] = newStress >= 75 ? 'vague' : newStress >= 50 ? 'partial' : 'clear'
    newInfoQuality['breathing'] = newStress >= 75 ? 'vague' : newStress >= 50 ? 'partial' : 'clear'

    // 生成意识+呼吸判断卡
    const isUnconscious = consciousness.includes('无意识') || consciousness.includes('不醒') || consciousness.includes('呼之不应') || consciousness.includes('昏迷')
    const isNotBreathing = breathing.includes('没有呼吸') || breathing.includes('无呼吸') || breathing.includes('窒息') || breathing.includes('胸口不动')
    const isBreathingAbnormal = breathing.includes('急促') || breathing.includes('喘') || breathing.includes('异常')
    const callerIdx2 = newDialogue.findIndex(d => d.speaker === 'caller')
    newJudgments.push({
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
    newDialogue.push({ speaker: 'operator', text: '您的联系电话是多少？我记一下。', timestamp: now })
    const contactAnswer = newStress >= 50
      ? '就是我这个手机吧...哎我现在脑子都是乱的...你打我这个号就行...这个是...等一下我看看...'
      : newStress >= 25
        ? '就我这个手机！138那个...你打过来应该看得到吧？就是现在这个号码。'
        : call.fourElements.contact
    const cq: { text: string; quality: InfoQuality; distorted: boolean } =
      newStress >= 75 ? { text: '我...我不知道...你打这个能打通吧...', quality: 'vague', distorted: true } :
      newStress >= 50 ? { text: contactAnswer, quality: 'partial', distorted: true } :
      newStress >= 25 ? { text: contactAnswer, quality: 'partial', distorted: false } :
      { text: call.fourElements.contact, quality: 'clear', distorted: false }
    newDialogue.push({ speaker: 'caller', text: cq.text, timestamp: now })
    newRevealed.contact = cq.quality !== 'vague'
    newInfoQuality['contact'] = cq.quality
    // 自动填写调度卡：联系电话
    newTerminal = { ...newTerminal, contact: call.fourElements.contact }
  }

  // --- 求助诉求（补充闭环信息）---
  else if (questionId === 'ask_purpose') {
    stressEffect = -1
    newDialogue.push({ speaker: 'operator', text: '您现在最需要我们协助处理什么？', timestamp: now })
    newDialogue.push({ speaker: 'caller', text: call.fourElements.purpose, timestamp: now })
    newRevealed.purpose = true
    newInfoQuality['purpose'] = newStress >= 50 ? 'partial' : 'clear'
  }

  // --- MPDS 标准问询 ---
  else {
    const mpdsQ = call.mpdsQuestions.find(q => q.id === questionId)
    if (!mpdsQ) return state

    stressEffect = mpdsQ.stressEffect

    newDialogue.push({ speaker: 'operator', text: mpdsQ.questionText, timestamp: now })

    // 使用叙述式回答，基于情绪选择版本
    const nq = pickNarrativeAnswer(newStress, mpdsQ.answer, mpdsQ.ramblingAnswer, mpdsQ.panickedAnswer)
    newDialogue.push({ speaker: 'caller', text: nq.text, timestamp: now })

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
    if (mpdsQ.judgment) {
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
  newAskedMPDS.push(questionId)

  const questionPenalty = Math.max(0, cs.questionCount - 4) * 3
  newStress = Math.max(0, Math.min(100, newStress + stressEffect + questionPenalty))
  const newStressLevel = stressToLevel(newStress)

  // 情绪爆发
  if (cs.stressLevel !== '失控' && newStressLevel === '失控') {
    newDialogue.push({
      speaker: 'caller', text: '我...我真的不行了！你们到底能不能来？！', timestamp: now,
    })
  } else if (cs.stressLevel === '镇定' && newStressLevel === '恐慌') {
    newDialogue.push({
      speaker: 'caller', text: '你能不能快点……我感觉越来越不好了……', timestamp: now,
    })
  }

  if (questionId === 'step1_location' && hasPerk(state.perks, 'address_memory') && newAddress === 'vague') {
    newAddress = 'partial'
    newTerminal = { ...newTerminal, address: call.fourElements.address.partial }
    newInfoQuality['address'] = 'partial'
  }

  const updatedRevealed = { ...newRevealed, address: newAddress }
  const baseQuestionTimeCost = getQuestionTimeCost(questionId, call)
  const questionTimeCost = hasPerk(state.perks, 'rapid_intake') && cs.questionCount === 0
    ? 0
    : baseQuestionTimeCost

  return {
    ...state,
    eventSeq: sink.seq,
    shiftElapsed: state.shiftElapsed + questionTimeCost,
    questionCost: state.questionCost + questionTimeCost,
    callPhase: 'questioning',
    pendingJudgments: newJudgments,
    terminal: newTerminal,
    callerState: {
      ...cs,
      revealedInfo: updatedRevealed,
      infoQuality: newInfoQuality,
      askedMPDS: newAskedMPDS,
      stress: newStress,
      stressLevel: newStressLevel,
      questionCount: cs.questionCount + 1,
    },
    dialogueLog: [...state.dialogueLog, ...newDialogue],
  }
}
