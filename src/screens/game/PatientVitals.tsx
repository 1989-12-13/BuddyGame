import { Activity, Ambulance, Eye, Minus, TrendingDown, Wind } from 'lucide-react'
import type { WorldState } from '../../game/types'

/**
 * 患者体征条 — header 下方常驻的紧凑横条。
 * 意识 / 呼吸 / 照护余量 / 趋势 / 救护车进度 始终可见，不再需要滚动。
 */
export function PatientVitals({ state }: { state: WorldState }) {
  const patient = state.patientStatus
  if (!patient || !state.currentCall) return null
  const value = Math.max(0, Math.min(100, Number.isFinite(patient.stability) ? patient.stability : 0))
  const tone = patient.died || value < 30 ? 'urgent' : value < 60 ? 'caution' : 'steady'
  const label = patient.died ? '本次救援未成功' : state.rescue.outcome ? '已转交现场' : value < 30 ? '照护余量很低' : value < 60 ? '需要持续关注' : state.currentCall.id === 'cardiac_arrest' ? '需要持续复苏' : '保持观察与照护'
  const elapsed = Math.max(0, state.rescue.etaTotal - state.ambulanceRemaining)
  const progress = state.rescue.outcome ? 100 : state.dispatchSent ? Math.min(99, elapsed / Math.max(1, state.rescue.etaTotal) * 100) : 0
  const event = [...state.patientEvents].reverse().find(item => state.shiftElapsed - item.createdAt <= 12)
  const trendSettled = Boolean(state.rescue.outcome)
  const callSeconds = Math.max(0, state.shiftElapsed - state.callStartTime)
  const mmss = `${Math.floor(callSeconds / 60).toString().padStart(2, '0')}:${(callSeconds % 60).toString().padStart(2, '0')}`

  return <section className={`vitals-strip ${tone}`} aria-label="患者体征与车辆进度">
    <strong className="vitals-title"><Activity size={16} />患者体征</strong>
    <span className="vitals-observation"><Eye size={14} />意识：{state.terminal.conscious === null ? '待确认' : state.terminal.conscious ? '有反应' : '无反应'}</span>
    <span className="vitals-observation"><Wind size={14} />呼吸：{state.terminal.breathing === null ? '待确认' : state.terminal.breathing ? '有' : '无'}</span>
    <span className="vitals-meter-wrap">
      <span
        className="vitals-meter"
        role="meter"
        aria-label="模拟照护余量"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${Math.round(value)} / 100，${label}`}
      >
        <span style={{ width: `${value}%` }} />
      </span>
      <b className="vitals-meter-num">{Math.round(value)}</b>
    </span>
    <span className="vitals-trend">
      {trendSettled ? <Minus size={13} /> : <TrendingDown size={13} />}{label}
    </span>
    {state.dispatchSent && (
      <span className="vitals-vehicle" title="救护车到达进度">
        <Ambulance size={14} />
        {state.rescue.outcome ? '已到达' : `约 ${Math.floor(state.ambulanceRemaining / 60)}:${Math.max(0, state.ambulanceRemaining % 60).toString().padStart(2, '0')}`}
        <span className="vitals-vehicle-track"><span style={{ width: `${progress}%` }} /></span>
      </span>
    )}
    <span className="vitals-timer">通话 {mmss}</span>
    {event && <span className="vitals-event" role="status">{event.text}</span>}
  </section>
}
