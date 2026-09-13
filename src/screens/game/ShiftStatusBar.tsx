// ============================================================
// 并发值班 — 班次状态条
// ============================================================
// 「拟真调度台」只需要两样东西常驻：现在的**时间**，和还有几辆车**可用**。
// 玩法内部数值（热度 / 段落 / 来电计数 / 未接）一律不给玩家看 ——
// 它们是驱动强度的，不是给调度员看的仪表。
// 患者体征由工作台并进同一条状态带（.status-strip），这里只负责左半段。
// ============================================================

import { Ambulance } from 'lucide-react'
import type { ShiftState } from '../../game/core/shift'
import { availableVehicleCount } from '../../game/core/shift'

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function ShiftStatusBar({ shift }: { shift: ShiftState }) {
  return (
    <div className="shift-bar" aria-label="班次状态">
      <span className="sb-clock">{formatClock(shift.clock)}</span>
      <span className="sb-vehicles">
        <Ambulance size={14} /> 可用车辆 <b>{availableVehicleCount(shift)}</b> / {shift.config.vehicleCount}
      </span>
    </div>
  )
}
