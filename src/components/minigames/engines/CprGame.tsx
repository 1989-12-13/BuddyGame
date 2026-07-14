// ============================================================
// CprGame — 心肺复苏 30:2 循环
// 30次胸外按压（带节奏指示）→ 人工呼吸2次（中间间隔1秒）×2循环
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CprSpec, MiniGameProps } from '../../../game/types'
import { Readout } from '../Readout'
import { usePauseRef } from './hooks'
import { useMiniGameFinish } from './useMiniGameFinish'
import { computePassed } from './scoring'
import {
  CPR_TARGET_BPM,
  CPR_COMPRESSIONS_PER_CYCLE,
  CPR_BREATHS_PER_CYCLE,
  CPR_BREATH_PAUSE_MS,
  CPR_BLOW_IDEAL_MIN,
  CPR_BLOW_OVER_THRESHOLD,
  calcBpm,
  assessBpmQuality,
  calcRhythmScore,
  calcCprFinalScore,
  bpmDeviationColor,
  rhythmQualityColor,
  type RhythmQuality,
} from './cprUtils'
import {
  engineWrap,
  readoutRow,
  pressCircle,
  progressTrack,
  progressFill,
  qualityDot,
  qualityRow,
  doneText,
  pressHint,
  pressHintActive,
} from './styles'

type Phase = 'compressing' | 'blowing_1' | 'pause_1to2' | 'blowing_2' | 'done'

