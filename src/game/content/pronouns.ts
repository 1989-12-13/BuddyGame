// ============================================================
// 120调度台 — 人称代词语气助手
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
  const formal = getTitle(gender)
  if (relationship === '家人' || relationship === '家属') {
    if (gender === '不详') return '您的家人'
    return p === 'TA' ? '患者' : (gender === '女性' ? '她' : '他')
  }
  if (relationship === '路人') return `这位${formal}`
  if (relationship === '同事') return `这位${p === 'TA' ? '同事' : (gender === '女性' ? '女同事' : '男同事')}`
  if (relationship === '朋友') return `这位朋友`
  if (relationship === '邻居') return `邻居`
  if (relationship === '伴侣' || relationship === '夫妻') return p === 'TA' ? '伴侣' : (gender === '女性' ? '妻子' : '丈夫')
  if (relationship === '母亲') return `您母亲`
  if (relationship === '父亲') return `您父亲`
  if (relationship === '儿子') return `您儿子`
  if (relationship === '妻子') return `您妻子`
  if (relationship === '丈夫') return `您丈夫`
  if (relationship === '本人') return `您自己`
  if (relationship === '小孩') return `这个小朋友`
  if (relationship === '室友') return `您的室友`
  if (relationship === '工友') return `您的工友`
  return `这位${formal}`
}
