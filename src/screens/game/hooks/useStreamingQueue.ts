import { useEffect, useRef, useState, useCallback } from 'react'
import type { WorldState } from '../../../game/types'
import { stressToTypewriterInterval } from '../../../audio/ttsEmotion'

const LINE_GAP_MS = 320  // 行间停顿，模拟换气停顿

/**
 * 字幕流式逐字显示：对话记录里的新行排队依次「打出来」。
 *
 * - 系统提示行不流式，直接完整显示。
 * - 每行按当前压力决定打字间隔（越慌说话越急，字出得越快）。
 * - 行与行之间留 LINE_GAP_MS 的换气停顿，读起来像真人在说，
 *   而不是一整段被灌进屏幕。
 *
 * 只负责字幕；语音仍由 WorkbenchScreen 现有的 TTS 队列负责。
 */
export function useStreamingQueue(state: WorldState) {
  const prevLogLen = useRef(0)                         // 上一次已处理的对话行数
  const pendingSet = useRef(new Set<number>())          // 已入队、尚未流式完毕的行索引
  const pendingQueue = useRef<{ idx: number; text: string }[]>([])  // 待流式的行队列
  const timerId = useRef<number | null>(null)           // setInterval 定时器
  const gapTimerId = useRef<number | null>(null)        // setTimeout 行间隙定时器
  const lockUntilRef = useRef(0)                        // 时间戳锁：此时间之前不可处理新行
  const [isStreaming, setIsStreaming] = useState(false) // 渲染层可见的流式状态
  const [streamIdx, setStreamIdx] = useState(-1)        // 正在流式的行
  const [streamPos, setStreamPos] = useState(0)         // 已显示字符数
  const [queueVersion, setQueueVersion] = useState(0)   // 队列版本：每次入队自增，迫使渲染层刷新「正在说」占位

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
    // 时间戳锁：行间停顿（换气）期间，不能立即处理新行。
    // 关键：若新行正是在此间隙内到达，startQueue 被 effect 提前调用，
    // 此时 clearAllTimers 已把行末设置的 gap 定时器误杀，必须按剩余
    // 时间重建一个，否则动画链断裂——队列断在原地、新行整行显示但不逐字。
    if (Date.now() < lockUntilRef.current) {
      if (gapTimerId.current === null) {
        const wait = Math.max(lockUntilRef.current - Date.now(), 0)
        gapTimerId.current = window.setTimeout(() => startQueue(), wait)
      }
      return
    }
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
    }
    // 通知渲染层「有新行进来排队等开口」：即使 startQueue 此刻被行间锁挡下，
    // 也能触发一次重渲染，把这些行以「正在说」占位呈现，而不是整句先亮相。
    setQueueVersion(v => v + 1)

    startQueue()
  }, [state.dialogueLog, startQueue, state.callerState?.stress])

  return { streamIdx, streamPos, pendingSet, isStreaming, queueVersion }
}
