// ============================================================
// 零点接线台 — MPDS 协议规范（全游戏统一事实源）
// 所有卡片 mpdsCard 字段必须与此表一致
// ============================================================

/** 预期判定编码前缀 */
export interface ProtocolEntry {
  number: number
  title: string
  /** 预期判定码（如 "9-E-1"），用于一致性校验 */
  expectedDeterminant: string
  /** 热/冷响应 */
  hotCold: 'HOT' | 'COLD'
  /** 正确分诊颜色 */
  correctTriage: 'red' | 'yellow' | 'green' | 'black'
}

/**
 * 33 个标准 MPDS 协议完整规范表
 * 与 PROTOCOL_REF (mpds.ts) 名称同步，且额外包含判定/分诊/hotCold 元信息
 */
export const PROTOCOLS: ProtocolEntry[] = [
  { number: 1,  title: '腹痛/背痛',             expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'green' },
  { number: 2,  title: '过敏反应/蜇伤',           expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 3,  title: '动物咬伤/攻击',           expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'green' },
  { number: 4,  title: '袭击/性侵犯',              expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 5,  title: '背痛（非创伤/非近期）',      expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'green' },
  { number: 6,  title: '呼吸困难',                 expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'yellow' },
  { number: 7,  title: '烧伤（烫伤）/爆炸伤',       expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 8,  title: '一氧化碳/吸入/危险品',      expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 9,  title: '心脏/呼吸骤停/死亡',       expectedDeterminant: '9-E-1',  hotCold: 'HOT',  correctTriage: 'red' },
  { number: 10, title: '胸痛/心脏问题',            expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 11, title: '窒息',                   expectedDeterminant: '11-D-2', hotCold: 'HOT',  correctTriage: 'red' },
  { number: 12, title: '抽搐/癫痫',              expectedDeterminant: '12-D-1', hotCold: 'HOT',  correctTriage: 'yellow' },
  { number: 13, title: '糖尿病问题',               expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'yellow' },
  { number: 14, title: '溺水/水域事故',            expectedDeterminant: '14-D-1', hotCold: 'HOT',  correctTriage: 'red' },
  { number: 15, title: '触电/雷击',              expectedDeterminant: '15-D-1', hotCold: 'HOT',  correctTriage: 'red' },
  { number: 16, title: '眼部问题/损伤',            expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'yellow' },
  { number: 17, title: '坠落/跌倒',              expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'yellow' },
  { number: 18, title: '头痛',                   expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'yellow' },
  { number: 19, title: '心脏问题/起搏器',           expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 20, title: '中暑/热损伤',            expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 21, title: '出血/撕裂伤',             expectedDeterminant: '21-D-3', hotCold: 'HOT',  correctTriage: 'red' },
  { number: 22, title: '无法进入的现场/被困',        expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'yellow' },
  { number: 23, title: '过量/中毒',              expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 24, title: '妊娠/分娩/流产',         expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 25, title: '精神问题/自杀企图',          expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'yellow' },
  { number: 26, title: '非特异性病患',            expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'green' },
  { number: 27, title: '刺伤/枪伤/穿透伤',        expectedDeterminant: '27-D-1', hotCold: 'HOT',  correctTriage: 'red' },
  { number: 28, title: '卒中（脑血管意外）',         expectedDeterminant: '28-C-1', hotCold: 'HOT',  correctTriage: 'red' },
  { number: 29, title: '交通/运输事故',           expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 30, title: '创伤',                   expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'red' },
  { number: 31, title: '晕厥/无意识',              expectedDeterminant: '',    hotCold: 'HOT',  correctTriage: 'yellow' },
  { number: 32, title: '未知问题（有人倒下）',      expectedDeterminant: 'Ω',   hotCold: 'COLD', correctTriage: 'green' },
  { number: 33, title: '泌尿系统问题',            expectedDeterminant: '',    hotCold: 'COLD', correctTriage: 'green' },
]

/** 按协议号查找 */
export function getProtocolByNumber(n: number): ProtocolEntry | undefined {
  return PROTOCOLS.find(p => p.number === n)
}

/** 按协议号获取名称 */
export function getProtocolTitle(n: number): string {
  return getProtocolByNumber(n)?.title ?? `未知协议(${n})`
}

/** 按协议号获取预期 hotCold */
export function getExpectedHotCold(n: number): 'HOT' | 'COLD' {
  return getProtocolByNumber(n)?.hotCold ?? 'COLD'
}

/** 按协议号获取预期分诊 */
export function getExpectedTriage(n: number): 'red' | 'yellow' | 'green' | 'black' {
  return getProtocolByNumber(n)?.correctTriage ?? 'green'
}
