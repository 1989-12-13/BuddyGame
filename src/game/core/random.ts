// ============================================================
// 零点接线台 — 可注入的随机数工具
//
// 生产环境使用 Math.random()，测试中可通过 __setRng() 注入
// 确定性实现，使随机分支可测试。
// ============================================================

let _rng: () => number = () => Math.random()

/** 注入自定义随机数生成器（仅测试使用） */
export function __setRng(fn: () => number): void {
  _rng = fn
}

/** 重置为默认 Math.random()（仅测试使用） */
export function __resetRng(): void {
  _rng = () => Math.random()
}

/** 返回 [0, 1) 伪随机数 */
export function rng(): number {
  return _rng()
}

/** 返回 [0, max) 伪随机整数 */
export function rngInt(max: number): number {
  return Math.floor(_rng() * max)
}

/** Fisher-Yates 洗牌（纯函数，不修改原数组） */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(_rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
