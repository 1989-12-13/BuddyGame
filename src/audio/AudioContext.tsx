// ============================================================
// 零点接线台 — 音效 + TTS 全局上下文
// ============================================================

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useGameAudio, type GameAudioCue } from './useGameAudio'
import { TtsPlayer } from './ttsPlayer'

export interface AudioAPI {
  /** 合成音效 (ring/connect/dispatch/...) */
  play: (cue: GameAudioCue) => void
  /** TTS 播放队列, 组件通过 enqueue() 让来电者/系统发声 */
  tts: TtsPlayer
}

const AudioCtx = createContext<AudioAPI | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const { play } = useGameAudio()
  const ttsRef = useRef<TtsPlayer | null>(null)
  if (!ttsRef.current) ttsRef.current = new TtsPlayer()

  return (
    <AudioCtx.Provider value={{ play, tts: ttsRef.current }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio(): AudioAPI {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}