import { useCallback, useEffect, useRef } from 'react'
import { logger } from '../utils/logger'

export type GameAudioCue =
  | 'connect'
  | 'question'
  | 'confirm'
  | 'warning'
  | 'dispatch'
  | 'arrival'
  | 'hangup'
  | 'ring'
  | 'ringback'
  | 'success'
  | 'error'

const DEFAULT_VOLUME = 0.65

const CUE_PATTERNS: Record<GameAudioCue, Array<[frequency: number, delay: number, duration: number]>> = {
  connect: [[520, 0, 0.08], [720, 0.1, 0.12]],
  question: [[420, 0, 0.05]],
  confirm: [[660, 0, 0.06]],
  warning: [[880, 0, 0.1], [660, 0.14, 0.1], [880, 0.28, 0.12]],
  dispatch: [[440, 0, 0.08], [660, 0.1, 0.08], [880, 0.2, 0.16]],
  arrival: [[740, 0, 0.08], [980, 0.1, 0.18]],
  hangup: [[520, 0, 0.08], [320, 0.1, 0.16]],
  ring: [[440, 0, 0.3], [0, 0.35, 0.05], [440, 0.4, 0.3], [0, 0.45, 0.05], [440, 0.5, 0.3]],
  ringback: [[400, 0, 0.15], [0, 0.2, 0.1], [500, 0.3, 0.15], [0, 0.5, 0.1]],
  success: [[523, 0, 0.08], [659, 0.1, 0.08], [784, 0.2, 0.18]],
  error: [[300, 0, 0.1], [250, 0.14, 0.1], [200, 0.28, 0.2]],
}

/* ============================================================
 * 救护车鸣笛 — 真实音频文件 + 渐入渐出包络
 * 单次播放 4 秒，前 0.5s 渐入，后 3.5s 渐出至静音
 * 模拟「救护车从近处开走、声音渐渐消失」
 * ============================================================ */
const SIREN_URL = '/sounds/siren.mp3'
const SIREN_DURATION = 4.0
const SIREN_FADE_IN = 2.5
/** 相对音量的衰减系数 — 鸣笛尖锐刺耳, 比 UI 提示音更小 */
const SIREN_VOLUME_RATIO = 0.4

class GameAudioEngine {
  private context: AudioContext | null = null
  private sirenBuffer: AudioBuffer | null = null
  private sirenSource: AudioBufferSourceNode | null = null

  play(cue: GameAudioCue, volume: number) {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return

    if (!this.context) this.context = new AudioContextClass()
    const context = this.context
    const schedule = () => {
      const start = context.currentTime
      for (const [frequency, delay, duration] of CUE_PATTERNS[cue]) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = cue === 'warning' ? 'square' : 'sine'
        oscillator.frequency.setValueAtTime(frequency, start + delay)
        gain.gain.setValueAtTime(0.0001, start + delay)
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.12), start + delay + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + delay + duration)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start + delay)
        oscillator.stop(start + delay + duration + 0.02)
      }
    }

    if (context.state === 'suspended') {
      void context.resume().then(schedule).catch(() => undefined)
    } else {
      schedule()
    }
  }

  /**
   * 播放救护车鸣笛 — 异步：懒加载 mp3 → decode → 单次播放 + 渐入渐出
   * 若上一次未结束则先 stop，避免重叠
   */
  async playSiren(volume: number): Promise<void> {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return

    if (!this.context) this.context = new AudioContextClass()
    const context = this.context

    // 懒加载 + 解码（一次性）
    if (!this.sirenBuffer) {
      try {
        const res = await fetch(SIREN_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const arr = await res.arrayBuffer()
        this.sirenBuffer = await context.decodeAudioData(arr)
      } catch (err) {
        logger.warn('[audio] failed to load siren:', err)
        return
      }
    }

    // 取消上一次未结束的鸣笛（短时间内多次派车 / 引擎重启）
    this.stopSiren()

    // 确保 context 在运行（iOS autoplay 限制）
    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch {
        /* ignore */
      }
    }

    const targetVol = Math.max(0.0001, volume * SIREN_VOLUME_RATIO)
    const start = context.currentTime

    const source = context.createBufferSource()
    source.buffer = this.sirenBuffer

    const gain = context.createGain()
    // 包络：0 → target (0.5s) → 0.0001 (3.5s)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(targetVol, start + SIREN_FADE_IN)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + SIREN_DURATION)

    source.connect(gain)
    gain.connect(context.destination)

    source.start(start)
    // 多保留 0.05s 确保 fade envelope 走完不被提前打断
    source.stop(start + SIREN_DURATION + 0.05)

    this.sirenSource = source
    source.onended = () => {
      if (this.sirenSource === source) this.sirenSource = null
    }
  }

  /** 立即停止正在播放的鸣笛（fade 包络会被自然截断） */
  stopSiren(): void {
    if (this.sirenSource) {
      try {
        this.sirenSource.onended = null
        this.sirenSource.stop()
      } catch {
        /* 可能在已结束时再 stop */
      }
      this.sirenSource = null
    }
  }

  close() {
    this.stopSiren()
    if (this.context) void this.context.close()
    this.context = null
    this.sirenBuffer = null
  }
}

export function useGameAudio() {
  const engineRef = useRef<GameAudioEngine | null>(null)
  if (!engineRef.current) engineRef.current = new GameAudioEngine()

  useEffect(() => () => engineRef.current?.close(), [])

  const play = useCallback((cue: GameAudioCue, volume?: number) => {
    engineRef.current?.play(cue, volume ?? DEFAULT_VOLUME)
  }, [])

  const playSiren = useCallback((volume?: number) => {
    void engineRef.current?.playSiren(volume ?? DEFAULT_VOLUME)
  }, [])

  return { play, playSiren }
}