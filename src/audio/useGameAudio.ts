import { useCallback, useEffect, useRef } from 'react'

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

class GameAudioEngine {
  private context: AudioContext | null = null

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

  close() {
    if (this.context) void this.context.close()
    this.context = null
  }
}

export function useGameAudio() {
  const engineRef = useRef<GameAudioEngine | null>(null)
  if (!engineRef.current) engineRef.current = new GameAudioEngine()

  useEffect(() => () => engineRef.current?.close(), [])

  const play = useCallback((cue: GameAudioCue, volume?: number) => {
    engineRef.current?.play(cue, volume ?? DEFAULT_VOLUME)
  }, [])

  return { play }
}
