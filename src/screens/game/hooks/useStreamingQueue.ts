import { useEffect, useRef, useState, useCallback } from 'react'
import type { WorldState } from '../../../game/types'
import type { AudioAPI } from '../../../audio/AudioContext'
import { stressToTypewriterInterval, stressToEmotion } from '../../../audio/ttsEmotion'
import { pickSpeaker } from '../../../audio/ttsSpeakers'
import { getCaller } from '../../../game/npc/personas'

/**
 * 流式逐字显示：多行排队依次输出。
 * 承载原 GameScreen 的 prevLogLen / pendingSet / pendingQueue / timerId /
 * isProcessing / streamIdx / streamPos / startQueue 及相关 effect（对话新增行入队 + TTS 入队）。
 * 行为逐字节等价于原实现。
 */
export function useStreamingQueue(state: WorldState, audio: AudioAPI) {
  const prevLogLen = useRef(0)                         // 上一次已处理的对话行数
  const pendingSet = useRef(new Set<number>())          // 已入队、尚未流式完毕的行索引
  const pendingQueue = useRef<{ idx: number; text: string }[]>([])  // 待流式的行队列
  const timerId = useRef<number | null>(null)           // 定时器
  const isProcessing = useRef(false)                    // 是否正在处理队列
  const [streamIdx, setStreamIdx] = useState(-1)        // 正在流式的行
  const [streamPos, setStreamPos] = useState(0)         // 已显示字符数

  // 启动队列处理（幂等：已在处理中则跳过）
  const startQueue = useCallback(() => {
    if (isProcessing.current) return
    if (pendingQueue.current.length === 0) {
      setStreamIdx(-1)
      return
    }

    isProcessing.current = true
    const item = pendingQueue.current.shift()!
    pendingSet.current.delete(item.idx)   // 开始流式，移出待流式集合
    const chars = [...item.text]
    setStreamIdx(item.idx)
    setStreamPos(0)

    let pos = 0
    const interval = stressToTypewriterInterval(state.callerState?.stress ?? 50)
    timerId.current = window.setInterval(() => {
      pos += 1
      if (pos >= chars.length) {
        setStreamPos(chars.length)
        if (timerId.current !== null) {
          clearInterval(timerId.current)
          timerId.current = null
        }
        isProcessing.current = false
        // 行间短暂停顿后开始下一行
        setTimeout(() => startQueue(), 300)  // 行间停顿300ms，模拟换气停顿
      } else {
        setStreamPos(pos)
      }
    }, interval)  // 按 stress 分档: 65-120ms/char
  }, [state.callerState?.stress])

  // 新对话行入队
  useEffect(() => {
    const curLen = state.dialogueLog.length
    const oldLen = prevLogLen.current
    prevLogLen.current = curLen

    if (curLen <= oldLen) return

    for (let i = oldLen; i < curLen; i++) {
      const line = state.dialogueLog[i]
      // 系统提示行不流式，直接显示；仅来电者/接线员行逐字输出
      if (line.speaker !== 'system') {
        pendingQueue.current.push({ idx: i, text: line.text })
        pendingSet.current.add(i)
      }
      // TTS: 仅来电者发声 (接线员玩家自己, 系统提示不发声)
      if (line.speaker === 'caller') {
        const stress = state.callerState?.stress ?? 50
        // 按当前通话的来电者人口学选音色（性别 × 年龄档）
        const callerProfile = state.currentCall
          ? getCaller(state.currentCall.callerId)
          : null
        const speaker = callerProfile
          ? pickSpeaker(callerProfile.relationship, callerProfile.name)
          : undefined
        audio.tts.enqueue(`caller-${i}`, {
          text: line.text,
          kind: 'caller',
          emotion: stressToEmotion(stress),
          speaker,
        }).catch(() => undefined)
      }
    }

    startQueue()
  }, [state.dialogueLog.length, startQueue, state.callerState?.stress, audio.tts])

  return { streamIdx, streamPos, pendingSet }
}
