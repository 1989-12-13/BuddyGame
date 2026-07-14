// ============================================================
// TTS 音色选择 — 按 (gender × ageBucket) 分配
// 设计目标：
//   1. 同性别同年龄段共用一个音色，缓存命中率最大化
//   2. relationship（与患者关系）粗粒度映射 + name 末字歧义消解
//   3. 音色名集中在 SPEAKER_POOL，适配火山控制台变更只需改这里
// ============================================================

export type CallerGender = 'male' | 'female'
export type CallerAgeBucket = 'child' | 'adult' | 'elderly'

export interface CallerDemographics {
  gender: CallerGender
  ageBucket: CallerAgeBucket
}

// ---------- 关系 → 性别映射 ----------
const MALE_RELATIONSHIPS = new Set([
  '丈夫', '儿子', '父亲', '工友', '同事', '室友', '家属', '路人', '朋友',
])
const FEMALE_RELATIONSHIPS = new Set([
  '妻子', '母亲', '女儿',
])
// '邻居' / '本人' / '小孩' 等需结合 name 推断

// ---------- 末字 → 性别（用于歧义消解） ----------
const FEMALE_NAME_CHARS = '芳娜美燕梅兰欣丽娟敏华莉琴雯静雅慧'
const MALE_NAME_CHARS = '强国伟明磊涛刚峰宇奇杰文雷军鹏斌亮勇辉晓'

/** 从 relationship + name 启发式推导人口学信息
 *  - relationship 直接命中映射表 → 用映射
 *  - '邻居' / '本人' / '路人' 等 → 结合 name 末字判断
 *  - '小孩' → 童声，年龄档 child
 *  - 全部无法判断 → 默认 male/adult */
export function inferCallerDemographics(
  relationship: string,
  name: string,
): CallerDemographics {
  // 儿童优先
  if (relationship === '小孩' || name === '小朋友') {
    return { gender: 'male', ageBucket: 'child' }
  }

  // 直接关系映射
  if (MALE_RELATIONSHIPS.has(relationship)) {
    return { gender: 'male', ageBucket: 'adult' }
  }
  if (FEMALE_RELATIONSHIPS.has(relationship)) {
    return { gender: 'female', ageBucket: 'adult' }
  }

  // 歧义关系：用 name 末字判断
  const lastChar = name[name.length - 1] ?? ''
  if (FEMALE_NAME_CHARS.includes(lastChar)) {
    return { gender: 'female', ageBucket: 'adult' }
  }
  if (MALE_NAME_CHARS.includes(lastChar)) {
    return { gender: 'male', ageBucket: 'adult' }
  }

  // 默认：男/成人
  return { gender: 'male', ageBucket: 'adult' }
}

// ---------- 音色池 ----------
/** (gender × ageBucket) → 火山引擎 seed-tts-2.0 音色名
 *  名字以火山控制台实际为准；若默认音色在你的账号不存在，
 *  编辑此表替换为控制台里看到的名称即可 */
export const SPEAKER_POOL: Record<string, string> = {
  // 男成人 — 年轻版（m191），用户控制台确认可用
  male_adult:      'zh_male_m191_uranus_bigtts',
  female_adult:    'zh_female_vv_uranus_bigtts',
  male_elderly:    'zh_male_m191_uranus_bigtts',
  female_elderly:  'zh_female_vv_uranus_bigtts',
  // 童声（用户控制台确认可用：天才童声）
  child:           'zh_male_tiancaitongsheng_mars_bigtts',
}

/** 完整 key（含 fallback 路径），便于调试 */
export function pickSpeaker(
  relationship: string,
  name: string,
): string {
  const demo = inferCallerDemographics(relationship, name)
  // 童声忽略性别（多数 TTS 系统儿童音色不分男女）
  const key = demo.ageBucket === 'child'
    ? 'child'
    : `${demo.gender}_${demo.ageBucket}`
  return SPEAKER_POOL[key]
    ?? (demo.gender === 'male' ? SPEAKER_POOL.male_adult : SPEAKER_POOL.female_adult)
}