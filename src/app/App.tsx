// ============================================================
// 零点接线台 — App 根组件
// ============================================================

import { useState, useCallback } from 'react'
import type { EndingDef } from '../game/types'
import { TitleScreen } from '../screens/TitleScreen'
import { GameScreen } from '../screens/GameScreen'
import { EndingScreen } from '../screens/EndingScreen'
import { LevelSelectScreen } from '../screens/LevelSelectScreen'
import { KnowledgeScreen } from '../screens/KnowledgeScreen'
import { AudioProvider } from '../audio/AudioContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { ThemeToggle } from '../components/ThemeToggle'

type AppScreen = 'title' | 'level_select' | 'game' | 'ending' | 'knowledge'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [ending, setEnding] = useState<EndingDef | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [finalCallScores, setFinalCallScores] = useState<number[]>([])
  const [gameKey, setGameKey] = useState(0)
  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(undefined)

  const handleStart = useCallback((scenarioId?: string) => {
    setSelectedScenario(scenarioId)
    setGameKey(k => k + 1)
    setScreen('game')
    setEnding(null)
    setFinalScore(0)
    setFinalCallScores([])
  }, [])

  const handleNavigate = useCallback(
    (target: 'title' | 'ending', end?: EndingDef, totalScore?: number, callScores?: number[]) => {
      if (target === 'title') {
        setScreen('title')
        setEnding(null)
        setSelectedScenario(undefined)
      } else {
        setScreen('ending')
        if (end) setEnding(end)
        if (totalScore !== undefined) setFinalScore(totalScore)
        if (callScores) setFinalCallScores(callScores)
      }
    },
    [],
  )

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1)
    setScreen('game')
    setEnding(null)
    setFinalScore(0)
    setFinalCallScores([])
  }, [])

  const mainContent = (() => {
    switch (screen) {
      case 'title':
        return <TitleScreen onStart={handleStart} onLevelSelect={() => setScreen('level_select')} onKnowledge={() => setScreen('knowledge')} />
      case 'level_select':
        return <LevelSelectScreen onStart={handleStart} onBack={() => setScreen('title')} />
      case 'knowledge':
        return <KnowledgeScreen onBack={() => setScreen('title')} />
      case 'ending':
        return ending ? (
          <EndingScreen ending={ending} totalScore={finalScore} callScores={finalCallScores} onRestart={handleRestart} />
        ) : (
          <TitleScreen onStart={handleStart} onLevelSelect={() => setScreen('level_select')} />
        )
      case 'game':
      default:
        return <GameScreen key={gameKey} onNavigate={handleNavigate} scenarioId={selectedScenario} />
    }
  })()

  return (
    <ThemeProvider>
      <AudioProvider>
        {mainContent}
        <ThemeToggle />
      </AudioProvider>
    </ThemeProvider>
  )
}
