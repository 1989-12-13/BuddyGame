// ============================================================
// timeFormat — 共享时间格式化工具
// 统一所有组件中的 mm:ss / 时长格式化逻辑
// ============================================================

/** 将秒数格式化为 m:ss 或 mm:ss */
export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
