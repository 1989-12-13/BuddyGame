// ============================================================
// 零点接线台 — 音效 + TTS 全局上下文
// ============================================================

import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react'
import { useGameAudio, type GameAudioCue } from './useGameAudio'
import { TtsPlayer } from './ttsPlayer'

const VOLUME_KEY = 'buddy-game-volume'

export interface AudioAPI {
  /** 合成音效 (ring/connect/dispatch/...) */
  play: (cue: GameAudioCue) => void
  /** 救护车鸣笛 — 单次 4 秒 + 渐入渐出包络 */
  playSiren: () => void
  /** TTS 播放队列, 组件通过 enqueue() 让来电者/系统发声 */
  tts: TtsPlayer
  /** 当前音量 0-1 */
  volume: number
  /** 设置音量 */
  setVolume: (v: number) => void
}

const AudioCtx = createContext<AudioAPI | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const { play: rawPlay, playSiren: rawPlaySiren } = useGameAudio()
  const ttsRef = useRef<TtsPlayer | null>(null)
  if (!ttsRef.current) {
    try {
      ttsRef.current = new TtsPlayer()
    } catch (e) {
      console.error('[audio] TtsPlayer init failed:', e)
      ttsRef.current = new TtsPlayer({ enabled: false })
    }
  }

  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 0.65
    const saved = localStorage.getItem(VOLUME_KEY)
    return saved ? parseFloat(saved) : 0.65
  })

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    localStorage.setItem(VOLUME_KEY, String(clamped))
  }, [])

  const play = useCallback((cue: GameAudioCue) => {
    try { rawPlay(cue, volume) } catch (e) { console.warn('[audio] play failed:', e) }
  }, [rawPlay, volume])

  const playSiren = useCallback(() => {
    try { rawPlaySiren(volume) } catch (e) { console.warn('[audio] siren failed:', e) }
  }, [rawPlaySiren, volume])

  return (
    <AudioCtx.Provider value={{ play, playSiren, tts: ttsRef.current, volume, setVolume }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio(): AudioAPI {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}