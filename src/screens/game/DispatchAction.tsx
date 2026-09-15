// ============================================================
// 派车入口 + 登记完成度读数
// ============================================================
// 这原本是「工作区里的『下一步』操作区」（NextStepDock）。
// 现在：
//   · NextStepChecks —— 完成度四个点，常驻在通话台顶栏（Transcript 里）
//   · DispatchAction —— 唯一的派车动作按钮，住在左侧地图抽屉的顶部
// 「下一步」那个标题与「3 / 4 已确认」已删除：完成度有一份读数就够了。
// ============================================================

import { ArrowRight, Check, Navigation } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { isCollecting, nextStepChecks } from './nextStepChecks'

/** 常驻在通话台顶栏里的完成度读数 */
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
 * 派车主入口 —— 住在左侧「地图」抽屉里。
 *
 * 原先的「下一步」整块（「下一步」标题 + 「3 / 4 已确认」+ 按钮）已经去掉：
 * 完成度读数常驻在通话台顶部（NextStepChecks），抽屉里只留一个动作，
 * 不再在页面上重复第二份进度数。
 *
 *  - 四项未齐 → 「核对登记表」把玩家送进右侧登记表抽屉
 *  - 四项全部就绪 → 「规划救援路线」直接进入派车
 */
export function DispatchAction({
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

  if (allReady) {
    return (
      <button className="primary wide" disabled={!vehicleReady} title={vehicleReady ? undefined : '救护车正在周转'} onClick={onPlanRoute}>
        <Navigation size={17} /> 规划救援路线 <ArrowRight size={17} />
      </button>
    )
  }
  return (
    <button className="primary wide" onClick={onGoToTask}>
      核对登记表 <ArrowRight size={17} />
    </button>
  )
}
