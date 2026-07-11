// ============================================================
// 零点接线台 — CPR 节拍按压小游戏
// 玩家需跟随 100-120 BPM 节奏点击按压区域，
// 30 次按压 + 2 次人工呼吸为一个周期，共 2 个周期。
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MiniGameResult, HitQuality } from '../../game/core/minigameTypes'

interface Props {
  onComplete: (result: MiniGameResult) => void
}

const BPM = 110
const BEAT_INTERVAL_MS = 60000 / BPM
const SWEET_SPOT_WINDOW_MS = 120     // ±120ms 为 perfect
const GOOD_WINDOW_MS = 250           // ±250ms 为 good
const COMPRESSIONS_PER_CYCLE = 10    // 演示版缩短为 10 次（实际应为 30）
const TOTAL_CYCLES = 2
const BREATH_DURATION_MS = 2000

export function CprRhythm({ onComplete }: Props) {
  const [phase, setPhase] = useState<'ready' | 'pressing' | 'breath' | 'done'>('ready')
  const [beatPhase, setBeatPhase] = useState(0)       // 0-1 节拍位置
  const [compressions, setCompressions] = useState(0)
  const [cycle, setCycle] = useState(1)
  const [hits, setHits] = useState<{ quality: HitQuality }[]>([])
  const [lastHitQuality, setLastHitQuality] = useState<HitQuality | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const startTimeRef = useRef(0)
  const animRef = useRef<number>(0)
  const lastBeatRef = useRef(performance.now())
  const pressedThisBeatRef = useRef(false)

  // 节拍动画循环
  useEffect(() => {
    if (phase !== 'pressing') return

    let running = true
    const loop = () => {
      if (!running) return
      const now = performance.now()
      const elapsed = now - lastBeatRef.current
      const phasePos = Math.min(elapsed / BEAT_INTERVAL_MS, 1)
      setBeatPhase(phasePos)

      // 每拍结束后重置按压标记
      if (elapsed >= BEAT_INTERVAL_MS) {
        lastBeatRef.current = now - (elapsed - BEAT_INTERVAL_MS)
        pressedThisBeatRef.current = false
      }

      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [phase])

  // 准备倒计时
  useEffect(() => {
    if (phase !== 'ready') return
    const t = setTimeout(() => {
      setPhase('pressing')
      startTimeRef.current = performance.now()
    }, 1500)
    return () => clearTimeout(t)
  }, [phase])

  // 完成游戏
  useEffect(() => {
    if (phase !== 'done') return
    const perfectCount = hits.filter(h => h.quality === 'perfect').length
    const goodCount = hits.filter(h => h.quality === 'good').length
    const missCount = hits.filter(h => h.quality === 'miss').length
    const total = hits.length
    const accuracy = total > 0
      ? (perfectCount * 1 + goodCount * 0.5) / total
      : 0

    onComplete({
      miniGameId: 'cpr_rhythm',
      totalActions: total,
      perfectCount,
      goodCount,
      missCount,
      accuracy,
      passed: accuracy >= 0.5,
    })
  }, [phase, hits, onComplete])

  const handlePress = useCallback(() => {
    if (phase !== 'pressing' || pressedThisBeatRef.current) return
    pressedThisBeatRef.current = true

    const now = performance.now()
    const beatElapsed = now - lastBeatRef.current
    const deviation = Math.abs(beatElapsed - BEAT_INTERVAL_MS / 2)

    let quality: HitQuality
    if (deviation <= SWEET_SPOT_WINDOW_MS) quality = 'perfect'
    else if (deviation <= GOOD_WINDOW_MS) quality = 'good'
    else quality = 'miss'

    setLastHitQuality(quality)
    setShowFeedback(true)
    setTimeout(() => { setShowFeedback(false); setLastHitQuality(null) }, 400)

    setHits(prev => [...prev, { quality }])

    const newCount = compressions + 1
    setCompressions(newCount)

    // 检查是否完成一组按压
    if (newCount >= COMPRESSIONS_PER_CYCLE) {
      if (cycle >= TOTAL_CYCLES) {
        setPhase('done')
      } else {
        setPhase('breath')
        setTimeout(() => {
          setCompressions(0)
          setCycle(c => c + 1)
          setPhase('pressing')
          lastBeatRef.current = performance.now()
          pressedThisBeatRef.current = false
        }, BREATH_DURATION_MS)
      }
    }
  }, [phase, compressions, cycle])

  // 键盘支持
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        handlePress()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlePress])

  const isSweetSpot = beatPhase > 0.35 && beatPhase < 0.65
  const beatProgress = Math.sin(beatPhase * Math.PI)

  return (
    <div style={styles.container}>
      {phase === 'ready' && (
        <div style={styles.readyOverlay}>
          <div style={styles.readyText}>准备开始 CPR</div>
          <div style={styles.readyHint}>跟随节奏按压</div>
        </div>
      )}

      {(phase === 'pressing' || phase === 'breath') && (
        <>
          {/* 状态栏 */}
          <div style={styles.statusBar}>
            <span style={styles.statusLabel}>
              周期 {cycle}/{TOTAL_CYCLES}
            </span>
            <span style={styles.statusLabel}>
              按压 {compressions}/{COMPRESSIONS_PER_CYCLE}
            </span>
            <span style={styles.statusLabel}>{BPM} BPM</span>
          </div>

          {/* 节拍器视觉 */}
          <div style={styles.beatMeter}>
            {/* 轨道 */}
            <div style={styles.beatTrack}>
              {/* 绿色 sweet spot 区域 */}
              <div style={styles.sweetSpot} />
              {/* 活动指示球 */}
              <div
                style={{
                  ...styles.beatBall,
                  bottom: `${beatProgress * 80 + 10}%`,
                  backgroundColor:
                    lastHitQuality === 'perfect' ? '#4ade80'
                    : lastHitQuality === 'good' ? '#facc15'
                    : lastHitQuality === 'miss' ? '#ef4444'
                    : '#38bdf8',
                  transform: `scale(${isSweetSpot ? 1.3 : 1})`,
                  transition: showFeedback
                    ? 'background-color 0.1s, transform 0.1s'
                    : 'none',
                }}
              />
            </div>
            {/* 按压按钮 */}
            <button
              style={{
                ...styles.pressBtn,
                boxShadow: isSweetSpot
                  ? '0 0 20px rgba(56, 189, 248, 0.6), inset 0 0 20px rgba(56, 189, 248, 0.2)'
                  : 'none',
              }}
              onMouseDown={handlePress}
              onTouchStart={(e) => { e.preventDefault(); handlePress() }}
              disabled={phase !== 'pressing'}
            >
              {phase === 'breath' ? '🌬️ 人工呼吸中...' : '👇 按压'}
            </button>
          </div>

          {/* 反馈弹出 */}
          {showFeedback && (
            <div
              style={{
                ...styles.feedbackPopup,
                color:
                  lastHitQuality === 'perfect' ? '#4ade80'
                  : lastHitQuality === 'good' ? '#facc15'
                  : '#ef4444',
              }}
            >
              {lastHitQuality === 'perfect' ? '完美！' :
               lastHitQuality === 'good' ? '不错' : 'miss'}
            </div>
          )}

          {/* 按压历史 */}
          <div style={styles.historyBar}>
            {hits.slice(-10).map((hit, i) => (
              <div
                key={i}
                style={{
                  ...styles.historyDot,
                  backgroundColor:
                    hit.quality === 'perfect' ? '#4ade80'
                    : hit.quality === 'good' ? '#facc15'
                    : '#ef4444',
                }}
              />
            ))}
          </div>
        </>
      )}

      {phase === 'breath' && (
        <div style={styles.breathIndicator}>🌬️ 进行 2 次人工呼吸...</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative' as const,
    padding: '12px 16px',
    backgroundColor: '#0f172a',
    borderTop: '2px solid #ef4444',
    minHeight: 260,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  readyOverlay: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '24px 0',
  },
  readyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f87171',
  },
  readyHint: {
    fontSize: 13,
    color: '#94a3b8',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0 4px',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  beatMeter: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  beatTrack: {
    position: 'relative' as const,
    width: 40,
    height: 180,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid #334155',
  },
  sweetSpot: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: '30%',
    height: '40%',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderTop: '1px solid rgba(56, 189, 248, 0.3)',
    borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
  },
  beatBall: {
    position: 'absolute' as const,
    left: '50%',
    width: 28,
    height: 28,
    borderRadius: '50%',
    marginLeft: -14,
    transition: 'background-color 0.1s',
    boxShadow: '0 0 8px rgba(0,0,0,0.3)',
  },
  pressBtn: {
    width: '100%',
    padding: '14px 0',
    border: '2px solid #38bdf8',
    borderRadius: 8,
    backgroundColor: '#0c4a6e',
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.1s',
    fontFamily: 'inherit',
    maxWidth: 200,
  },
  feedbackPopup: {
    position: 'absolute' as const,
    top: '40%',
    fontSize: 28,
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(0,0,0,0.5)',
    pointerEvents: 'none' as const,
    animation: 'fade-in-up 0.4s ease-out',
  },
  historyBar: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  breathIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#60a5fa',
    textAlign: 'center' as const,
    padding: '12px 0',
  },
}
