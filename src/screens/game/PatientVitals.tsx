import { Activity, Ambulance, Eye, Wind } from 'lucide-react'
import type { WorldState } from '../../game/types'

export function PatientVitals({ state }: { state: WorldState }) {
  const patient = state.patientStatus
  if (!patient || !state.currentCall) return null
  const value = Math.max(0, Math.min(100, Number.isFinite(patient.stability) ? patient.stability : 0))
  const tone = patient.died || value < 30 ? 'urgent' : value < 60 ? 'caution' : 'steady'
  const label = patient.died ? '本次救援未成功' : state.rescue.outcome ? '已转交现场' : value < 30 ? '照护余量很低' : value < 60 ? '需要持续关注' : state.currentCall.id === 'cardiac_arrest' ? '需要持续复苏' : '保持观察与照护'
  const elapsed = Math.max(0, state.rescue.etaTotal - state.ambulanceRemaining)
  const progress = state.rescue.outcome ? 100 : state.dispatchSent ? Math.min(99, elapsed / Math.max(1, state.rescue.etaTotal) * 100) : 0
  const event = [...state.patientEvents].reverse().find(item => state.shiftElapsed - item.createdAt <= 12)
  return <section className={`patient-vitals ${tone}`} aria-label="患者体征与车辆进度">
    <header><strong><Activity size={18} />患者体征</strong><span>{label}</span></header>
    <div className="vital-observations"><span><Eye size={15} />意识：{state.terminal.conscious === null ? '待确认' : state.terminal.conscious ? '有反应（记录）' : '无反应（记录）'}</span><span><Wind size={15} />正常呼吸：{state.terminal.breathing === null ? '待确认' : state.terminal.breathing ? '有（记录）' : '无（记录）'}</span></div>
    <div className="vital-meter" role="meter" aria-label="模拟照护余量" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-valuetext={`${Math.round(value)} / 100，${label}`}><span style={{ width: `${value}%` }} /></div>
    <p className="vital-caption">模拟照护余量 {Math.round(value)}/100 · 不是血氧、心率或存活概率</p>
    {state.dispatchSent && <div className="vehicle-readout"><span><Ambulance size={16} />{state.rescue.outcome ? '救护车已到达' : `距到达约 ${Math.floor(state.ambulanceRemaining / 60)} 分 ${Math.max(0, state.ambulanceRemaining % 60)} 秒`}</span><progress aria-label="车辆到达进度" max={100} value={progress} /></div>}
    <p className="vital-event" role="status">{event?.text ?? '等待与操作会影响模拟余量，请持续关注反馈。'}</p>
  </section>
}
