// ============================================================
// 120调度台 — 场景卡片一致性校验测试
// 自动捕获：协议号/名称错位、判定码前缀错误、hotCold/分诊不一致、
//           人称代词与性别不匹配、ID 重复、必填字段缺失
// ============================================================

import { describe, it, expect } from 'vitest'
import { PROTOCOLS, getProtocolByNumber, getPronoun } from '../../content'
import {
  cardiacArrestCard,
  traumaCarCard,
  strokeCard,
  obstetricCard,
  chemicalBurnCard,
  prankCallCard,
  drowningCard,
  chestPainCard,
  seizureCard,
  diabeticCard,
  anaphylaxisCard,
  hemorrhageCard,
  overdoseCard,
  asthmaCard,
  fallsElderlyCard,
  electrocutionCard,
  abdominalPainCard,
  animalBiteCard,
  assaultCard,
  backPainCard,
  carbonMonoxideCard,
  chokingCard,
  eyeInjuryCard,
  severeHeadacheCard,
  heatStrokeCard,
  heartProblemsCard,
  psychiatricCard,
  stabGunshotCard,
  unconsciousFaintingCard,
  sickPersonCard,
  traumaCard,
  entrapmentCard,
  urinaryCard,
} from './index'

// ==================== 全部卡片 ====================
const ALL_CARDS = [
  cardiacArrestCard,
  traumaCarCard,
  strokeCard,
  obstetricCard,
  chemicalBurnCard,
  prankCallCard,
  drowningCard,
  chestPainCard,
  seizureCard,
  diabeticCard,
  anaphylaxisCard,
  hemorrhageCard,
  overdoseCard,
  asthmaCard,
  fallsElderlyCard,
  electrocutionCard,
  abdominalPainCard,
  animalBiteCard,
  assaultCard,
  backPainCard,
  carbonMonoxideCard,
  chokingCard,
  eyeInjuryCard,
  severeHeadacheCard,
  heatStrokeCard,
  heartProblemsCard,
  psychiatricCard,
  stabGunshotCard,
  unconsciousFaintingCard,
  sickPersonCard,
  traumaCard,
  entrapmentCard,
  urinaryCard,
]

