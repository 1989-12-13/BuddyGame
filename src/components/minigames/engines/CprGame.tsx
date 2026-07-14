// ============================================================
// CprGame — 心肺复苏 30:2 循环小游戏
// 30次胸外按压（空格）→ 2次人工呼吸（按住空格在理想区松手）
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../../../game/types'
import { isCpr } from '../../../game/types'
import { Readout } from '../Readout'
import { useKeyboard, usePauseRef } from './hooks'
import { useMiniGameFinish } from './useMiniGameFinish'
import { useGameClock } from './useGameClock'
import {
  CPR_TARGET_BPM,
  CPR_BREATH_PAUSE_MS,
  CPR_BLOW_IDEAL_MIN,
  CPR_BLOW_OVER_THRESHOLD,
  CPR_BPM_GOOD_THRESHOLD,
  CPR_COMPRESSIONS_PER_CYCLE,
  calcLiveBpm,
  assessBpmQuality,
} from './cprUtils'
import { computePassed } from './cprUtils'
import { engineWrap, readoutRow } from './styles'

interface BreathResult {
  ratio: number
  quality: 'perfect' | 'good' | 'bad'
}

type CprPhase = 'compression' | 'breath' | 'done'

export function CprGame({ spec, onComplete, paused }: MiniGameProps) {
  // 类型安全守卫
  if (!isCpr(spec)) {
    throw new Error('CprGame 收到的 spec 不是 CprSpec')
  }
  const s = spec
  const cycles = s.cycles || 2

  const [phase, setPhase] = useState<CprPhase>('compression')
  const [cycle, setCycle] = useState(1)
  const [compCount, setCompCount] = useState(0)
  const [breathCount, setBreathCount] = useState(0)
  const [flash, setFlash] = useState(false)
  const [breathRatio, setBreathRatio] = useState(0)
  const [breathHolding, setBreathHolding] = useState(false)
  const [blowFill, setBlowFill] = useState(0) // 由 rAF 驱动的吹气进度

  const pressTimes = useRef<number[]>([])
  const breathStart = useRef(0)
  const breathQualities = useRef<BreathResult[]>([])
  const compQualities = useRef<string[]>([])
  const doneRef = useRef(false)
  const compCountRef = useRef(0) // 与 compCount 同步，避免闭包陈旧
  const pausedRef = usePauseRef(paused)
  const { complete } = useMiniGameFinish(onComplete, 700)

  const blowTargetMs = 1000

  // 用 ref 暴露 finishGame，使超时和呼吸回调总能拿到最新版本
  const finishGameRef = useRef<() => void>()

  // ---- 修复 #3: 超时机制 ----
  // 每轮最多给 90 秒（远大于正常操作时长），超时自动低分结束
  useGameClock(
    cycles * 90,
    pausedRef,
    {
      onTick: () => {
        if (doneRef.current) return true // 已结束则停止时钟
        return false
      },
      onFinish: () => {
        finishGameRef.current?.()
      },
    },
  )

  // ---- 修复 #1: 吹气进度条实时动画 ----
  useEffect(() => {
    if (!breathHolding) return
    let rafId: number
    const tick = () => {
      if (doneRef.current) {
        cancelAnimationFrame(rafId)
        return
      }
      const fill = Math.min(100, ((performance.now() - breathStart.current) / CPR_BREATH_PAUSE_MS) * 100)
      setBlowFill(fill)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [breathHolding])

  // ---- 修复 #2: 按压阶段 30 次上限 ----
  const registerPress = useCallback(() => {
    if (doneRef.current || pausedRef.current || phase !== 'compression') return
    if (compCountRef.current >= CPR_COMPRESSIONS_PER_CYCLE) return
    const now = performance.now()
    pressTimes.current.push(now)
    const count = pressTimes.current.length
    compCountRef.current = count
    setCompCount(count)
    setFlash(true)
    setTimeout(() => setFlash(false), 90)

    if (pressTimes.current.length >= 2) {
      const prev = pressTimes.current[pressTimes.current.length - 2]
      const interval = now - prev
      compQualities.current.push(assessBpmQuality(interval, CPR_TARGET_BPM))
    }
  }, [phase])

  const startBreath = useCallback(() => {
    if (doneRef.current || pausedRef.current || phase !== 'breath' || breathHolding) return
    breathStart.current = performance.now()
    setBreathHolding(true)
    setBlowFill(0)
    setBreathRatio(0)
  }, [phase, breathHolding])

  // ---- 修复 #4: 完整依赖，通过 finishGameRef 避免闭包陈旧 ----
  const releaseBreath = useCallback(() => {
    if (doneRef.current || pausedRef.current || phase !== 'breath' || !breathHolding) return
    const holdMs = performance.now() - breathStart.current
    const ratio = holdMs / CPR_BREATH_PAUSE_MS
    setBreathRatio(ratio)
    setBreathHolding(false)
    setBlowFill(0)

    let quality: BreathResult['quality']
    if (ratio >= CPR_BLOW_IDEAL_MIN && ratio <= CPR_BLOW_OVER_THRESHOLD) {
      quality = 'perfect'
    } else if (ratio > 0.1) {
      quality = 'good'
    } else {
      quality = 'bad'
    }
    breathQualities.current.push({ ratio, quality })

    const next = breathCount + 1
    setBreathCount(next)

    if (next >= 2) {
      if (cycle >= cycles) {
        finishGameRef.current?.()
      } else {
        setCycle(c => c + 1)
        setCompCount(0)
        setBreathCount(0)
        setBreathRatio(0)
        setBlowFill(0)
        pressTimes.current = []
        compQualities.current = []
        breathQualities.current = []
        compCountRef.current = 0
        setPhase('compression')
      }
    }
  }, [phase, breathHolding, breathCount, cycle])

  useKeyboard('Space', {
    onDown: () => {
      if (phase === 'compression') registerPress()
      else if (phase === 'breath') startBreath()
    },
    onUp: () => {
      if (phase === 'breath') releaseBreath()
    },
  })

  const handlePointerDown = () => {
    if (phase === 'compression') registerPress()
    else if (phase === 'breath') startBreath()
  }

  const handlePointerUp = () => {
    if (phase === 'breath') releaseBreath()
  }

  const nextPhase = () => {
    if (phase === 'compression') {
      setPhase('breath')
      setBreathCount(0)
      setBreathRatio(0)
      setBlowFill(0)
      breathQualities.current = []
    }
  }

  // ---- 修复 #4: finishGame 用 useCallback + 完整 deps ----
  const finishGame = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('done')

    const compScore = compQualities.current.length > 0
      ? compQualities.current.reduce((sum, q) => {
          if (q === 'good') return sum + 1
          if (q === 'ok') return sum + 0.5
          return sum
        }, 0) / compQualities.current.length
      : 0

    const breathScore = breathQualities.current.length > 0
      ? breathQualities.current.reduce((sum, b) => {
          if (b.quality === 'perfect') return sum + 1
          if (b.quality === 'good') return sum + 0.6
          return sum + 0.2
        }, 0) / breathQualities.current.length
      : 0

    const finalScore = Math.max(0, Math.min(1, compScore * 0.6 + breathScore * 0.4))
    complete(finalScore, computePassed(finalScore, s.passThreshold))
  }, [complete, s.passThreshold])

  finishGameRef.current = finishGame

  const liveBpm = pressTimes.current.length >= 2
    ? calcLiveBpm(pressTimes.current)
    : 0

  const pulseStyle = flash
    ? { transform: 'scale(0.86)', boxShadow: '0 0 30px var(--danger-red)' }
    : { transform: 'scale(1)', boxShadow: '0 0 12px rgba(239,68,68,0.4)' }

  // 吹气进度显示：按住时用 rAF 动画值，松开后用最终比例
  const displayBlowFill = breathHolding
    ? blowFill
    : breathRatio > 0
      ? Math.min(100, breathRatio * 100)
      : 0

  const blowColor = breathHolding
    ? 'var(--accent-blue)'
    : breathRatio >= CPR_BLOW_IDEAL_MIN && breathRatio <= CPR_BLOW_OVER_THRESHOLD
      ? 'var(--accent-green)'
      : 'var(--danger-red)'

  const idealStart = CPR_BLOW_IDEAL_MIN * 100
  const idealEnd = CPR_BLOW_OVER_THRESHOLD * 100

  // Helper to build cycle display string
  const cycleLabel = cycle + '/' + cycles
  const breathLabel = breathCount + '/2'

  // Phase-specific text
  let phaseText: string
  if (phase === 'compression') {
    phaseText = '第 ' + cycle + ' 轮 · 胸外按压 ' + compCount + '/30'
  } else if (phase === 'breath') {
    phaseText = '第 ' + cycle + ' 轮 · 人工呼吸 ' + breathCount + '/2'
  } else {
    phaseText = '✓ 操作完成！'
  }

  return (
    <div style={engineWrap}>
      <div style={readoutRow}>
        <Readout label="BPM" value={String(Math.round(liveBpm))}
          color={Math.abs(liveBpm - CPR_TARGET_BPM) <= CPR_BPM_GOOD_THRESHOLD
            ? 'var(--accent-green)' : 'var(--accent-amber)'} />
        <Readout label="目标" value={String(CPR_TARGET_BPM)} color="var(--text-muted)" />
        <Readout label="循环" value={cycleLabel} color="var(--accent-blue)" />
        <Readout label={phase === 'compression' ? '按压' : '吹气'}
          value={phase === 'compression' ? String(compCount) : breathLabel}
          color={phase === 'compression' ? 'var(--border)' : 'var(--accent-cyan)'} />
      </div>

      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', fontWeight: 'var(--fw-bold)' }}>
        {phaseText}
      </div>

      {phase !== 'done' && (
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            width: 160, height: 160, borderRadius: '50%',
            backgroundColor: 'var(--border-light)',
            border: '3px solid ' + (phase === 'compression' ? 'var(--danger-red)' : 'var(--accent-cyan)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', userSelect: 'none',
            transition: 'transform 0.09s ease, box-shadow 0.09s ease',
            ...(phase === 'compression' ? pulseStyle : {}),
            background: phase === 'breath' ? 'var(--bg-elevated)' : undefined,
          }}
        >
          <span style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-bold)', textAlign: 'center', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
            {phase === 'compression' ? '按空格\n或点击'
              : breathHolding ? '保持按住……' : '按住 →\n理想区松手'}
          </span>
        </div>
      )}

      {phase === 'breath' && (
        <div style={{ width: 200, position: 'relative' }}>
          <div style={{
            width: '100%', height: 12, borderRadius: 6,
            backgroundColor: 'var(--border-light)', overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: idealStart + '%', width: (idealEnd - idealStart) + '%',
              height: '100%', backgroundColor: 'var(--success-green-bg)', borderRadius: 2, opacity: 0.6,
            }} />
            <div style={{
              height: '100%', borderRadius: 6, width: displayBlowFill + '%',
              backgroundColor: blowColor, transition: 'none',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 'var(--fs-micro)', color: 'var(--text-muted)', marginTop: 2,
          }}>
            <span>太短</span><span>理想</span><span>过量</span>
          </div>
        </div>
      )}

      {phase === 'compression' && compCount >= 30 && (
        <button
          onClick={nextPhase}
          style={{
            padding: '8px 24px', borderRadius: 8, border: 'none',
            backgroundColor: 'var(--accent-blue)', color: '#fff',
            fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', cursor: 'pointer',
          }}
        >
          开始人工呼吸 →
        </button>
      )}

      {phase === 'done' && (
        <div style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--accent-green)', fontWeight: 'var(--fw-bold)' }}>
          ✓ CPR 操作完成！
        </div>
      )}
    </div>
  )
}
