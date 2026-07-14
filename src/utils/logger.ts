// ============================================================
// logger — 统一日志工具
// 生产环境 (NODE_ENV === 'production') 静默所有 warn/error 调试日志，
// 开发环境下正常输出，便于排查问题。
// ============================================================

const isProd = import.meta.env?.MODE === 'production'

export const logger = {
  warn(...args: unknown[]): void {
    if (!isProd) console.warn(...args)
  },
  error(...args: unknown[]): void {
    // 错误日志在生产环境也保留（用于关键失败诊断），但可在此接入上报系统
    console.error(...args)
  },
  info(...args: unknown[]): void {
    if (!isProd) console.info(...args)
  },
  debug(...args: unknown[]): void {
    if (!isProd) console.debug(...args)
  },
}