// ==================== IPA 代词匹配模式 ====================
/** 从一段文本中检查某个代词的出现次数（忽略注释/代码结构） */
function countPronounIn(text: string, pronoun: string): number {
  // 只匹配中文正文中的代词，避免匹配 CSS/JS 代码标记
  // 典型使用场景：outcomeNarrative.good/bad 中的 "他/她/TA"
  const regex = new RegExp(`(?<=[，。！？；、：））"])?${pronoun}(?=[，。！？；、：（）(（]|\\s|$)`, 'g')
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

/** 获取文本中的所有中英文代词出现 */
function findPronouns(text: string): string[] {
  const result: string[] = []
  const regex = /(?:[，。！？；、：））"\s]|^)([他她])(?=[，。！？；、：（）(（]|\\s|$|")/g
  let m
  while ((m = regex.exec(text)) !== null) {
    result.push(m[1])
  }
  // 也检查 TA（前后无汉字）
  const taRegex = /(?<!\p{Unified_Ideograph})TA(?!\p{Unified_Ideograph})/gu
  while ((m = taRegex.exec(text)) !== null) {
    result.push('TA')
  }
  return result
}

// ==================== 测试套件 ====================

describe('跨卡片一致性校验', () => {
  // ---------- 1. 全局 ID 唯一 ----------
  it('所有卡片 ID 唯一', () => {
    const ids = ALL_CARDS.map(c => c.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes, `重复 ID: ${[...new Set(dupes)].join(', ')}`).toEqual([])
  })

  // ---------- 2. 协议号 / 名称 / 判定码前缀 / hotCold / 分诊一致性 ----------
  describe('MPDS 协议信息一致性', () => {
    for (const card of ALL_CARDS) {
      const { number, title, determinantCode, hotCold } = card.mpdsCard
      const proto = getProtocolByNumber(number)
      const label = `协议 ${number} (${card.id})`

      it(`${label} 号存在 PROTOCOLS 中`, () => {
        expect(proto, `协议 ${number} 未在 PROTOCOLS 中定义`).toBeDefined()
      })

      if (proto) {
        it(`${label} 标题 "[${title}]" 匹配 PROTOCOLS "[${proto.title}]"`, () => {
          expect(title).toBe(proto.title)
        })

        it(`${label} hotCold "${hotCold}" 匹配预期 "${proto.hotCold}"`, () => {
          expect(hotCold).toBe(proto.hotCold)
        })

        it(`${label} correctTriage "${card.correctTriage}" 匹配预期 "${proto.correctTriage}"`, () => {
          expect(card.correctTriage).toBe(proto.correctTriage)
        })
      }

      // 判定码前缀匹配协议号
      if (determinantCode && determinantCode !== 'Ω') {
        it(`${label} 判定码 "${determinantCode}" 以 "${number}-" 开头`, () => {
          expect(determinantCode.startsWith(`${number}-`)).toBe(true)
        })
      }
    }
  })

  // ---------- 3. 卡片内问题 ID 唯一性 ----------
  describe('mpdsQuestions ID 唯一性', () => {
    for (const card of ALL_CARDS) {
      it(`${card.id} 的 mpdsQuestions ID 无重复`, () => {
        const ids = card.mpdsQuestions.map(q => q.id)
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
        expect(dupes, `${card.id}: 重复问题 ID: ${[...new Set(dupes)].join(', ')}`).toEqual([])
      })
    }
  })

  // ---------- 4. 急救指导步骤 ID 唯一性 ----------
  describe('guidance step ID 唯一性', () => {
    for (const card of ALL_CARDS) {
      it(`${card.id} 的 guidance step ID 无重复`, () => {
        if (!card.guidance) return // 跳过无指导的场景
        const ids = card.guidance.steps.map(s => s.id)
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
        expect(dupes, `${card.id}: 重复 step ID: ${[...new Set(dupes)].join(', ')}`).toEqual([])
      })
    }
  })

  // ---------- 5. specialEvents ID 唯一性 ----------
  describe('specialEvents ID 唯一性', () => {
    for (const card of ALL_CARDS) {
      it(`${card.id} 的 specialEvents ID 无重复`, () => {
        const ids = card.specialEvents.map(e => e.id)
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
        expect(dupes, `${card.id}: 重复事件 ID: ${[...new Set(dupes)].join(', ')}`).toEqual([])
      })
    }
  })

  // ---------- 6. outcomeNarrative 人称一致性 ----------
  describe('outcomeNarrative 人称与 gender 一致', () => {
    for (const card of ALL_CARDS) {
      const gender = card.fourElements.condition.gender
      const expectedPronoun = getPronoun(gender)
      const narratives = [card.outcomeNarrative.good, card.outcomeNarrative.bad]
      if (card.outcomeNarrative.prank) narratives.push(card.outcomeNarrative.prank)

      it(`${card.id}(gender=${gender}) outcomeNarrative 使用正确人称 "${expectedPronoun}"`, () => {
        const wrongPronouns: string[] = []
        for (const n of narratives) {
          if (!n) continue
          const found = findPronouns(n)
          const wrong = found.filter(p => p !== expectedPronoun && p !== 'TA')
          wrongPronouns.push(...wrong)
        }
        // 只有当 gender 明确（男/女）时，才严格要求
        if (gender === '女性' || gender === '男性') {
          expect(wrongPronouns.length, `${card.id}: 包含不匹配人称: ${[...new Set(wrongPronouns)].join(', ')}`).toBe(0)
        }
      })
    }
  })

  // ---------- 7. 必填字段完整性 ----------
  describe('必填字段完整性', () => {
    for (const card of ALL_CARDS) {
      it(`${card.id} openingLine 非空`, () => {
        expect(card.openingLine).toBeTruthy()
      })
      it(`${card.id} fourElements.address 字段完整`, () => {
        expect(card.fourElements.address.vague).toBeTruthy()
        expect(card.fourElements.address.partial).toBeTruthy()
        expect(card.fourElements.address.full).toBeTruthy()
      })
      it(`${card.id} fourElements.contact 非空`, () => {
        expect(card.fourElements.contact).toBeTruthy()
      })
      it(`${card.id} fourElements.condition.chiefComplaint 非空`, () => {
        expect(card.fourElements.condition.chiefComplaint).toBeTruthy()
      })
      it(`${card.id} fourElements.condition.age 非空`, () => {
        expect(card.fourElements.condition.age).toBeTruthy()
      })
      it(`${card.id} fourElements.condition.consciousness 非空`, () => {
        expect(card.fourElements.condition.consciousness).toBeTruthy()
      })
      it(`${card.id} fourElements.condition.breathing 非空`, () => {
        expect(card.fourElements.condition.breathing).toBeTruthy()
      })
      it(`${card.id} fourElements.purpose 非空`, () => {
        expect(card.fourElements.purpose).toBeTruthy()
      })
      it(`${card.id} outcomeNarrative 非空`, () => {
        expect(card.outcomeNarrative.good).toBeTruthy()
        expect(card.outcomeNarrative.bad).toBeTruthy()
      })
    }
  })

  // ---------- 8. 分诊等级为合法值 ----------
  describe('correctTriage 合法', () => {
    for (const card of ALL_CARDS) {
      it(`${card.id} correctTriage 为合法值`, () => {
        expect(['red', 'yellow', 'green', 'black']).toContain(card.correctTriage)
      })
    }
  })

  // ---------- 9. hotCold 为合法值 ----------
  describe('hotCold 合法', () => {
    for (const card of ALL_CARDS) {
      it(`${card.id} mpdsCard.hotCold 为合法值`, () => {
        expect(['HOT', 'COLD']).toContain(card.mpdsCard.hotCold)
      })
    }
  })

  // ---------- 10. mpdsCard 有 keyQuestions ----------
  describe('mpdsCard.keyQuestions 非空', () => {
    for (const card of ALL_CARDS) {
      it(`${card.id} 至少有 1 个 keyQuestion`, () => {
        expect(card.mpdsCard.keyQuestions.length).toBeGreaterThanOrEqual(1)
      })
    }
  })
})
