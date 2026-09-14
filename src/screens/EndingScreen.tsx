import { useEffect } from 'react'
import { Activity, Ambulance, HeartPulse, RotateCcw, ShieldAlert, Siren } from 'lucide-react'
import { useAudio } from '../audio/AudioContext'
import { formatPlayTime } from '../game/core/pacing'
import { DIMENSION_KEYS } from '../game/core/evaluation'
import type { EvaluationDimensionKey, EvaluationGrade, ShiftEvaluation } from '../game/types'
import './EndingScreen.css'

interface Props {
  evaluation: ShiftEvaluation
  onRestart: () => void
}

const GRADE_VALUE: Record<EvaluationGrade, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, NA: 0 }

function point(index: number, value: number, radius = 78): [number, number] {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / DIMENSION_KEYS.length
  const distance = radius * value / 5
  return [110 + Math.cos(angle) * distance, 110 + Math.sin(angle) * distance]
}

function polygon(values: number[], radius = 78): string {
  return values.map((value, index) => point(index, value, radius).join(',')).join(' ')
}

function RadarChart({ dimensions }: { dimensions: ShiftEvaluation['dimensions'] }) {
  const values = DIMENSION_KEYS.map(key => GRADE_VALUE[dimensions[key].grade])
  return (
    <figure className="evaluation-radar" aria-label="五维评价雷达图">
      <svg viewBox="0 0 220 220" role="img" aria-labelledby="radar-title radar-desc">
        <title id="radar-title">五维评价雷达图</title>
        <desc id="radar-desc">{DIMENSION_KEYS.map(key => `${dimensions[key].label}${dimensions[key].grade}`).join('，')}</desc>
        {[1, 2, 3, 4, 5].map(level => <polygon key={level} points={polygon(DIMENSION_KEYS.map(() => level))} className="radar-ring" />)}
        {DIMENSION_KEYS.map((key, index) => {
          const [x, y] = point(index, 5)
          return <line key={key} x1="110" y1="110" x2={x} y2={y} className={dimensions[key].grade === 'NA' ? 'radar-axis is-na' : 'radar-axis'} />
        })}
        <polygon points={polygon(values)} className="radar-value" />
        {DIMENSION_KEYS.map((key, index) => {
          const [x, y] = point(index, 5, 100)
          return <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle">{dimensions[key].label}</text>
        })}
      </svg>
      <figcaption>S–D 为评价等级，灰色虚线表示本班次不适用</figcaption>
    </figure>
  )
}

function DimensionCard({ item }: { item: ShiftEvaluation['dimensions'][EvaluationDimensionKey] }) {
  return (
    <article className={`dimension-card grade-${item.grade.toLowerCase()}`}>
      <header><span>{item.label}</span><strong>{item.grade === 'NA' ? '—' : item.grade}</strong></header>
      {item.evidence.map(text => <p key={text}>{text}</p>)}
      {item.improvement && <small>{item.improvement}</small>}
    </article>
  )
}

export function EndingScreen({ evaluation, onRestart }: Props) {
  const audio = useAudio()
  useEffect(() => { audio.play(evaluation.deathCount > 0 ? 'error' : 'success') }, [audio, evaluation.deathCount])
  const handleRestart = () => { audio.play('confirm'); onRestart() }

  return (
    <main className={`ending-screen overall-${evaluation.overallGrade.toLowerCase()}`}>
      <div className="ending-glow" />
      <div className="ending-content">
        <section className="ending-hero">
          <div className="overall-grade" aria-label={`综合评级 ${evaluation.overallGrade}`}>{evaluation.overallGrade}</div>
          <div className="ending-heading">
            <span className="ending-badge">{evaluation.profile.badge}</span>
            <h1>{evaluation.profile.title}</h1>
            <p>{evaluation.profile.subtitle}</p>
          </div>
        </section>

        <p className="profile-description">{evaluation.profile.description}</p>
        {evaluation.endingNarrative && <p className="shift-ending-narrative">{evaluation.endingNarrative}</p>}

        <section className="rescue-summary" aria-label="患者结果汇总">
          <div className="saved-total"><HeartPulse size={24} /><span>本班次确认救治</span><strong>{evaluation.rescuedCount}</strong><span>人</span></div>
          <div className="outcome-counts">
            <span><Activity size={15} />病情恶化 {evaluation.worsenedCount}</span>
            <span><ShieldAlert size={15} />死亡 {evaluation.deathCount}</span>
            <span><Ambulance size={15} />移交 {evaluation.transferredCount}</span>
            <span><Siren size={15} />结果未明 {evaluation.unresolvedCount}</span>
            <span>漏接 {evaluation.missedCount}</span>
          </div>
        </section>

        <section className="evaluation-overview">
          <RadarChart dimensions={evaluation.dimensions} />
          <div className="dimension-grid">{DIMENSION_KEYS.map(key => <DimensionCard key={key} item={evaluation.dimensions[key]} />)}</div>
        </section>

        <section className="case-list" aria-label="逐病例现场记录">
          <header><h2>逐病例现场记录</h2><span>{evaluation.calls.length} 通已处理</span></header>
          {evaluation.calls.map((call, index) => (
            <article className={`case-card outcome-${call.outcome}`} key={`${call.callInstanceId}-${call.scenarioId}-${index}`}>
              <div className="case-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="case-body">
                <header><h3>{call.scenarioTitle}</h3><span>{call.outcomeLabel}{call.patientCount > 0 ? ` · ${call.patientCount} 人` : ''}</span></header>
                <p>{call.arrivalNarrative}</p>
                <div className="case-grades"><strong>综合 {call.overallGrade}</strong>{DIMENSION_KEYS.map(key => <span key={key}>{call.dimensions[key].label} {call.dimensions[key].grade === 'NA' ? '—' : call.dimensions[key].grade}</span>)}</div>
              </div>
            </article>
          ))}
          {evaluation.missedCalls.map((call, index) => <article className="case-card outcome-missed" key={`missed-${call.scenarioId}-${index}`}><div className="case-index">—</div><div className="case-body"><header><h3>{call.title}</h3><span>未接来电</span></header><p>线路在接听前中断，患者情况未知，不能将其记作获救或死亡。</p></div></article>)}
        </section>

        {evaluation.incidents.some(item => item.resolution) && <section className="incident-list"><h2>跨线路核实</h2>{evaluation.incidents.filter(item => item.resolution).map((item, index) => <p key={`${item.scenarioId}-${index}`}><b>{item.title}</b> · {item.resolution === 'adopt' ? '采纳第二位来电者的最新观察' : '维持初报并交由现场复核'}</p>)}</section>}
        {evaluation.narrative && <p className="shift-summary-text">{evaluation.narrative}</p>}
        <p className="ending-footnote">本班次有效体验 {formatPlayTime(evaluation.activeSeconds)} · 不含暂停与复盘</p>
        <button className="ending-restart" onClick={handleRestart}><RotateCcw size={16} />重新值班</button>
      </div>
    </main>
  )
}
