// ============================================================
// 120调度台 — App 根组件
// ============================================================

import { lazy, Suspense, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ShiftEvaluation } from '../game/types'
import { TitleScreen } from '../screens/TitleScreen'
import { AudioProvider } from '../audio/AudioContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { DispatchCardProvider, type DispatchCardControl } from '../contexts/DispatchCardContext'
import { SettingsPanel } from '../components/SettingsPanel'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'

const GameScreen = lazy(() => import('../screens/game/GameScreen').then(module => ({ default: module.GameScreen })))
const ShiftScreen = lazy(() => import('../screens/game/ShiftScreen').then(module => ({ default: module.ShiftScreen })))
const EndingScreen = lazy(() => import('../screens/EndingScreen').then(module => ({ default: module.EndingScreen })))
const LevelSelectScreen = lazy(() => import('../screens/LevelSelectScreen').then(module => ({ default: module.LevelSelectScreen })))
const KnowledgeScreen = lazy(() => import('../screens/KnowledgeScreen').then(module => ({ default: module.KnowledgeScreen })))

type AppScreen = 'title' | 'level_select' | 'game' | 'shift' | 'ending' | 'knowledge'

const NOOP_DISPATCH: DispatchCardControl = {
  hasTriage: true,
  isAvailable: false,
  isOpen: false,
  open: () => {},
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title')
  const [finalEvaluation, setFinalEvaluation] = useState<ShiftEvaluation | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(undefined)
  /** 记住从哪个模式进来的，重新值班时回到同一个模式 */
  const [lastMode, setLastMode] = useState<AppScreen>('game')

  // 调度卡控制由 GameScreen 注册，App 持有最新值供 SettingsPanel 读取
  const [dispatchCard, setDispatchCard] = useState<DispatchCardControl>(NOOP_DISPATCH)

  const handleStart = useCallback((scenarioId?: string) => {
    setSelectedScenario(scenarioId)
    setGameKey(k => k + 1)
    // 并发值班：进入班次屏幕；其余入口走原线性流程
    const target: AppScreen = scenarioId === '__shift__' ? 'shift' : 'game'
    setScreen(target)
    setLastMode(target)
    setFinalEvaluation(null)
    setDispatchCard(NOOP_DISPATCH)
  }, [])

  const handleNavigate = useCallback(
    (
      target: 'title' | 'ending',
      evaluation?: ShiftEvaluation,
    ) => {
      if (target === 'title') {
        setScreen('title')
        setFinalEvaluation(null)
        setSelectedScenario(undefined)
        setDispatchCard(NOOP_DISPATCH)
      } else {
        setScreen('ending')
        setFinalEvaluation(evaluation ?? null)
      }
    },
    [],
  )

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1)
    // 回到进入结算前的那个模式，而不是固定回到线性流程
    setScreen(lastMode)
    setFinalEvaluation(null)
    setDispatchCard(NOOP_DISPATCH)
  }, [lastMode])

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
            return finalEvaluation ? (
              <EndingScreen evaluation={finalEvaluation} onRestart={handleRestart} />
            ) : (
              <TitleScreen onStart={handleStart} onLevelSelect={() => setScreen('level_select')} />
            )
          case 'shift':
            return (
              <ErrorBoundary title="值班异常" description="班次界面发生了意外错误。将自动返回标题画面。">
                <ShiftScreen key={gameKey} onNavigate={handleNavigate} />
              </ErrorBoundary>
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
            <Suspense fallback={<div role="status" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--text-2)' }}>正在连接调度台…</div>}>
              {mainContent}
            </Suspense>
            {screen !== 'game' && screen !== 'shift' && screen !== 'title' && <SettingsPanel onNavigate={handleNavigate} />}
          </DispatchCardProvider>
        </ErrorBoundary>
      </AudioProvider>
    </ThemeProvider>
  )
}
