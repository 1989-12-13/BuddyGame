// ============================================================
// 120调度台 — App 根组件
// ============================================================

import { lazy, Suspense, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { EndingDef } from '../game/types'
import { TitleScreen } from '../screens/TitleScreen'
import { AudioProvider } from '../audio/AudioContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { DispatchCardProvider, type DispatchCardControl } from '../contexts/DispatchCardContext'
import { SettingsPanel } from '../components/SettingsPanel'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'

const GameScreen = lazy(() => import('../screens/game/GameScreen').then(module => ({ default: module.GameScreen })))
const EndingScreen = lazy(() => import('../screens/EndingScreen').then(module => ({ default: module.EndingScreen })))
const LevelSelectScreen = lazy(() => import('../screens/LevelSelectScreen').then(module => ({ default: module.LevelSelectScreen })))
const KnowledgeScreen = lazy(() => import('../screens/KnowledgeScreen').then(module => ({ default: module.KnowledgeScreen })))

type AppScreen = 'title' | 'level_select' | 'game' | 'ending' | 'knowledge'

const NOOP_DISPATCH: DispatchCardControl = {
  hasTriage: true,
  isAvailable: false,
  isOpen: false,
  open: () => {},
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [ending, setEnding] = useState<EndingDef | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [finalActiveSeconds, setFinalActiveSeconds] = useState(0)
  const [finalCallScores, setFinalCallScores] = useState<number[]>([])
  const [gameKey, setGameKey] = useState(0)
  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(undefined)

  // 调度卡控制由 GameScreen 注册，App 持有最新值供 SettingsPanel 读取
  const [dispatchCard, setDispatchCard] = useState<DispatchCardControl>(NOOP_DISPATCH)

  const handleStart = useCallback((scenarioId?: string) => {
    setSelectedScenario(scenarioId)
    setGameKey(k => k + 1)
    setScreen('game')
    setEnding(null)
    setFinalScore(0)
    setFinalCallScores([])
    setDispatchCard(NOOP_DISPATCH)
  }, [])

  const handleNavigate = useCallback(
    (target: 'title' | 'ending', end?: EndingDef, totalScore?: number, callScores?: number[], activeSeconds?: number) => {
      if (target === 'title') {
        setScreen('title')
        setEnding(null)
        setSelectedScenario(undefined)
        setDispatchCard(NOOP_DISPATCH)
      } else {
        setScreen('ending')
        if (end) setEnding(end)
        if (totalScore !== undefined) setFinalScore(totalScore)
        if (callScores) setFinalCallScores(callScores)
        setFinalActiveSeconds(activeSeconds ?? 0)
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
    setDispatchCard(NOOP_DISPATCH)
  }, [])

  const mainContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
      >
      {(() => {
        switch (screen) {
          case 'title':
            return <TitleScreen onStart={handleStart} onLevelSelect={() => setScreen('level_select')} onKnowledge={() => setScreen('knowledge')} />
          case 'level_select':
            return <LevelSelectScreen onStart={handleStart} onBack={() => setScreen('title')} />
          case 'knowledge':
            return <KnowledgeScreen onBack={() => setScreen('title')} />
          case 'ending':
            return ending ? (
              <EndingScreen ending={ending} totalScore={finalScore} callScores={finalCallScores} activeSeconds={finalActiveSeconds} onRestart={handleRestart} />
            ) : (
              <TitleScreen onStart={handleStart} onLevelSelect={() => setScreen('level_select')} />
            )
          case 'game':
          default:
            return (
              <ErrorBoundary title="游戏异常" description="游戏主界面发生了意外错误。将自动返回标题画面。">
                <GameScreen
                  key={gameKey}
                  onNavigate={handleNavigate}
                  scenarioId={selectedScenario}
                  onDispatchCardChange={setDispatchCard}
                />
              </ErrorBoundary>
            )
        }
      })()}
      </motion.div>
    </AnimatePresence>
  )

  return (
    <ThemeProvider>
      <AudioProvider>
        <ErrorBoundary title="应用异常" description="游戏核心组件遇到了意外错误。请尝试刷新页面。">
          <DispatchCardProvider value={dispatchCard}>
            <Suspense fallback={<div role="status" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--text-secondary)' }}>正在连接调度台…</div>}>
              {mainContent}
            </Suspense>
            {screen !== 'game' && screen !== 'title' && <SettingsPanel onNavigate={handleNavigate} />}
          </DispatchCardProvider>
        </ErrorBoundary>
      </AudioProvider>
    </ThemeProvider>
  )
}
