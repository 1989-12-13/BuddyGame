// ============================================================
// TTS 播放队列管理器
// - 入队的 TTS 请求按顺序合成并播放
// - 同一时刻最多 1 条在播放 (避免费用激增 + 听觉混乱)
// - 新通话开始或场景销毁时调用 stop() 取消所有进行中任务
// ============================================================

import { synthesizeSpeech, type TtsRequest } from './ttsClient'
import { logger } from '../utils/logger'

interface QueueItem {
  id: string
  req: TtsRequest
  resolve: () => void
  reject: (err: Error) => void
}

export interface TtsPlayerOptions {
  /** 是否启用, false 时 enqueue 直接 resolve (用于静音场景) */
  enabled?: boolean
  /** 全局静音 (已合成的也不出声) */
  muted?: boolean
}

export class TtsPlayer {
  private queue: QueueItem[] = []
  private playing = false
  private currentAudio: HTMLAudioElement | null = null
  private currentUrl: string | null = null
  private abortController: AbortController | null = null
  private enabled = true
  private muted = false

  constructor(opts: TtsPlayerOptions = {}) {
    if (opts.enabled !== undefined) this.enabled = opts.enabled
    if (opts.muted !== undefined) this.muted = opts.muted
  }

  setEnabled(v: boolean): void {
    this.enabled = v
    if (!v) this.stop()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setMuted(v: boolean): void {
    this.muted = v
    if (this.currentAudio) this.currentAudio.muted = v
  }

  /** 入队一条 TTS, 返回 Promise 在播放完毕后 resolve; 出错 reject */
  enqueue(id: string, req: TtsRequest): Promise<void> {
    if (!this.enabled) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ id, req, resolve, reject })
      this.pump()
    })
  }

  /** 取消所有进行中 + 队列里的项, 不抛错 */
  stop(): void {
    this.abortController?.abort()
    this.abortController = null
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.removeAttribute('src')
      this.currentAudio = null
    }
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl)
      this.currentUrl = null
    }
    // 清空队列, 静默 resolve (调用方不需要感知被取消)
    const pending = this.queue.splice(0)
    for (const item of pending) item.resolve()
    this.playing = false
  }

  /** 当前队列长度 (含正在播放的) */
  pending(): number {
    return this.queue.length + (this.playing ? 1 : 0)
  }

  private pump(): void {
    if (this.playing) return
    const item = this.queue.shift()
    if (!item) return
    this.playing = true
    this.playOne(item).catch((err) => {
      // 静默吞错: 避免 reject 让上层一堆 unhandledrejection
      if (err?.name !== 'AbortError') {
        logger.warn('[tts] playback failed:', err?.message ?? err)
      }
      item.reject(err instanceof Error ? err : new Error(String(err)))
    }).finally(() => {
      this.playing = false
      if (this.queue.length > 0) this.pump()
    })
  }

  private async playOne(item: QueueItem): Promise<void> {
    this.abortController = new AbortController()
    const { url } = await synthesizeSpeech(item.req, this.abortController.signal)
    if (this.abortController.signal.aborted) {
      URL.revokeObjectURL(url)
      return
    }
    this.currentUrl = url
    const audio = new Audio(url)
    audio.muted = this.muted
    this.currentAudio = audio

    try {
      await new Promise<void>((resolve, reject) => {
        const onEnd = () => cleanup()
        const onErr = () => { cleanup(); reject(new Error('audio playback error')) }
        const cleanup = () => {
          audio.removeEventListener('ended', onEnd)
          audio.removeEventListener('error', onErr)
        }
        audio.addEventListener('ended', onEnd, { once: true })
        audio.addEventListener('error', onErr, { once: true })
        audio.play().catch((e) => {
          // 用户未交互时浏览器可能拒绝 autoplay, 降级为静默
          if (e?.name === 'NotAllowedError') {
            cleanup()
            resolve()
          } else {
            cleanup()
            reject(e)
          }
        })
      })
    } finally {
      this.currentAudio = null
      if (this.currentUrl) {
        URL.revokeObjectURL(this.currentUrl)
        this.currentUrl = null
      }
      item.resolve()
    }
  }
}