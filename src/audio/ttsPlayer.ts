import { synthesizeSpeech, type TtsRequest } from './ttsClient'
interface QueueItem { id: string; req: TtsRequest; resolve: () => void; reject: (err: Error) => void }
export interface TtsPlayerOptions { enabled?: boolean; muted?: boolean }
/** Each job owns its controller and URL; cancelled jobs cannot change a new call. */
export class TtsPlayer {
  private queue: QueueItem[] = []
  private active: QueueItem | null = null
  private controller: AbortController | null = null
  private currentAudio: HTMLAudioElement | null = null
  private generation = 0
  private paused = false
  private enabled = true
  private muted = false
  private volume = 0.65
  constructor(opts: TtsPlayerOptions = {}) { this.enabled = opts.enabled ?? true; this.muted = opts.muted ?? false }
  setEnabled(value: boolean) { this.enabled = value; if (!value) this.stop() }
  isEnabled() { return this.enabled }
  setMuted(value: boolean) { this.muted = value; if (this.currentAudio) this.currentAudio.muted = value }
  setVolume(value: number) { this.volume = value; if (this.currentAudio) this.currentAudio.volume = value }
  setPaused(value: boolean) {
    this.paused = value
    if (value) this.currentAudio?.pause()
    else if (this.currentAudio) void this.currentAudio.play().catch(() => this.stop())
    else this.pump()
  }
  enqueue(id: string, req: TtsRequest): Promise<void> {
    if (!this.enabled) return Promise.resolve()
    return new Promise((resolve, reject) => { this.queue.push({ id, req, resolve, reject }); this.pump() })
  }
  stop() {
    this.generation++
    this.controller?.abort()
    this.currentAudio?.pause()
    this.active?.resolve()
    this.queue.splice(0).forEach(item => item.resolve())
    this.active = null; this.controller = null; this.currentAudio = null
  }
  pending() { return this.queue.length + (this.active ? 1 : 0) }
  private pump() {
    if (this.active || this.paused || !this.enabled) return
    const item = this.queue.shift()
    if (!item) return
    const generation = this.generation
    const controller = new AbortController()
    this.active = item; this.controller = controller
    void this.playOne(controller, item, generation).then(item.resolve, item.reject).finally(() => {
      if (generation !== this.generation) return
      this.active = null; this.controller = null; this.currentAudio = null; this.pump()
    })
  }
  private async playOne(controller: AbortController, item: QueueItem, generation: number) {
    let url: string | undefined
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
      const result = await synthesizeSpeech(item.req, controller.signal)
      clearTimeout(timeout); url = result.url
      if (controller.signal.aborted || generation !== this.generation) return
      const audio = new Audio(url)
      this.currentAudio = audio; audio.volume = this.volume; audio.muted = this.muted
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          audio.removeEventListener('ended', done); audio.removeEventListener('error', error)
          controller.signal.removeEventListener('abort', done)
        }
        const done = () => { cleanup(); resolve() }
        const error = () => { cleanup(); reject(new Error('语音不可用，字幕仍可阅读')) }
        audio.addEventListener('ended', done, { once: true }); audio.addEventListener('error', error, { once: true })
        controller.signal.addEventListener('abort', done, { once: true })
        if (!this.paused) void audio.play().catch(error)
      })
    } finally { clearTimeout(timeout); if (url) URL.revokeObjectURL(url) }
  }
}
