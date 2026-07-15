// ============================================================
// RhythmPress — 胸外按压（心肺复苏）
// 按空格/点击模拟按压，检测频率与稳定度
// ============================================================

import { useCallback, useRef, useState } from 'react'
import type { MiniGameProps, RhythmPressSpec } from '../../../game/types'
import { isRhythmPress } from '../../../game/types'
import { Readout } from '../Readout'
import { useKeyboard, usePauseRef } from './hooks'
import { useGameClock } from './useGameClock'
import { useMiniGameFinish } from './useMiniGameFinish'
import { computePassed } from './cprUtils'
import { calcLiveBpm, assessBpmQuality, calcRhythmScore } from './cprUtils'
import type { RhythmQuality } from './cprUtils'
import { engineWrap, readoutRow } from './styles'

export function RhythmPress({ spec, onComplete, paused }: MiniGameProps) {
  if (!isRhythmPress(spec)) return null
  const s: RhythmPressSpec = spec
  const [timeLeft, setTimeLeft] = useState(s.durationSec)
  const [bpm, setBpm] = useState(0)
  const [presses, setPresses] = useState(0)
  const [flash, setFlash] = useState(false)
  const [done, setDone] = useState(false)

  const pressTimes = useRef<number[]>([])
  const doneRef = useRef(false)
  const pausedRef = usePauseRef(paused)
  const { complete } = useMiniGameFinish(onComplete, 700)

  const registerPress = () => {
    if (doneRef.current || pausedRef.current) return
    const now = performance.now()
    pressTimes.current.push(now)
    setPresses(pressTimes.current.length)
    setFlash(true)
    setTimeout(() => setFlash(false), 90)
  }

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    const pts = pressTimes.current
    let score = 0
    if (pts.length >= 2) {
      const qualities: RhythmQuality[] = []
      for (let i = 1; i < pts.length; i++) {
        qualities.push(assessBpmQuality(pts[i] - pts[i - 1], s.targetBpm))
      }
      const rateScore = calcRhythmScore(qualities)
      // 按压数量要求：达到目标频率的 65% 才算合格节奏
      const expected = (s.durationSec * s.targetBpm) / 60
      const countFactor = Math.min(1, pts.length / (expected * 0.65))
      score = Math.max(0, Math.min(1, rateScore * (0.6 + 0.4 * countFactor)))
    }
    setDone(true)
    complete(score, computePassed(score, s.passThreshold))
  }, [s.durationSec, s.targetBpm, s.bpmTolerance, s.passThreshold, complete])

  useGameClock(s.durationSec, pausedRef, {
    onTick: (elapsedSec) => {
      const left = Math.max(0, s.durationSec - elapsedSec)
      setTimeLeft(left)
      // 实时 BPM
      const pts = pressTimes.current
      if (pts.length >= 2) {
        setBpm(calcLiveBpm(pts))
      }
      return elapsedSec >= s.durationSec
    },
    onFinish: finish,
  })

  useKeyboard('Space', {
    onDown: () => registerPress(),
  })

  const pulseAnim = flash
    ? { transform: 'scale(0.86)', boxShadow: '0 0 30px var(--danger-red)' }
    : { transform: 'scale(1)', boxShadow: '0 0 12px rgba(239,68,68,0.4)' }

  return (
    <div style={engineWrap}>
      <div style={readoutRow}>
        <Readout label="BPM" value={String(bpm)} color={Math.abs(bpm - s.targetBpm) <= s.bpmTolerance ? 'var(--accent-green)' : 'var(--accent-amber)'} />
        <Readout label="目标" value={String(s.targetBpm)} color="var(--text-muted)" />
        <Readout label="剩余" value={timeLeft.toFixed(1) + 's'} color="var(--accent-blue)" />
        <Readout label="按压" value={String(presses)} color="var(--border)" />
      </div>

      <div
        onPointerDown={registerPress}
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          backgroundColor: 'var(--border-light)',
          border: '3px solid var(--danger-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.09s ease, box-shadow 0.09s ease',
          ...pulseAnim,
        }}
      >
        <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--danger-soft)', fontWeight: 'var(--fw-bold)', textAlign: 'center' }}>
          {done ? '完成' : '按空格\n或点击'}
        </span>
      </div>
      <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        保持稳定的按压节奏，目标 {s.targetBpm} 次/分钟
      </div>
    </div>
  )
}
