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
  /** TTS 播放队列, 组件通过 enqueue() 让来电者/系统发声 */
  tts: TtsPlayer
  /** 当前音量 0-1 */
  volume: number
  /** 设置音量 */
  setVolume: (v: number) => void
}

const AudioCtx = createContext<AudioAPI | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const { play: rawPlay } = useGameAudio()
  const ttsRef = useRef<TtsPlayer | null>(null)
  if (!ttsRef.current) ttsRef.current = new TtsPlayer()

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
    rawPlay(cue, volume)
  }, [rawPlay, volume])

  return (
    <AudioCtx.Provider value={{ play, tts: ttsRef.current, volume, setVolume }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio(): AudioAPI {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}