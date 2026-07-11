// ============================================================
// 零点接线台 — 音效全局上下文
// ============================================================

import { createContext, useContext, type ReactNode } from 'react'
import { useGameAudio, type GameAudioCue } from './useGameAudio'

export interface AudioAPI {
  play: (cue: GameAudioCue) => void
}

const AudioCtx = createContext<AudioAPI | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const audio = useGameAudio()
  return <AudioCtx.Provider value={audio}>{children}</AudioCtx.Provider>
}

export function useAudio(): AudioAPI {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
