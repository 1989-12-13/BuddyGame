// ============================================================
// 零点接线台 — 人称代词语气助手
// 全游戏统一事实源：涉及患者性别人称的描述均由此派生
// ============================================================

/** 可用的性别值（与 card fourElements.condition.gender 一致） */
export type PatientGender = '男性' | '女性' | '不详'

/** 获取主格代词（他/她/TA） */
export function getPronoun(gender: PatientGender | string): string {
  if (gender === '女性') return '她'
  if (gender === '男性') return '他'
  return 'TA'
}

/** 获取所有格代词（他的/她的/TA的） */
export function getPossessive(gender: PatientGender | string): string {
  if (gender === '女性') return '她的'
  if (gender === '男性') return '他的'
  return 'TA的'
}

/** 获取宾格代词（他/她/TA） */
export function getObjective(gender: PatientGender | string): string {
  if (gender === '女性') return '她'
  if (gender === '男性') return '他'
  return 'TA'
}

/** 获取称呼（女士/先生/患者） */
export function getTitle(gender: PatientGender | string): string {
  if (gender === '女性') return '女士'
  if (gender === '男性') return '先生'
  return '患者'
}

/** 根据 gender 和 relationship 生成来电者描述患者时的自然短语 */
export function getPatientDescriptor(gender: PatientGender | string, relationship?: string): string {
  const p = getPronoun(gender)
  if (relationship === '家人' || relationship === '家属') {
    return gender === '女性' ? '我家人（女）' : gender === '男性' ? '我家人（男）' : '我家人'
  }
  if (relationship === '路人') return `这位${p === 'TA' ? '路人' : (gender === '女性' ? '女士' : '先生')}`
  if (relationship === '同事') return `我这位${p === 'TA' ? '同事' : (gender === '女性' ? '女同事' : '男同事')}`
  // 默认场景（熟人/其他）
  return p
}
