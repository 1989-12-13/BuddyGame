// ============================================================
// 120调度台 — 语义化颜色常量
// 替代散落在各组件中的硬编码颜色值
// ============================================================

// -------------------- 语义色（功能映射） --------------------

/** 成功/正确/稳定 */
export const C_SUCCESS = '#16a34a'
/** 危险/错误/紧急 */
export const C_DANGER = '#ef4444'
/** 深红（心搏骤停/死亡） */
export const C_DARK_DANGER = '#dc2626'
/** 警告/注意 */
export const C_WARNING = '#d97706'
/** 次要警告（黄色） */
export const C_AMBER = '#f59e0b'
/** 信息/指引 */
export const C_INFO = '#3b82f6'
/** 深度色（深蓝/重要） */
export const C_DEEP_BLUE = '#2563eb'

// -------------------- 场景色 --------------------

/** CPR 按压色 */
export const C_CPR_COMPRESS = '#dc2626'
/** CPR 吹气色 */
export const C_CPR_BREATH = '#16a34a'
/** CPR 过量色 */
export const C_CPR_OVER = '#ef4444'
/** CPR 节奏指示 */
export const C_CPR_BEAT = '#38bdf8'

// -------------------- UI基础色 --------------------

/** 文本色（浅色模式） */
export const C_TEXT_PRIMARY = '#1e293b'
/** 次文本色 */
export const C_TEXT_MUTED = '#64748b'
/** 边框色 */
export const C_BORDER = '#e2e8f0'
/** 浅背景 */
export const C_BG_SURFACE = '#f8fafc'

// -------------------- 患者体征映射（按索引对应） --------------------

/** VitalSign → 颜色（stable/warning/critical/arrest） */
export const VITAL_SIGN_COLORS: Record<string, string> = {
  stable: C_SUCCESS,
  warning: C_AMBER,
  critical: C_DANGER,
  arrest: C_DARK_DANGER,
}

/** HitQuality → 颜色（perfect/good/miss） */
export const HIT_QUALITY_COLORS: Record<string, string> = {
  perfect: C_SUCCESS,
  good: C_WARNING,
  miss: C_DANGER,
}

/** RhythmQuality → 颜色（good/ok/bad） */
export const RHYTHM_QUALITY_COLORS: Record<string, string> = {
  good: C_SUCCESS,
  ok: C_WARNING,
  bad: C_DANGER,
}
