// ============================================================
// 零点接线台 — World Reducer
// 120急救调度模拟游戏核心逻辑
// ============================================================

import type { WorldState, DialogueLine, CallPhase, InfoQuality, JudgmentPrompt, MpdsDeterminant } from '../types'
import { stressToLevel, determinantToTriage, PROTOCOL_REF } from '../types'
import type { GameAction } from './actions'
import {
  createInitialState,
  createCallerState,
  createTerminalState,
  buildScenarioQueue,
  calcAmbulanceETA,
  scoreCall,
} from './worldState'
import { getScenario } from '../events/templates'
import { getCaller } from '../npc/personas'

/** 根据情绪选择叙述式回答 */
function pickNarrativeAnswer(
  stress: number,
  cleanAnswer: string,
  ramblingAnswer: string,
  panickedAnswer: string,
): { text: string; quality: InfoQuality; distorted: boolean } {
  // 失控（75+）：语无伦次，完全无法提供信息
  if (stress >= 75) return { text: panickedAnswer, quality: 'vague', distorted: true }
  // 恐慌（50-74）：有概率完全无法提供信息或只能提供部分信息
  if (stress >= 50) {
    if (Math.random() < 0.35) return { text: panickedAnswer, quality: 'vague', distorted: true }
    return { text: ramblingAnswer, quality: 'partial', distorted: true }
  }
  // 紧张（25-49）：只能提供部分信息
  if (stress >= 25) return { text: ramblingAnswer, quality: 'partial', distorted: false }
  // 镇定（0-24）：能给出完整信息
  return { text: cleanAnswer, quality: 'clear', distorted: false }
}

/** 由来电者tone映射初始压力值 */
function toneToInitialStress(tone: string): number {
  const map: Record<string, number> = {
    镇定: 25,
    紧张: 50,
    恐慌: 65,
    失控: 85,
  }
  return map[tone] ?? 40
}

