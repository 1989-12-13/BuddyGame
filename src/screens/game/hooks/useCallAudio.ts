import { useEffect, useRef } from 'react'
import type { WorldState } from '../../../game/types'
import type { AudioAPI } from '../../../audio/AudioContext'

/**
 * 承载原 GameScreen 的全部音效副作用：
 * ring / connect / dispatch(+siren) / arrival / question / success /
 * hangup / confirm，以及通话结束（currentCall 由有变无）时停掉未播完的 TTS。
 * 行为逐字节等价于原实现。
 */
export function useCallAudio(state: WorldState, audio: AudioAPI) {
  // 追踪音效状态
  const prevCallCount = useRef(state.callIndex)
  const prevDispatchSent = useRef(state.dispatchSent)
  const prevAmbulance = useRef(state.ambulanceRemaining)
  const prevCallPhase = useRef(state.callPhase)
  const prevDialogueLen = useRef(state.dialogueLog.length)
  const prevJudgments = useRef(state.pendingJudgments?.length ?? 0)

  // 来电铃声循环（无活跃通话且还有下一通时）
  useEffect(() => {
    if (!state.currentCall && state.callIndex < state.totalCalls) {
      const id = setInterval(() => audio.play('ring'), 4000)
      return () => clearInterval(id)
    }
  }, [state.currentCall, state.callIndex, state.totalCalls, audio])

  // 接听电话 → connect 音效
  useEffect(() => {
    if (state.currentCall && state.callIndex !== prevCallCount.current) {
      audio.play('connect')
    }
    prevCallCount.current = state.callIndex
  }, [state.currentCall, state.callIndex, audio])

  // 派车音效（合成提示音 + 救护车鸣笛）
  useEffect(() => {
    if (state.dispatchSent && !prevDispatchSent.current) {
      audio.play('dispatch')
      audio.playSiren()
    }
    prevDispatchSent.current = state.dispatchSent
  }, [state.dispatchSent, audio])

  // 救护车到达音效
  useEffect(() => {
    if (prevAmbulance.current > 0 && state.ambulanceRemaining === 0) {
      audio.play('arrival')
    }
    prevAmbulance.current = state.ambulanceRemaining
  }, [state.ambulanceRemaining, audio])

  // 问询/挂断/紧张音效 — 通过对话日志变化推断
  useEffect(() => {
    const curLen = state.dialogueLog.length
    if (curLen <= prevDialogueLen.current) {
      prevDialogueLen.current = curLen
      return
    }
    const newLines = state.dialogueLog.slice(prevDialogueLen.current)
    prevDialogueLen.current = curLen

    for (const line of newLines) {
      if (line.speaker === 'operator' && line.text.startsWith('请问')) {
        audio.play('question')
      }
      if (line.speaker === 'operator' && line.text.includes('做得好')) {
        audio.play('success')
      }
    }
  }, [state.dialogueLog, audio])

  // 通话结束音效
  useEffect(() => {
    if (prevCallPhase.current !== 'completed' && state.callPhase === 'completed') {
      audio.play('hangup')
    }
    prevCallPhase.current = state.callPhase
  }, [state.callPhase, audio])

  // 临床判断选择音效
  useEffect(() => {
    const curJudgments = state.pendingJudgments?.length ?? 0
    if (curJudgments > prevJudgments.current) {
      audio.play('confirm')
    }
    prevJudgments.current = curJudgments
  }, [state.pendingJudgments, audio])

  // 通话结束 (currentCall 由有变无) → 停掉所有未播完的 TTS
  const prevCallRef = useRef(state.currentCall)
  useEffect(() => {
    if (prevCallRef.current && !state.currentCall) {
      audio.tts.stop()
    }
    prevCallRef.current = state.currentCall
  }, [state.currentCall, audio.tts])

  /** 玩家动作会触发新的来电者回应 → 打断正在播放/排队的旧来电者语音 */
  const interruptCallerVoice = () => {
    audio.tts.stop()
  }

  return { interruptCallerVoice }
}
