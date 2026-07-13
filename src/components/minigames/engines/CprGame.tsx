// ============================================================
// CprGame — 心肺复苏 30:2 循环
// 30次胸外按压（带节奏指示）→ 人工呼吸2次（中间间隔1秒）×2循环
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CprSpec, MiniGameProps } from '../../../game/types'

type Phase = 'compressing' | 'blowing_1' | 'pause_1to2' | 'blowing_2' | 'done'

const wrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }

const TARGET_BPM = 110
const COMPRESSIONS = 30
const BREATHS = 2
const PAUSE_MS = 1000
const idealMin = 0.30
const overThreshold = 0.72

export function CprGame({ spec, onComplete }: MiniGameProps) {
  const s = spec as CprSpec
  const cycles = s.cycles || 2

  const [phase, setPhase] = useState<Phase>('compressing')
  const [cycle, setCycle] = useState(1)
  const [compCount, setCompCount] = useState(0)
  const [breathCount, setBreathCount] = useState(0)
  const [fill, setFill] = useState(0)
  const [pulse, setPulse] = useState(false)
  const [goodBreath, setGoodBreath] = useState(false)
  const [rhythmQualities, setRhythmQualities] = useState<string[]>([])
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
  const rhythmQRef = useRef<string[]>([])
  const doneRef = useRef(false)

  // 泄气循环
  useEffect(() => {
    lastTRef.current = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - lastTRef.current) / 1000, 0.05)
      lastTRef.current = now
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
    if (doneRef.current) return
    const now = performance.now()
    const gap = lastCompTime.current ? now - lastCompTime.current : 0
    lastCompTime.current = now

    // 实时 BPM
    if (gap > 0) {
      const bpm = Math.round(60000 / gap)
      setCurrentBpm(bpm)
    }

    // 节奏质量（按 BPM 偏差）
    let quality = 'good'
    if (gap > 0) {
      const bpm = 60000 / gap
      const bpmDev = Math.abs(bpm - TARGET_BPM)
      quality = bpmDev <= 10 ? 'good' : bpmDev <= 20 ? 'ok' : 'bad'
    }
    rhythmQRef.current.push(quality)
    setRhythmQualities([...rhythmQRef.current])

    const n = compCountRef.current + 1
    compCountRef.current = n
    setCompCount(n)
    setPulse(true)
    setTimeout(() => setPulse(false), 100)

    if (n >= COMPRESSIONS) {
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
    if ((p !== 'blowing_1' && p !== 'blowing_2') || !holdingRef.current) return
    holdingRef.current = false
    const f = fillRef.current
    if (f >= overThreshold) {
      overBreathRef.current = true
    } else if (f >= idealMin) {
      const n = breathCountRef.current + 1
      breathCountRef.current = n
      setBreathCount(n)
      setGoodBreath(true)
      setTimeout(() => setGoodBreath(false), 400)

      if (n === 1) {
        // 第1次吹气完成 → 暂停1秒
        fillRef.current = 0
        setFill(0)
        setPhase('pause_1to2')
      } else if (n >= BREATHS) {
        // 2次完成
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
        if (doneRef.current) return
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
    if (phase === 'pause_1to2') {
      const t = setTimeout(() => {
        setPhase('blowing_2')
        fillRef.current = 0
        setFill(0)
      }, PAUSE_MS)
      return () => clearTimeout(t)
    }
  }, [phase])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    const qualities = rhythmQRef.current
    const good = qualities.filter(q => q === 'good').length
    const ok = qualities.filter(q => q === 'ok').length
    const totalHealth = qualities.length > 5 ? (good * 1 + ok * 0.5) / qualities.length : 0.5
    const breathPenalty = overBreathRef.current ? 0.15 : 0
    const score = Math.max(0, Math.min(1, totalHealth * 0.8 + 0.2 - breathPenalty))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }

  const barColor = fill >= overThreshold ? '#ef4444' : fill >= idealMin ? '#16a34a' : fill > 0 ? '#3b82f6' : 'var(--border)'

  // 节奏指标统计
  const goodCount = rhythmQualities.filter(q => q === 'good').length

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 16, fontFamily: 'monospace' }}>
        <Readout label="循环" value={`${cycle}/${cycles}`} color="#3b82f6" />
        {(phase === 'compressing') && <Readout label="按压" value={`${compCount}/${COMPRESSIONS}`} color="#dc2626" />}
        {(phase === 'blowing_1' || phase === 'blowing_2') && (
          <Readout label="吹气" value={`${breathCount}/${BREATHS}`} color="#16a34a" />
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
              {TARGET_BPM}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>BPM</span>
            {currentBpm !== null && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span style={{ color: 'var(--text-secondary)' }}>当前:</span>
                <span style={{
                  color: Math.abs(currentBpm - TARGET_BPM) <= 10 ? '#16a34a' :
                         Math.abs(currentBpm - TARGET_BPM) <= 20 ? '#d97706' : '#ef4444',
                  fontWeight: 'bold', fontFamily: 'monospace', fontSize: 15,
                }}>
                  {currentBpm}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>BPM</span>
              </>
            )}
          </div>
          <div
            onPointerDown={doCompress}
            style={{
              width: 130, height: 130, borderRadius: '50%',
              background: pulse
                ? 'radial-gradient(circle at 50% 50%, #fecaca, var(--bg-surface))'
                : 'radial-gradient(circle at 50% 50%, var(--border-light), var(--bg-elevated))',
              border: `4px solid ${pulse ? '#ef4444' : 'var(--text-muted)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', userSelect: 'none',
              transform: pulse ? 'scale(0.9)' : 'scale(1)',
              transition: 'transform 0.08s',
              boxShadow: pulse ? '0 0 20px rgba(239,68,68,0.3)' : 'none',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 13, color: pulse ? '#ef4444' : 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.3 }}>
              按压{'\n'}空格
            </span>
          </div>

          {/* 进度条 */}
          <div style={{ width: 240, height: 6, borderRadius: 3, backgroundColor: 'var(--border-light)', overflow: 'hidden' }}>
            <div style={{ width: `${(compCount / COMPRESSIONS) * 100}%`, height: '100%', backgroundColor: '#dc2626', transition: 'width 0.1s' }} />
          </div>

          {/* 节奏准确度视觉化 */}
          {compCount > 0 && compCount <= 30 && (
            <div style={{ width: 240 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>节奏准确度：</div>
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {rhythmQualities.map((q, i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: 1,
                    backgroundColor: q === 'good' ? '#16a34a' : q === 'ok' ? '#d97706' : '#ef4444',
                  }} />
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
          ⏸ 等待 {PAUSE_MS / 1000} 秒后再次吹气…
        </div>
      )}

      {/* === 吹气阶段 2 === */}
      {phase === 'blowing_2' && <BlowPhase fill={fill} barColor={barColor} goodBreath={goodBreath} />}

      {/* === 完成 === */}
      {phase === 'done' && (
        <div style={{ fontSize: 16, color: '#16a34a', fontWeight: 'bold', padding: '10px 0' }}>
          ✓ {cycles} 个循环 CPR 完成！
        </div>
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

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
    </div>
  )
}
