// ============================================================
// 120调度台 — 语义化颜色常量
// 统一指向 src/styles/tokens.css 的设计令牌（CSS 变量），
// 随深浅主题自动切换；替代散落在各组件中的硬编码颜色值。
//
// 说明：值形如 'var(--success)'，适用于 DOM inline style / SVG style。
// 若需真实色值（如 Leaflet pathOptions、Canvas），请改用
// ThemeContext 的 colors（见 contexts/ThemeContext.tsx）。
// ============================================================

// -------------------- 语义色（功能映射） --------------------

/** 成功/正确/稳定 */
export const C_SUCCESS = 'var(--success)'
/** 危险/错误/紧急 */
export const C_DANGER = 'var(--danger)'
/** 危急（心搏骤停/死亡） */
export const C_DARK_DANGER = 'var(--danger-strong)'
/** 警告/注意 */
export const C_WARNING = 'var(--warning)'
/** 次要警告（黄） */
export const C_AMBER = 'var(--warning)'
/** 信息/指引 */
export const C_INFO = 'var(--info)'
/** 强调信息（深色档） */
export const C_DEEP_BLUE = 'var(--info-strong)'

// -------------------- 场景色 --------------------

/** CPR 按压色 */
export const C_CPR_COMPRESS = 'var(--danger)'
/** CPR 吹气色 */
export const C_CPR_BREATH = 'var(--success)'
/** CPR 过量色 */
export const C_CPR_OVER = 'var(--danger-strong)'
/** CPR 节奏指示 */
export const C_CPR_BEAT = 'var(--info)'

// -------------------- UI 基础色 --------------------

export const C_TEXT_PRIMARY = 'var(--text)'
export const C_TEXT_MUTED = 'var(--text-2)'
export const C_BORDER = 'var(--line)'
export const C_BG_SURFACE = 'var(--bg-surface)'

// -------------------- 分级映射（统一走 sev 色阶） --------------------

/** VitalSign → 颜色（stable / warning / critical / arrest） */
export const VITAL_SIGN_COLORS: Record<string, string> = {
  stable: 'var(--sev-1)',
  warning: 'var(--sev-3)',
  critical: 'var(--sev-4)',
  arrest: 'var(--sev-5)',
}

/** HitQuality → 颜色（perfect / good / miss） */
export const HIT_QUALITY_COLORS: Record<string, string> = {
  perfect: 'var(--sev-1)',
  good: 'var(--sev-3)',
  miss: 'var(--sev-5)',
}

/** RhythmQuality → 颜色（good / ok / bad） */
export const RHYTHM_QUALITY_COLORS: Record<string, string> = {
  good: 'var(--sev-1)',
  ok: 'var(--sev-3)',
  bad: 'var(--sev-5)',
}
