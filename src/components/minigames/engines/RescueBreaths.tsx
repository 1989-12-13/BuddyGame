import { useEffect, useRef, useState } from 'react'
import { Wind } from 'lucide-react'
import type { MiniGameProps } from '../../../game/types'
import { scoreBreath } from './breathing'

export function RescueBreaths({ spec, paused, onComplete }: MiniGameProps) {
  const [durations, setDurations] = useState<number[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [holding, setHolding] = useState(false)
  const started = useRef<number | null>(null)
  const submitted = useRef(false)
  const latestPaused = useRef(paused)
  latestPaused.current = paused
  useEffect(() => {
    if (paused) { started.current = null; setHolding(false); setElapsed(0) }
  }, [paused])
  useEffect(() => {
    if (!holding) return
    let frame = 0
    const tick = () => { if (started.current !== null && !latestPaused.current) setElapsed((performance.now() - started.current) / 1000); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [holding])
  const begin = () => {
    if (paused || started.current !== null || durations.length >= 2 || submitted.current) return
    started.current = performance.now(); setElapsed(0); setHolding(true)
  }
  const release = () => {
    const start = started.current
    if (start === null) return
    started.current = null; setHolding(false)
    if (latestPaused.current) return
    const seconds = (performance.now() - start) / 1000
    setElapsed(seconds); setDurations(current => [...current, seconds].slice(0, 2))
  }
  const cancel = () => { started.current = null; setHolding(false); setElapsed(0) }
  return <section className="breath-game" aria-label="人工呼吸节奏练习">
    <p>示意练习：已完成 30 次按压，接下来进行 2 次通气。每次约 1 秒，观察胸廓起伏；避免用力过大或过度通气。</p>
    <svg viewBox="0 0 240 140" role="img" aria-label="胸廓起伏示意"><path d="M70 20Q120 0 170 20L190 130H50Z" fill="var(--desk-raised)" stroke="var(--desk-muted)"/><ellipse cx="97" cy="76" rx={22 + Math.min(elapsed, 1) * (holding ? 7 : 0)} ry="36" fill="var(--desk-accent)"/><ellipse cx="143" cy="76" rx={22 + Math.min(elapsed, 1) * (holding ? 7 : 0)} ry="36" fill="var(--desk-accent)"/><path d="M120 18V65M120 45L98 67M120 45L142 67" fill="none" stroke="var(--desk-bg)" strokeWidth="5"/></svg>
    <div className="breath-meter"><span style={{ width: `${Math.min(100, elapsed / 1.8 * 100)}%` }} /></div>
    <output aria-live="off">{elapsed.toFixed(1)} 秒 · 已完成 {durations.length}/2 次</output>
    <button className="primary breath-control" disabled={paused || durations.length >= 2} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); begin() }} onPointerUp={release} onPointerCancel={cancel} onLostPointerCapture={() => { if (started.current !== null) cancel() }} onKeyDown={e => { if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); if (!e.repeat) begin() } }} onKeyUp={e => { if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); release() } }} onBlur={() => { if (started.current !== null) cancel() }}><Wind size={22} />{holding ? '约 1 秒时松开' : '按住进行一次通气'}</button>
    {durations.map((seconds, i) => <p key={i}>第 {i + 1} 次：{seconds.toFixed(1)} 秒 · {scoreBreath(seconds) === 1 ? '节奏合适' : seconds < 0.8 ? '太短，留意胸廓起伏' : '太长，避免过度通气'}</p>)}
    {durations.length === 2 && <button className="secondary" disabled={paused || submitted.current} onClick={() => { if (submitted.current || paused) return; submitted.current = true; const score = durations.reduce((sum, value) => sum + scoreBreath(value), 0) / 2; onComplete(score, score >= (spec.passThreshold ?? 0.5)) }}>记录练习结果</button>}
    <p className="helper">仅适用于受训且愿意实施人工呼吸的施救者。未受训或无法通气时，听从调度指导持续胸外按压。</p>
  </section>
}