/** 生成步骤1（位置确认）的叙述式回答 */
function generateLocationNarrative(
  partial: string,
  vague: string,
  stress: number,
): { text: string; quality: InfoQuality; distorted: boolean } {
  if (stress >= 75) return { text: vague, quality: 'vague', distorted: true }
  if (stress >= 50) {
    const shortVague = vague.length > 6 ? vague.slice(0, 6) : vague
    return {
      text: `${partial.split('，')[0]}！！你们快来！！就在${shortVague}这边！！`,
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    const areaHint = vague.length > 4 ? vague.slice(0, 4) : vague
    return {
      text: `在...在${areaHint}...不对，是在${partial}...对，就是这个地址。`,
      quality: 'partial', distorted: false,
    }
  }
  return { text: partial, quality: 'clear', distorted: false }
}

/** 生成步骤2（事件简述）的叙述式回答 */
function generateEventNarrative(
  chiefComplaint: string,
  gender: string,
  stress: number,
  relationship: string,
): { text: string; quality: InfoQuality; distorted: boolean } {
  const pronoun = gender === '女性' ? '她' : gender === '男性' ? '他' : 'TA'
  // 根据来电者与患者的关系推导自然的情景描述
  const context =
    relationship === '路人' ? '就在路边' :
    relationship === '同事' ? '我们正在做事' :
    '刚才还好好的在'

  if (stress >= 75) {
    return {
      text: `不行了不行了！！${pronoun}${chiefComplaint.slice(0, 8)}...你们快来啊！！出大事了！！`,
      quality: 'vague', distorted: true,
    }
  }
  if (stress >= 50) {
    return {
      text: `${pronoun}...我...我不知道怎么形容...${chiefComplaint.slice(0, 10)}...就是突然之间就不对劲了！${context}...一下子就...我该怎么办？！`,
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    return {
      text: `${pronoun}${chiefComplaint.slice(0, 15)}...就是这样的情况，刚刚发生的，感觉挺严重的。嗯...大概就是这样。`,
      quality: 'partial', distorted: false,
    }
  }
  return { text: chiefComplaint, quality: 'clear', distorted: false }
}

/** 生成步骤3（患者年龄）的叙述式回答 */
function generateAgeNarrative(age: string, stress: number, gender: string): string {
  const pronoun = gender === '女性' ? '她' : gender === '男性' ? '他' : 'TA'
  // 防御性剥离：确保 age 字段不混入性别/称谓
  const cleanAge = age.replace(/男性|女性|男|女|不详/g, '').trim()
  if (stress >= 75) return `${pronoun}${cleanAge}！！具体多少有关系吗？！快派人来啊！！`
  if (stress >= 50) return `${pronoun}${cleanAge}...应该是${cleanAge}吧，我一下子脑子转不过来了...这有关系吗？`
  if (stress >= 25) return `${pronoun}${cleanAge}...应该差不多。`
  return `${pronoun}${cleanAge}。`
}

/** 生成步骤5（意识与呼吸）的叙述式回答 */
function generateVitalsNarrative(consciousness: string, breathing: string, stress: number): string {
  if (stress >= 75) {
    const c = consciousness.length > 10 ? consciousness.slice(0, 10) + '...' : consciousness
    const b = breathing.length > 10 ? breathing.slice(0, 10) + '...' : breathing
    return `${c}！！！${b}！！！你们快来啊！！！`
  }
  if (stress >= 50) return `${consciousness}...${breathing}...天哪我不知道怎么形容...反正看起来不太好...`
  if (stress >= 25) return `${consciousness}，${breathing}...应该...应该是这样的...`
  return `${consciousness}，${breathing}。`
}

export function worldReducer(state: WorldState, action: GameAction): WorldState {
  switch (action.type) {

    // ==========================================
    // START_SHIFT — 开始新班次
    // ==========================================
    case 'START_SHIFT': {
      const newShift = state.shiftNumber + 1
      const useQueue = action.forceScenarios ?? buildScenarioQueue(newShift)
      return {
        ...createInitialState(),
        screen: 'playing',
        shiftNumber: newShift,
        totalCalls: useQueue.length,     // 调试模式只播 1 通
        scenarioQueue: useQueue,
        // 为恶作剧电话设置标记：最后2通不能是恶作剧（太简单）
      }
    }

    // ==========================================
    // ANSWER_CALL — 接听电话
    // ==========================================
    case 'ANSWER_CALL': {
      if (state.callIndex >= state.totalCalls) return state

      const scenarioId = state.scenarioQueue[state.callIndex]
      if (!scenarioId) return state

      const scenario = getScenario(scenarioId)
      const callerProfile = getCaller(scenario.callerId)
      const initialStress = toneToInitialStress(callerProfile.tone)
      const callerState = createCallerState(scenario.callerId, initialStress)

      const openingLine: DialogueLine = {
        speaker: 'caller',
        text: scenario.openingLine,
        timestamp: state.shiftElapsed,
      }

      const systemLine: DialogueLine = {
        speaker: 'system',
        text: `【来电号码: ${scenario.phoneNumber} | 基站定位: ${scenario.baseStation} | 来电者情绪: ${callerState.stressLevel}】`,
        timestamp: state.shiftElapsed,
      }

      // 终端不再自动填入 — 玩家从对话中提取
      const terminal = createTerminalState()

      return {
        ...state,
        currentCall: scenario,
        callPhase: 'questioning',
        callStartTime: state.shiftElapsed,
        callerState,
        terminal,
        dispatchSent: false,
        dispatchRecord: null,
        ambulanceRemaining: -1,
        guidanceActive: false,
        guidanceStepIndex: 0,
        guidanceResults: [],
        guidanceMinigameScores: [],
        pendingJudgments: [],
        dialogueLog: [systemLine, openingLine],
      }
    }

    // ==========================================
    // ASK_QUESTION — 叙述式问询：来电者絮叨回答，玩家需从混乱中摘取关键信息
    // ==========================================
    case 'ASK_QUESTION': {
      const { questionId } = action
      const call = state.currentCall
      let cs = state.callerState
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
      let newJudgments: JudgmentPrompt[] = [...(state.pendingJudgments ?? [])]
      let newTerminal = { ...state.terminal }

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
        newDialogue.push({ speaker: 'operator', text: '旁边有什么标志性建筑或者明显的店铺吗？', timestamp: now })
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
        const shuffledDists = distractorProtocols.sort(() => Math.random() - 0.5).slice(0, 3)
        const options = [correctProtocol, ...shuffledDists].sort(() => Math.random() - 0.5)
        const protoNameMap = Object.fromEntries(PROTOCOL_REF)
        const callerIdx = newDialogue.findIndex(d => d.speaker === 'caller')
        newJudgments.push({
          id: `judge_step2_protocol_${Date.now()}`,
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

      // --- 步骤3：患者年龄 ---
      else if (questionId === 'step3_age') {
        stressEffect = -4
        newDialogue.push({ speaker: 'operator', text: '患者多大年龄了？', timestamp: now })
        const age = call.fourElements.condition.age
        const ageText = generateAgeNarrative(age, newStress, call.fourElements.condition.gender)
        newDialogue.push({ speaker: 'caller', text: ageText, timestamp: now })
        newRevealed.age = newStress < 75
        newInfoQuality['age'] = newStress >= 75 ? 'vague' : newStress >= 50 ? 'partial' : 'clear'

        // 生成年龄判断卡：提取干净年龄，避免"精确45岁左右"矛盾
        const ageStripped = age.replace(/左右|约|多岁|大概|男性|女性|男|女|不详/gi, '').trim()
        const isAgePrecise = ageStripped === age
        const callerIdx = newDialogue.findIndex(d => d.speaker === 'caller')
        newJudgments.push({
          id: `judge_step3_${Date.now()}`,
          questionId: 'step3_age',
          dialogueIndex: state.dialogueLog.length + (callerIdx >= 0 ? callerIdx : 1),
          question: '来电者描述的年龄信息，你应该如何记录？',
          options: [
            { label: `精确记录：${ageStripped}`, fills: [{ field: 'patientAge', value: ageStripped }], isCorrect: isAgePrecise },
            { label: `估计记录：约${ageStripped}（来电者不确定）`, fills: [{ field: 'patientAge', value: ageStripped }, { field: 'conditionNote', value: '年龄为估计值' }], isCorrect: !isAgePrecise },
            { label: '无法确认，留空待核实', fills: [], isCorrect: false },
          ],
          chosenOptionIndex: null,
        })
      }

      // --- 步骤4：意识与呼吸（最关键评估）---
      else if (questionId === 'step4_vitals') {
        stressEffect = -10
        newDialogue.push({ speaker: 'operator', text: '患者清醒吗？他/她还有呼吸吗？', timestamp: now })
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
          id: `judge_step4_${Date.now()}`,
          questionId: 'step4_vitals',
          dialogueIndex: state.dialogueLog.length + (callerIdx2 >= 0 ? callerIdx2 : 1),
          question: '根据来电者描述，请判断患者意识与呼吸状态：',
          options: [
            { label: '有意识，呼吸正常', fills: [{ field: 'conscious', value: false }, { field: 'breathing', value: false }], isCorrect: !isUnconscious && !isNotBreathing && !isBreathingAbnormal },
            { label: '有意识，呼吸困难', fills: [{ field: 'conscious', value: false }, { field: 'breathing', value: true }, { field: 'conditionNote', value: '呼吸异常' }], isCorrect: !isUnconscious && isBreathingAbnormal },
            { label: '无意识，无呼吸', fills: [{ field: 'conscious', value: true }, { field: 'breathing', value: true }], isCorrect: isUnconscious && isNotBreathing },
            { label: '无意识，有呼吸', fills: [{ field: 'conscious', value: true }, { field: 'breathing', value: false }], isCorrect: isUnconscious && !isNotBreathing },
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
            id: `judge_${questionId}_${Date.now()}`,
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

      const updatedRevealed = { ...newRevealed, address: newAddress }

      return {
        ...state,
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

    // ==========================================
    // CALM_CALLER — 安抚来电者情绪（消耗时间但提高答案质量）
    // ==========================================
    case 'CALM_CALLER': {
      if (!state.currentCall || !state.callerState) return state
      if (state.callPhase !== 'questioning' && state.callPhase !== 'connected') return state

      const cs = state.callerState
      const now = state.shiftElapsed
      const stressDrop = 20 + Math.floor(Math.random() * 10)  // 降低20-30点压力
      const newStress = Math.max(0, cs.stress - stressDrop)
      const newStressLevel = stressToLevel(newStress)

      const calmPhrases = [
        '请您深呼吸，慢慢说。救护车启动需要您提供准确信息。',
        '我理解您很着急，但请您尽量保持冷静，我需要您的帮助。',
        '别担心，我会一直在这个电话上。请您配合我，我们一步步来。',
        '您做得很好，请继续保持。现在我需要再确认几个信息。',
      ]
      const phrase = calmPhrases[Math.floor(Math.random() * calmPhrases.length)]

      const opLine: DialogueLine = { speaker: 'operator', text: phrase, timestamp: now }
      const callerLine: DialogueLine = {
        speaker: 'caller', text: '好...好的，我尽量...你说...',
        timestamp: now,
      }

      return {
        ...state,

        callerState: {
          ...cs,
          stress: newStress,
          stressLevel: newStressLevel,
        },
        dialogueLog: [...state.dialogueLog, opLine, callerLine],
      }
    }

    // ==========================================
    // UPDATE_TERMINAL — 更新终端登记
    // ==========================================
    case 'UPDATE_TERMINAL': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          [action.field]: action.value,
        },
      }
    }

    // ==========================================
    // SET_PATIENT_STATUS — 设置患者生命体征
    // ==========================================
    case 'SET_PATIENT_STATUS': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          [action.field]: action.value,
        },
      }
    }

    // ==========================================
    // SET_MPDS_DETERMINANT — 设置MPDS判定码
    // ==========================================
    case 'SET_MPDS_DETERMINANT': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          determinant: action.determinant,
        },
      }
    }

    // ==========================================
    // SET_DETERMINANT_SUBCODE — 设置判定码最后一位子编码
    // ==========================================
    case 'SET_DETERMINANT_SUBCODE': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          determinantSubcode: action.subcode,
        },
      }
    }

    // ==========================================
    // SET_PROTOCOL — 设置MPDS协议编号
    // ==========================================
    case 'SET_PROTOCOL': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          protocolNumber: action.protocolNumber,
        },
      }
    }

    // ==========================================
    // SET_TRIAGE — 设置分诊等级
    // ==========================================
    case 'SET_TRIAGE': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          triage: action.level,
        },
      }
    }

    // ==========================================
    // MAKE_JUDGMENT — 玩家从临床判断选择题中选择答案
    // ==========================================
    case 'MAKE_JUDGMENT': {
      const { judgmentId, chosenOptionIndex } = action
      const idx = state.pendingJudgments.findIndex(j => j.id === judgmentId)
      if (idx < 0) return state

      const updatedJudgment = { ...state.pendingJudgments[idx], chosenOptionIndex }
      const newJudgments = [...state.pendingJudgments]
      newJudgments[idx] = updatedJudgment

      // 应用判断选择的终端填充
      const selectedOption = updatedJudgment.options[chosenOptionIndex]
      let newTerminal = { ...state.terminal }
      if (selectedOption) {
        for (const fill of selectedOption.fills) {
          if (fill.field === 'conscious') {
            newTerminal = { ...newTerminal, conscious: fill.value as boolean }
          } else if (fill.field === 'breathing') {
            newTerminal = { ...newTerminal, breathing: fill.value as boolean }
          } else if (fill.field === 'protocolNumber') {
            newTerminal = { ...newTerminal, protocolNumber: parseInt(fill.value as string, 10) || null }
          } else {
            newTerminal = { ...newTerminal, [fill.field]: fill.value }
          }
        }
      }

      return {
        ...state,
        pendingJudgments: newJudgments,
        terminal: newTerminal,
      }
    }

    // ==========================================
    // DISPATCH — 派出救护车
    // ==========================================
    case 'DISPATCH': {
      if (!state.currentCall || !state.callerState) return state
      if (state.dispatchSent) return state

      const dispatchTime = state.shiftElapsed - state.callStartTime
      const rawAddress = state.callerState.revealedInfo.address
      const addressCompleteness: 'vague' | 'partial' | 'full' =
        rawAddress === 'none' ? 'vague' : rawAddress

      // 从MPDS判定码自动推导分诊等级（现场分诊由急救人员执行，调度员无需手动选择）
      const derivedTriage = state.terminal.determinant
        ? determinantToTriage(state.terminal.determinant)
        : null
      const triage = derivedTriage || state.currentCall.correctTriage

      const eta = calcAmbulanceETA(dispatchTime, addressCompleteness)

      const systemLine: DialogueLine = {
        speaker: 'system',
        text: `【▸ 救护车已派出 — 分诊等级: ${triage === 'red' ? '红色(濒危)' : triage === 'yellow' ? '黄色(危重)' : triage === 'green' ? '绿色(轻伤)' : '黑色'} | 预计到达: ${eta}秒 | 派车耗时: ${dispatchTime}秒】`,
        timestamp: state.shiftElapsed,
      }

      const record = {
        callId: state.currentCall.id,
        dispatchTime,
        triage,
        addressCompleteness,
        ambulanceETA: eta,
      }

      // 检查是否需要进入急救指导阶段
      const hasGuidance = state.currentCall.guidance !== null

      return {
        ...state,
        dispatchSent: true,
        dispatchRecord: record,
        ambulanceRemaining: eta,
        callPhase: hasGuidance ? 'guidance' : 'closing',
        guidanceActive: hasGuidance,
        guidanceStepIndex: 0,
        guidanceResults: hasGuidance
          ? new Array(state.currentCall.guidance!.steps.length).fill(null)
          : [],
        guidanceMinigameScores: hasGuidance
          ? new Array(state.currentCall.guidance!.steps.length).fill(null)
          : [],
        dialogueLog: [...state.dialogueLog, systemLine],
      }
    }

    // ==========================================
    // ANSWER_GUIDANCE — 回答急救指导（记录结果，直接推进下一步）
    // ==========================================
    case 'ANSWER_GUIDANCE': {
      if (!state.currentCall?.guidance) return state
      if (!state.guidanceActive) return state
      if (state.callPhase !== 'guidance') return state

      const guidanceDef = state.currentCall.guidance
      const step = guidanceDef.steps[action.stepIndex]
      if (!step) return state

      const isCorrect = action.selectedIndex === step.correctIndex
      const now = state.shiftElapsed

      const callerText = isCorrect ? step.feedback.callerCorrect : step.feedback.callerIncorrect

      const operatorLine: DialogueLine = {
        speaker: 'operator',
        text: step.instruction,
        timestamp: now,
      }
      const feedbackLine: DialogueLine = {
        speaker: 'caller',
        text: callerText,
        timestamp: now,
      }

      const newResults = [...state.guidanceResults]
      newResults[action.stepIndex] = isCorrect ? 'correct' : 'incorrect'

      const nextIndex = action.stepIndex + 1
      const isLastStep = nextIndex >= guidanceDef.steps.length

      return {
        ...state,
        guidanceStepIndex: nextIndex,
        guidanceResults: newResults,
        callPhase: isLastStep ? 'closing' : 'guidance',
        dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
      }
    }

    // ==========================================
    // COMPLETE_MINIGAME — 互动小游戏完成（记录分数，推进步骤）
    // ==========================================
    case 'COMPLETE_MINIGAME': {
      if (!state.currentCall?.guidance) return state
      if (!state.guidanceActive) return state
      if (state.callPhase !== 'guidance') return state

      const guidanceDef = state.currentCall.guidance
      const step = guidanceDef.steps[action.stepIndex]
      if (!step?.miniGame) return state

      const now = state.shiftElapsed
      const spec = step.miniGame
      const callerText = action.passed ? spec.feedback.good : spec.feedback.bad
      const operatorLine: DialogueLine = {
        speaker: 'operator',
        text: `【实操指导：${spec.title}】${action.passed ? '操作到位' : '操作需改进'}（评分 ${(action.score * 100).toFixed(0)}）`,
        timestamp: now,
      }
      const feedbackLine: DialogueLine = {
        speaker: 'caller',
        text: callerText,
        timestamp: now,
      }

      const newScores = [...state.guidanceMinigameScores]
      newScores[action.stepIndex] = action.score

      const nextIndex = action.stepIndex + 1
      const isLastStep = nextIndex >= guidanceDef.steps.length

      return {
        ...state,
        guidanceStepIndex: nextIndex,
        guidanceMinigameScores: newScores,
        callPhase: isLastStep ? 'closing' : 'guidance',
        dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
      }
    }

    // ==========================================
    // END_CALL — 结束当前通话
    // ==========================================
    case 'END_CALL': {
      if (!state.currentCall || !state.callerState) return state

      const call = state.currentCall
      const cs = state.callerState
      const dispatchRecord = state.dispatchRecord
      const didDispatch = dispatchRecord !== null

      // 计算本通电话得分
      let total: number
      let speed = 0
      let info = 0
      let triageScore = 0
      let decisionScore = 0
      let guidanceScore = 0

      // 恶作剧电话特殊评分
      if (call.isPrank) {
        if (!didDispatch) {
          total = 100
          speed = 35
          info = 30
          triageScore = 20
          guidanceScore = 10
        } else {
          total = 0
          speed = 0
          info = 0
          triageScore = 0
          guidanceScore = 0
        }
      } else {
        // 统计信息质量加分
        const qualityCount = Object.values(cs.infoQuality)
        const clearCount = qualityCount.filter(q => q === 'clear').length
        const qualityBonus = Math.min(5, clearCount)

        // 解析场景的预期判定码（如 "9-E-1" → 协议9, 字母E, 子码1）
        const detParts = call.mpdsCard.determinantCode.split('-')
        const correctProto = parseInt(detParts[0], 10) || 0


        const guidanceSteps = call.guidance?.steps ?? []
        const choiceStepTotal = guidanceSteps.filter(st => !st.miniGame).length
        const mgScores = state.guidanceMinigameScores.filter(s => s != null) as number[]
        const miniGameAvg = mgScores.length ? mgScores.reduce((a, b) => a + b, 0) / mgScores.length : 0

        const result = scoreCall(
          dispatchRecord?.dispatchTime ?? null,
          dispatchRecord?.addressCompleteness ?? 'vague',
          cs.revealedInfo.contact,
          cs.revealedInfo.chiefComplaint,
          cs.revealedInfo.purpose,
          dispatchRecord?.triage ?? null,
          call.correctTriage,
          state.guidanceResults.filter(r => r === 'correct').length,
          choiceStepTotal,
          miniGameAvg,
          qualityBonus,
          state.terminal.protocolNumber,
          correctProto,
          state.terminal.determinant,
          call.mpdsCard.determinantCode,
          state.terminal.determinantSubcode,
        )
        total = result.total
        speed = result.speed
        info = result.info
        triageScore = result.triage
        guidanceScore = result.guidance
        decisionScore = result.decision
      }

      const nextCallIndex = state.callIndex + 1
      const isShiftOver = nextCallIndex >= state.totalCalls

      // 通话结束的总结行
      const summaryLine: DialogueLine = {
        speaker: 'system',
        text: `【通话结束 | 总分:${total}/100 — 速度:${speed} 信息:${info} 分诊:${triageScore} 判定:${decisionScore} 指导:${guidanceScore}】`,
        timestamp: state.shiftElapsed,
      }

      return {
        ...state,
        callIndex: nextCallIndex,
        callPhase: 'completed',
        currentCall: null,
        callerState: null,
        dispatchSent: false,
        dispatchRecord: null,
        ambulanceRemaining: -1,
        guidanceActive: false,
        totalScore: state.totalScore + total,
        callScores: [...state.callScores, total],
        dialogueLog: [...state.dialogueLog, summaryLine],
        screen: isShiftOver ? 'ending' : 'playing',
      }
    }

    // ==========================================
    // TICK — 时钟滴答（每秒）
    // ==========================================
    case 'TICK': {
      if (state.screen !== 'playing') return state

      const newElapsed = state.shiftElapsed + 1
      let newAmbulanceRemaining = state.ambulanceRemaining
      let newCallPhase = state.callPhase as CallPhase
      const newDialogue: DialogueLine[] = []

      // 救护车倒计时
      if (state.dispatchSent && state.ambulanceRemaining > 0) {
        newAmbulanceRemaining -= 1
        if (newAmbulanceRemaining === 0) {
          newDialogue.push({
            speaker: 'system',
            text: '【▸ 救护车已到达现场】',
            timestamp: newElapsed,
          })
        }
      }

      // 检查时间触发的事件
      if (state.currentCall && state.callerState) {
        for (const evt of state.currentCall.specialEvents) {
          if (evt.trigger === 'time_elapsed' && evt.triggerValue) {
            const triggerSec = parseInt(evt.triggerValue, 10)
            const callTime = newElapsed - state.callStartTime
            // 在触发秒数时触发（仅一次）
            if (callTime === triggerSec) {
              // 检查是否已经插入过这个事件
              const alreadyInserted = state.dialogueLog.some(
                l => l.text === evt.dialogue
              )
              if (!alreadyInserted) {
                newDialogue.push({
                  speaker: 'caller',
                  text: evt.dialogue,
                  timestamp: newElapsed,
                })
              }
            }
          }
        }
      }

      return {
        ...state,
        shiftElapsed: newElapsed,
        ambulanceRemaining: newAmbulanceRemaining,
        callPhase: newCallPhase,
        dialogueLog: state.dialogueLog.length > 0 || newDialogue.length > 0
          ? [...state.dialogueLog, ...newDialogue]
          : state.dialogueLog,
      }
    }

    // ==========================================
    // SHOW_ENDING — 显示结局
    // ==========================================
    case 'SHOW_ENDING': {
      return { ...state, screen: 'ending' }
    }

    // ==========================================
    // BACK_TO_TITLE — 返回标题
    // ==========================================
    case 'BACK_TO_TITLE': {
      return createInitialState()
    }

    default:
      return state
  }
}

export type { GameAction }
