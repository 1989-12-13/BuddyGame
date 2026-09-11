import { ArrowRight, Check, Navigation } from 'lucide-react'
import type { WorldState } from '../../game/types'

/**
 * 左栏「下一步」操作区。
 * 放在通话栏固定的位置，玩家无需到处寻找推进入口：
 *  - 地点确认后出现（问询的关键产出），此后「下一步」始终在这一个位置
 *  - 还有未确认项 → 「核对登记表」把玩家直接带进右栏
 *  - 四项全部就绪 → 「规划救援路线」直接进入派车
 */
export function NextStepDock({
  state,
  onGoToTask,
  onPlanRoute,
}: {
  state: WorldState
  onGoToTask: () => void
  onPlanRoute: () => void
}) {
  if (!state.currentCall || state.dispatchSent || state.rescue.outcome || state.patientStatus?.died) return null

  const checks = [
    { key: 'address', label: '地点', done: Boolean(state.terminal.address.trim()) },
    { key: 'conscious', label: '意识', done: state.terminal.conscious !== null },
    { key: 'breathing', label: '呼吸', done: state.terminal.breathing !== null },
    { key: 'determinant', label: '判定码', done: Boolean(state.terminal.determinant && state.terminal.triage) },
  ]
  if (!checks[0].done) return null

  const allReady = checks.every(item => item.done)
  const vehicleReady = state.fleet.vehicles[0]?.status === 'available'

  return (
    <section className="next-step" aria-label="下一步">
      <div className="next-step-head">
        <span className="eyebrow">下一步</span>
        <span className="next-step-count">{checks.filter(item => item.done).length} / {checks.length} 已确认</span>
      </div>
      <ul className="next-step-checks">
        {checks.map(item => (
          <li key={item.key} className={item.done ? 'done' : ''}>
            {item.done ? <Check size={13} /> : <span className="next-dot" aria-hidden="true" />}
            {item.label}
          </li>
        ))}
      </ul>
      {allReady
        ? <button className="primary wide" disabled={!vehicleReady} title={vehicleReady ? undefined : '救护车正在周转'} onClick={onPlanRoute}>
            <Navigation size={17} /> 规划救援路线 <ArrowRight size={17} />
          </button>
        : <button className="primary wide" onClick={onGoToTask}>
            核对登记表 <ArrowRight size={17} />
          </button>}
    </section>
  )
}
