// ============================================================
// 统一的 z-index 层级常量
// 所有弹窗/浮层/覆盖层的 z-index 均引用此文件
// ============================================================

/** 地图层 */
export const Z_MAP = 0

/** 抽屉（右侧通话面板）— 置于指导舞台(58)之上、指导卡片(60)之下，展开靠垫时对话区不被遮罩覆盖 */
export const Z_DRAWER = 59

/** MPDS 调度卡 leftsider */
export const Z_TERMINAL_MODAL = 60

/** 急救指导浮层折叠态（FAB 悬浮球） */
export const Z_GUIDANCE_FAB = 55

/** 临床判断浮层 */
export const Z_JUDGMENT_OVERLAY = 56

/** 急救指导浮层展开态舞台 */
export const Z_GUIDANCE_STAGE = 58
/** 急救指导浮层展开态卡片 */
export const Z_GUIDANCE_CARD = 60

/** 可拖拽分隔条 */
export const Z_SPLIT_BAR = 5

/** 浮动卡片（等待接听、班次结束提示等） */
export const Z_FLOAT_CARD = 40

/** 事件 Toast 堆叠 */
export const Z_TOAST = 200

/** 车辆选择模态 */
export const Z_VEHICLE_SELECTOR = 300

/** 收尾阶段遮罩 */
export const Z_CLOSING_OVERLAY = 900

/** 通话结算报告 */
export const Z_DEBRIEF = 1000

/** Perk 收益选择 */
export const Z_PERK = 1000

/** 设置面板 */
export const Z_SETTINGS = 1000

/** 知识库弹窗 */
export const Z_KNOWLEDGE_MODAL = 1000
