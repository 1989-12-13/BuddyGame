// ============================================================
// 交叉核实通话 — 同一事故的第二位来电者
// ============================================================
// 结构性约束：一个事故只有**一个患者**。
// 两条线路各自持有独立的 WorldState，也就各自拥有一份 patientStatus；
// 若第二位来电者也跑一遍完整救援，就变成两个人同时衰减。
//
// 因此第二位来电者是一条「核实通话」：不拥有患者、不派车、不指导，
// 只负责带来一个与初报冲突的观察，交给玩家判断信哪一条。
// ============================================================

import type { CallerId, EmergencyScenario } from '../types'
import { ALL_CALLER_IDS, getCaller } from '../npc/personas'

/** 可能作为「第二位来电者」的关系类型 */
const SUPPLEMENT_RELATIONS = ['路人', '家属', '邻居', '朋友', '同事', '工友']

/** 呼吸描述中表示「不正常」的用词 */
const ABNORMAL_BREATHING = /没有|无|停|不|喘|窒息|微弱|困难|异常/

export interface ConflictReport {
  field: 'breathing'
  /** 初报的说法 */
  primary: string
  /** 第二位来电者的说法 */
  supplement: string
  /** 第二位来电者的开口话 */
  opening: string
}

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

/**
 * 从既有来电者中挑一位「第二位来电者」。
 * 确定性选择（按场景 id 哈希），便于复现与测试。
 */
export function pickSupplementCaller(scenarioId: string, primaryCallerId: CallerId): CallerId {
  const pool = ALL_CALLER_IDS.filter(id =>
    id !== primaryCallerId
    && SUPPLEMENT_RELATIONS.includes(getCaller(id as CallerId).relationship))
  if (pool.length === 0) return primaryCallerId
  return pool[hashSeed(scenarioId) % pool.length] as CallerId
}

/** 构造与初报**方向相反**的呼吸观察，形成真正的冲突 */
export function buildConflictReport(scenario: EmergencyScenario): ConflictReport {
  const primary = scenario.fourElements.condition.breathing
  const primaryLooksNormal = !ABNORMAL_BREATHING.test(primary)

  return primaryLooksNormal
    ? {
        field: 'breathing',
        primary,
        supplement: '没有正常呼吸，只有偶尔抽一下，胸口动得很怪',
        opening: '喂？我是刚赶到的那位家属。你们电话里问的那个人……我看见的和前面说的不太一样，他好像没在正常呼吸了！',
      }
    : {
        field: 'breathing',
        primary,
        supplement: '还有呼吸，我一直看着他胸口在动',
        opening: '喂？我是刚赶到的那位家属。你们是不是搞错了？我看着他还喘着气啊，胸口一直在动！',
      }
}

export const VERIFY_SUFFIX = '__verify'

/** 由初报场景派生出「核实通话」场景 */
export function buildVerificationCall(scenario: EmergencyScenario): EmergencyScenario {
  const report = buildConflictReport(scenario)
  return {
    ...scenario,
    id: `${scenario.id}${VERIFY_SUFFIX}`,
    title: `${scenario.title} · 交叉核实`,
    callerId: pickSupplementCaller(scenario.id, scenario.callerId),
    isPrank: false,
    isVerification: true,
    openingLine: report.opening,
    // 核实通话不拥有患者、不派车、不指导：清空这几条链路
    guidance: null,
    specialEvents: [],
    mpdsQuestions: [],
  }
}