export function CprGame({ spec, onComplete, paused }: MiniGameProps) {
  const s = spec as CprSpec
  const cycles = s.cycles || 2

  const [phase, setPhase] = useState<Phase>('compressing')
  const [cycle, setCycle] = useState(1)
  const [compCount, setCompCount] = useState(0)
  const [breathCount, setBreathCount] = useState(0)
  const [fill, setFill] = useState(0)
  const [pulse, setPulse] = useState(false)
  const [goodBreath, setGoodBreath] = useState(false)
  const [rhythmQualities, setRhythmQualities] = useState<RhythmQuality[]>([])
  const [currentBpm, setCurrentBpm] = useState<number | null>(null)

  const rafRef = useRef(0)
  const lastTRef = useRef(0)
  const finished = useRef(false)
  const compCountRef = useRef(0)
  const breathCountRef = useRef(0)
  const fillRef = useRef(0)
  const holdingRef = useRef(false)
  const lastCompTime = useRef(0)
  const overBreathRef = useRef(false)
  const rhythmQRef = useRef<RhythmQuality[]>([])
  const doneRef = useRef(false)
  const pausedRef = usePauseRef(paused)
  const { complete } = useMiniGameFinish(onComplete, 700)

  // 泄气循环
  useEffect(() => {
    lastTRef.current = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - lastTRef.current) / 1000, 0.05)
      lastTRef.current = now
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }
      const p = phase
      if (p === 'blowing_1' || p === 'blowing_2') {
        if (holdingRef.current) {
          fillRef.current = Math.min(1, fillRef.current + 0.28 * dt)
        } else {
          fillRef.current = Math.max(0, fillRef.current - 0.35 * dt)
        }
        setFill(fillRef.current)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  // 按压
  const doCompress = useCallback(() => {
    if (doneRef.current || pausedRef.current) return
    const now = performance.now()
    const gap = lastCompTime.current ? now - lastCompTime.current : 0
    lastCompTime.current = now

    // 实时 BPM
    if (gap > 0) {
      setCurrentBpm(calcBpm(gap))
    }

    // 节奏质量
    const quality = gap > 0 ? assessBpmQuality(gap, CPR_TARGET_BPM) : 'good'
    rhythmQRef.current.push(quality)
    setRhythmQualities([...rhythmQRef.current])

    const n = compCountRef.current + 1
    compCountRef.current = n
    setCompCount(n)
    setPulse(true)
    setTimeout(() => setPulse(false), 100)

    if (n >= CPR_COMPRESSIONS_PER_CYCLE) {
      setPhase('blowing_1')
      setBreathCount(0)
      breathCountRef.current = 0
      fillRef.current = 0
      setFill(0)
    }
  }, [])

  // 吹气
  const releaseBreath = useCallback(() => {
    const p = phase
    if (pausedRef.current || (p !== 'blowing_1' && p !== 'blowing_2') || !holdingRef.current) return
    holdingRef.current = false
    const f = fillRef.current
    if (f >= CPR_BLOW_OVER_THRESHOLD) {
      overBreathRef.current = true
    } else if (f >= CPR_BLOW_IDEAL_MIN) {
      const n = breathCountRef.current + 1
      breathCountRef.current = n
      setBreathCount(n)
      setGoodBreath(true)
      setTimeout(() => setGoodBreath(false), 400)

      if (n === 1) {
        fillRef.current = 0
        setFill(0)
        setPhase('pause_1to2')
      } else if (n >= CPR_BREATHS_PER_CYCLE) {
        if (cycle < cycles) {
          fillRef.current = 0
          setFill(0)
          setCycle(c => c + 1)
          setCompCount(0)
          compCountRef.current = 0
          lastCompTime.current = 0
          setCurrentBpm(null)
          setPhase('compressing')
        } else {
          fillRef.current = 0
          setFill(0)
          setPhase('done')
          doneRef.current = true
          finish()
        }
      }
    } else {
      fillRef.current = 0
      setFill(0)
    }
  }, [phase, cycle, cycles])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (pausedRef.current || doneRef.current) return
        const p = phase
        if (p === 'compressing') {
          doCompress()
        } else if (p === 'blowing_1' || p === 'blowing_2') {
          holdingRef.current = true
        }
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (pausedRef.current) return
        const p = phase
        if (p === 'blowing_1' || p === 'blowing_2') releaseBreath()
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [doCompress, releaseBreath, phase])

  // 1秒间隔自动过渡（blowing_1 → pause_1to2 →自动→ blowing_2）
  useEffect(() => {
    if (phase === 'pause_1to2' && !pausedRef.current) {
      const t = setTimeout(() => {
        setPhase('blowing_2')
        fillRef.current = 0
        setFill(0)
      }, CPR_BREATH_PAUSE_MS)
      return () => clearTimeout(t)
    }
  }, [phase, paused])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    const rhythmScore = calcRhythmScore(rhythmQRef.current)
    const breathPenalty = overBreathRef.current ? 0.15 : 0
    const score = calcCprFinalScore(rhythmScore, breathPenalty)
    complete(score, computePassed(score, s.passThreshold))
  }

  const barColor = fill >= CPR_BLOW_OVER_THRESHOLD ? '#ef4444' : fill >= CPR_BLOW_IDEAL_MIN ? '#16a34a' : fill > 0 ? '#3b82f6' : 'var(--border)'

  // 节奏指标统计
  const goodCount = rhythmQualities.filter(q => q === 'good').length

  return (
    <div style={engineWrap}>
      <div style={readoutRow}>
        <Readout label="循环" value={`${cycle}/${cycles}`} color="#3b82f6" />
        {(phase === 'compressing') && <Readout label="按压" value={`${compCount}/${CPR_COMPRESSIONS_PER_CYCLE}`} color="#dc2626" />}
        {(phase === 'blowing_1' || phase === 'blowing_2') && (
          <Readout label="吹气" value={`${breathCount}/${CPR_BREATHS_PER_CYCLE}`} color="#16a34a" />
        )}
        {compCount > 0 && phase === 'compressing' && (
          <Readout label="✓" value={String(goodCount)} color="#16a34a" />
        )}
      </div>

      {/* === 按压阶段 === */}
      {phase === 'compressing' && (
        <>
          {/* 频率指示器 */}
          <div style={{ fontSize: 11, marginBottom: -2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>目标:</span>
            <span style={{ color: '#3b82f6', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 15 }}>
              {CPR_TARGET_BPM}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>BPM</span>
            {currentBpm !== null && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span style={{ color: 'var(--text-secondary)' }}>当前:</span>
                <span style={{
                  color: bpmDeviationColor(currentBpm, CPR_TARGET_BPM),
                  fontWeight: 'bold', fontFamily: 'monospace', fontSize: 15,
                }}>
                  {currentBpm}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>BPM</span>
              </>
            )}
          </div>
          <div onPointerDown={doCompress} style={pressCircle({ pulse })}>
            <span style={pulse ? pressHintActive : pressHint}>按压{'\n'}空格</span>
          </div>

          {/* 进度条 */}
          <div style={progressTrack}>
            <div style={progressFill((compCount / CPR_COMPRESSIONS_PER_CYCLE) * 100)} />
          </div>

          {/* 节奏准确度视觉化 */}
          {compCount > 0 && compCount <= 30 && (
            <div style={{ width: 240 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>节奏准确度：</div>
              <div style={qualityRow}>
                {rhythmQualities.map((q, i) => (
                  <div key={i} style={qualityDot(rhythmQualityColor(q))} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* === 吹气阶段 1 === */}
      {phase === 'blowing_1' && <BlowPhase fill={fill} barColor={barColor} goodBreath={goodBreath} />}

      {/* === 1秒间隔 === */}
      {phase === 'pause_1to2' && (
        <div style={{ fontSize: 14, color: '#d97706', fontWeight: 'bold', padding: '20px 0' }}>
          ⏸ 等待 {CPR_BREATH_PAUSE_MS / 1000} 秒后再次吹气…
        </div>
      )}

      {/* === 吹气阶段 2 === */}
      {phase === 'blowing_2' && <BlowPhase fill={fill} barColor={barColor} goodBreath={goodBreath} />}

      {/* === 完成 === */}
      {phase === 'done' && (
        <div style={doneText}>✓ {cycles} 个循环 CPR 完成！</div>
      )}
    </div>
  )
}

// 吹气阶段 UI
function BlowPhase({ fill, barColor, goodBreath }: { fill: number; barColor: string; goodBreath: boolean }) {
  return (
    <>
      <div style={{ width: 240 }}>
        <div style={{ width: '100%', height: 24, backgroundColor: 'var(--border-light)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '30%', width: '42%', top: 0, bottom: 0, backgroundColor: 'rgba(5,150,105,0.12)' }} />
          <div style={{ position: 'absolute', left: '72%', width: '28%', top: 0, bottom: 0, backgroundColor: 'rgba(239,68,68,0.12)' }} />
          <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: 2, backgroundColor: '#16a34a' }} />
          <div style={{ position: 'absolute', left: '72%', top: 0, bottom: 0, width: 2, backgroundColor: '#ef4444' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `calc(${fill * 100}%)`, backgroundColor: barColor, boxShadow: fill > 0.01 ? `0 0 6px ${barColor}` : 'none' }} />
        </div>
        <div style={{ position: 'relative', width: '100%', height: 14, fontSize: 9 }}>
          <span style={{ position: 'absolute', left: 0, width: '30%', textAlign: 'center', color: 'var(--text-muted)' }}>不足</span>
          <span style={{ position: 'absolute', left: '30%', width: '42%', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>理想区</span>
          <span style={{ position: 'absolute', left: '72%', width: '28%', textAlign: 'center', color: '#ef4444' }}>过量</span>
        </div>
      </div>
      {goodBreath && <div style={{ fontSize: 14, color: '#16a34a', fontWeight: 'bold' }}>✓ 吹气成功</div>}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        {fill < 0.01 ? '按住空格吹气' : fill >= 0.72 ? '⚠ 过量！' : fill >= 0.30 ? '✓ 理想区 — 松手' : '继续吹气…'}
      </div>
    </>
  )
}
