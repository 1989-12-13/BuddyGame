import { useEffect, useRef, useState, useCallback } from 'react'
import type { WorldState } from '../../../game/types'
import type { AudioAPI } from '../../../audio/AudioContext'
import { stressToTypewriterInterval, stressToEmotion } from '../../../audio/ttsEmotion'

const LINE_GAP_MS = 300  // 行间停顿，模拟换气停顿

/**
 * 流式逐字显示：多行排队依次输出。
 *
 * 改造要点：
 * 1. isStreaming 用 useState 暴露给渲染层，按钮可据此禁用
 * 2. 用时间戳锁 (lockUntilRef) 替代布尔标志，避免 300ms 间隙窗口被 useEffect 提前触发
 * 3. 组件卸载时清理所有定时器
 */
export function useStreamingQueue(state: WorldState, audio: AudioAPI) {
  const prevLogLen = useRef(0)                         // 上一次已处理的对话行数
  const pendingSet = useRef(new Set<number>())          // 已入队、尚未流式完毕的行索引
  const pendingQueue = useRef<{ idx: number; text: string }[]>([])  // 待流式的行队列
  const timerId = useRef<number | null>(null)           // setInterval 定时器
  const gapTimerId = useRef<number | null>(null)        // setTimeout 行间隙定时器
  const lockUntilRef = useRef(0)                        // 时间戳锁：此时间之前不可处理新行
  const [isStreaming, setIsStreaming] = useState(false) // 渲染层可见的流式状态
  const [streamIdx, setStreamIdx] = useState(-1)        // 正在流式的行
  const [streamPos, setStreamPos] = useState(0)         // 已显示字符数

  // 清理所有定时器
  const clearAllTimers = useCallback(() => {
    if (timerId.current !== null) {
      clearInterval(timerId.current)
      timerId.current = null
    }
    if (gapTimerId.current !== null) {
      clearTimeout(gapTimerId.current)
      gapTimerId.current = null
    }
  }, [])

  // 启动队列处理
  const startQueue = useCallback(() => {
    // 时间戳锁：仍在锁定期内则跳过
    if (Date.now() < lockUntilRef.current) return
    clearAllTimers()

    if (pendingQueue.current.length === 0) {
      setStreamIdx(-1)
      setStreamPos(0)
      setIsStreaming(false)
      return
    }

    setIsStreaming(true)
    const item = pendingQueue.current.shift()!
    pendingSet.current.delete(item.idx)
    const chars = [...item.text]
    setStreamIdx(item.idx)
    setStreamPos(0)

    let pos = 0
    const interval = stressToTypewriterInterval(state.callerState?.stress ?? 50)
    timerId.current = window.setInterval(() => {
      pos += 1
      if (pos >= chars.length) {
        setStreamPos(chars.length)
        clearAllTimers()
        // 行间锁定：锁住 LINE_GAP_MS 毫秒，防止 useEffect 提前触发下一行
        lockUntilRef.current = Date.now() + LINE_GAP_MS
        gapTimerId.current = window.setTimeout(() => startQueue(), LINE_GAP_MS)
      } else {
        setStreamPos(pos)
      }
    }, interval)
  }, [state.callerState?.stress, clearAllTimers])

  // 组件卸载清理
  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [clearAllTimers])

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
        audio.tts.enqueue(`caller-${i}`, {
          text: line.text,
          kind: 'caller',
          emotion: stressToEmotion(stress),
        }).catch(() => undefined)
      }
    }

    startQueue()
  }, [state.dialogueLog.length, startQueue, state.callerState?.stress, audio.tts])

  return { streamIdx, streamPos, pendingSet, isStreaming }
}
