// ============================================================
// 零点接线台 — App 根组件
// ============================================================

import { useState, useCallback } from 'react'
import type { EndingDef } from '../game/types'
import { TitleScreen } from '../screens/TitleScreen'
import { GameScreen } from '../screens/GameScreen'
import { EndingScreen } from '../screens/EndingScreen'

type AppScreen = 'title' | 'game' | 'ending'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [ending, setEnding] = useState<EndingDef | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [gameKey, setGameKey] = useState(0)

  const handleStart = useCallback(() => {
    setGameKey(k => k + 1)
    setScreen('game')
    setEnding(null)
    setFinalScore(0)
  }, [])

  const handleNavigate = useCallback(
    (target: 'title' | 'ending', end?: EndingDef, totalScore?: number) => {
      if (target === 'title') {
        setScreen('title')
        setEnding(null)
      } else {
        setScreen('ending')
        if (end) setEnding(end)
        if (totalScore !== undefined) setFinalScore(totalScore)
      }
    },
    [],
  )

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1)
    setScreen('game')
    setEnding(null)
    setFinalScore(0)
  }, [])

  switch (screen) {
    case 'title':
      return <TitleScreen onStart={handleStart} />
    case 'ending':
      return ending ? (
        <EndingScreen ending={ending} totalScore={finalScore} onRestart={handleRestart} />
      ) : (
        <TitleScreen onStart={handleStart} />
      )
    case 'game':
    default:
      return <GameScreen key={gameKey} onNavigate={handleNavigate} />
  }
}
