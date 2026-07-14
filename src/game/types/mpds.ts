// ============================================================
// 零点接线台 — MPDS协议 / 分诊 / 终端登记类型
// ============================================================

// -------------------- MPDS 判定等级 --------------------
// MPDS使用ECHO/DELTA/CHARLIE/BRAVO/ALPHA五级判定，映射到响应资源：
// ECHO = 最高优先级（如心脏骤停）, DELTA = 高危, CHARLIE = 中危, BRAVO = 低中危, ALPHA = 低危
export type MpdsDeterminant = 'ECHO' | 'DELTA' | 'CHARLIE' | 'BRAVO' | 'ALPHA'

export const MPDS_DETERMINANT_INFO: Record<MpdsDeterminant, { label: string; color: string; responseCode: string }> = {
  ECHO:    { label: 'E — 即刻生命威胁',         color: '#dc2626', responseCode: '灯闪警笛' },
  DELTA:   { label: 'D — 高危/潜在致命',         color: '#ef4444', responseCode: '灯闪警笛' },
  CHARLIE: { label: 'C — 中危/需ALS评估',        color: '#d97706', responseCode: '安静接近' },
  BRAVO:   { label: 'B — 低中危/BLS即可',        color: '#16a34a', responseCode: '安静接近' },
  ALPHA:   { label: 'A — 低危/常规转运',         color: '#0ea5e9', responseCode: '安静接近' },
}

// -------------------- 分诊等级（颜色四色法 — 急救现场分诊） --------------------
export type TriageLevel = 'red' | 'yellow' | 'green' | 'black'
// red = 濒危（即刻派车）, yellow = 危重, green = 轻伤, black = 死亡/无需抢救

export const TRIAGE_LABELS: Record<TriageLevel, string> = {
  red:    '红色 — 濒危',
  yellow: '黄色 — 危重',
  green:  '绿色 — 轻伤',
  black:  '黑色 — 死亡/无需抢救',
}

export const TRIAGE_COLORS: Record<TriageLevel, string> = {
  red:    '#dc2626',
  yellow: '#eab308',
  green:  '#16a34a',
  black:  '#6b7280',
}

/** MPDS判定等级 ↔ 四色分诊的推荐映射 */
export function determinantToTriage(d: MpdsDeterminant): TriageLevel {
  const map: Record<MpdsDeterminant, TriageLevel> = {
    ECHO:    'red',
    DELTA:   'red',
    CHARLIE: 'yellow',
    BRAVO:   'green',
    ALPHA:   'green',
  }
  return map[d]
}

export function determinantToHotCold(d: MpdsDeterminant): 'HOT' | 'COLD' {
  return d === 'ECHO' || d === 'DELTA' ? 'HOT' : 'COLD'
}

/** MPDS 协议编号与名称对照表（33个标准协议） */
export const PROTOCOL_REF: [number, string][] = [
  [1, '腹痛/背痛'],        [2, '过敏/输液反应'],
  [3, '动物咬伤'],         [4, '攻击/性侵'],
  [5, '腰背痛/非创伤'],    [6, '呼吸问题'],
  [7, '烧伤/烫伤/爆炸'],   [8, '一氧化碳/吸入'],
  [9, '心脏/呼吸骤停'],   [10, '胸痛'],
  [11, '抽搐'],            [12, '糖尿病'],
  [13, '溺死/潜水'],      [14, '触电'],
  [15, '眼部问题'],        [16, '坠落伤'],
  [17, '头痛'],            [18, '心脏病'],
  [19, '高温/低温'],       [20, '妊娠/分娩'],
  [21, '出血不止'],        [22, '中毒/误食'],
  [23, '精神状态异常'],    [24, '产科/流产'],
  [25, '中风/CVA'],        [26, '外伤/车辆事故'],
  [27, '昏迷/晕厥'],       [28, '卒中/脑血管'],
  [29, '交通/运输事故'],   [30, '创伤'],
  [31, '无意识/晕厥'],     [32, '其他/特殊'],
  [33, '感染/发热'],
]

// -------------------- 终端登记状态（MPDS调度卡） --------------------
export interface TerminalState {
  // — Case Entry（病例录入） —
  address: string
  contact: string
  chiefComplaint: string         // 标准化主诉
  // 结构化患者信息
  patientAge: string
  patientGender: string
  conscious: boolean | null      // null=未确认
  breathing: boolean | null
  // — 协议判定 —
  protocolNumber: number | null  // 选定的MPDS协议号
  determinant: MpdsDeterminant | null
  determinantSubcode: number | null  // 判定码最后一位细分编码 (1-4)
  hotCold: 'HOT' | 'COLD' | null
  // — 响应 —
  triage: TriageLevel | null
  // 自由备注
  conditionNote: string
}
