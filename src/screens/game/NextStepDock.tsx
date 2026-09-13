import { ArrowRight, Check, Navigation } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { isCollecting, nextStepChecks } from './nextStepChecks'

/** 常驻在「来电实录」栏里的完成度读数 */
export function NextStepChecks({ state }: { state: WorldState }) {
  if (!isCollecting(state)) return null

  return (
    <ul className="next-step-checks" aria-label="登记完成度">
      {nextStepChecks(state).map(item => (
        <li key={item.key} className={item.done ? 'done' : ''}>
          {item.done ? <Check size={12} /> : <span className="next-dot" aria-hidden="true" />}
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * 工作区「下一步」操作区：
 *  - 四项未齐 → 「核对登记表」把玩家带进任务单
 *  - 四项全部就绪 → 「规划救援路线」直接进入派车
 * 明细清单常驻在通话台顶部，这里只保留结论与入口。
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
  if (!isCollecting(state)) return null

  const checks = nextStepChecks(state)
  if (!checks[0].done) return null

  const allReady = checks.every(item => item.done)
  const vehicleReady = state.fleet.vehicles[0]?.status === 'available'

  return (
    <section className="next-step" aria-label="下一步">
      <div className="next-step-head">
        <span className="eyebrow">下一步</span>
        <span className="next-step-count">{checks.filter(item => item.done).length} / {checks.length} 已确认</span>
      </div>
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
