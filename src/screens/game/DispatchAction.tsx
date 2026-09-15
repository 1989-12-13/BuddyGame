// ============================================================
// 派车入口 + 登记完成度读数
// ============================================================
// 这原本是「工作区里的『下一步』操作区」（NextStepDock）。
// 现在：
//   · NextStepChecks —— 完成度四个点，常驻在通话台顶栏（Transcript 里）
//   · DispatchAction —— 唯一的派车动作按钮，住在左侧地图抽屉的顶部
// 「下一步」那个标题与「3 / 4 已确认」已删除：完成度有一份读数就够了。
// ============================================================

import { AlertTriangle, ArrowRight, Check, Navigation } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { dispatchEligibility } from '../../game/core/session'
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
 * **就绪判断只认 `dispatchEligibility`**（与真正执行派车的 `buildDispatchPlan` 同一个函数）。
 * 踩过的坑：这里原先只检查「地点 / 意识 / 呼吸 / 判定码」四项，而实际派车还要
 * **联系电话**、非忙碌、车辆可用、阶段正确 —— 于是四项齐了按钮就亮，点下去却什么都没发生
 * （心脏骤停最容易撞上：判定码由判断题早早补齐，联系电话是最后一个问题）。
 * 现在不满足条件时按钮置灰，并把「还差什么」逐条列出来。
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
  const eligibility = dispatchEligibility(state)
  // 一个字都还没登记时不占位，避免一进画布就是一片红字
  if (!checks[0].done && !eligibility.allowed) return null

  const ready = eligibility.allowed

  return (
    <div className="dispatch-action">
      <button
        className="primary wide"
        disabled={!ready}
        title={ready ? undefined : eligibility.reasons.join('；')}
        onClick={onPlanRoute}
      >
        <Navigation size={17} /> 规划救援路线 <ArrowRight size={17} />
      </button>
      {!ready && (
        <div className="dispatch-blockers">
          <ul aria-label="还差什么">
            {eligibility.reasons.map(reason => (
              <li key={reason}><AlertTriangle size={12} /> {reason}</li>
            ))}
          </ul>
          <button type="button" className="text-button" onClick={onGoToTask}>打开登记表核对</button>
        </div>
      )}
    </div>
  )
}
