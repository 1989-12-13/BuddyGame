// ============================================================
// RhythmPress — 胸外按压（心肺复苏）
// 按空格/点击模拟按压，检测频率与稳定度
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MiniGameProps, RhythmPressSpec } from '../../../game/types'
import { Readout } from '../Readout'
import { usePauseRef } from './hooks'
import { useGameClock } from './useGameClock'
import { useMiniGameFinish } from './useMiniGameFinish'
import { computePassed } from './scoring'
import { calcLiveBpm } from './cprUtils'
import { engineWrap, readoutRow } from './styles'

export function RhythmPress({ spec, onComplete, paused }: MiniGameProps) {
  const s = spec as RhythmPressSpec
  const [timeLeft, setTimeLeft] = useState(s.durationSec)
  const [bpm, setBpm] = useState(0)
  const [presses, setPresses] = useState(0)
  const [flash, setFlash] = useState(false)
  const [done, setDone] = useState(false)

  const pressTimes = useRef<number[]>([])
  const doneRef = useRef(false)
  const pausedRef = usePauseRef(paused)
  const { complete } = useMiniGameFinish(onComplete, 700)

  const targetInterval = 60000 / s.targetBpm
  const tolFrac = s.bpmTolerance / s.targetBpm

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
      const ivals: number[] = []
      for (let i = 1; i < pts.length; i++) ivals.push(pts[i] - pts[i - 1])
      let rateSum = 0
      for (const iv of ivals) {
        const dev = Math.abs(iv - targetInterval) / targetInterval
        rateSum += Math.max(0, 1 - dev / tolFrac)
      }
      const rateScore = rateSum / ivals.length
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        registerPress()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pulseAnim = flash
    ? { transform: 'scale(0.86)', boxShadow: '0 0 30px #ef4444' }
    : { transform: 'scale(1)', boxShadow: '0 0 12px rgba(239,68,68,0.4)' }

  return (
    <div style={engineWrap}>
      <div style={readoutRow}>
        <Readout label="BPM" value={String(bpm)} color={Math.abs(bpm - s.targetBpm) <= s.bpmTolerance ? '#16a34a' : '#d97706'} />
        <Readout label="目标" value={String(s.targetBpm)} color="var(--text-muted)" />
        <Readout label="剩余" value={timeLeft.toFixed(1) + 's'} color="#3b82f6" />
        <Readout label="按压" value={String(presses)} color="var(--border)" />
      </div>

      <div
        onPointerDown={registerPress}
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          backgroundColor: 'var(--border-light)',
          border: '3px solid #dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.09s ease, box-shadow 0.09s ease',
          ...pulseAnim,
        }}
      >
        <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 'bold', textAlign: 'center' }}>
          {done ? '完成' : '按空格\n或点击'}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        保持每 {targetInterval.toFixed(0)} 毫秒一次的稳定节奏
      </div>
    </div>
  )
}
