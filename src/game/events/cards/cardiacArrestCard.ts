// ============================================================
// MPDS 协议卡片 09 — 心脏/呼吸骤停/死亡
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CAMPAIGN_GUIDANCE } from './campaignGuidance'

export const cardiacArrestCard: EmergencyScenario = {
  id: 'cardiac_arrest',
  title: '心脏骤停',
  callerId: 'li_jianguo',
  phoneNumber: '138****4321',
  baseStation: '朝阳区望京街道附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 9,
    title: '心脏/呼吸骤停/死亡',
    chiefComplaint: '患者无意识、无呼吸或无有效呼吸',
    determinantCode: '9-E-1',
    hotCold: 'HOT',
    keyQuestions: [
      '患者是否有意识？',
      '患者是否在呼吸？',
      '是否为目击骤停？',
      '患者年龄？',
      '是否有人在做CPR？',
    ],
  },

  openingLine: '喂！120吗？我老婆刚才还好好的在看电视，突然就倒在地上了！怎么叫都不醒！你们快来啊！',

  fourElements: {
    address: {
      vague: '朝阳区望京街道附近',
      partial: '望京SOHO旁边的小区，望京西园三区',
      full: '望京西园三区12号楼2单元501室，楼下有一个京东便利店',
    },
    contact: '138****4321',
    condition: {
      chiefComplaint: '我老婆在看电视，突然倒在地上，怎么叫都叫不醒',
      age: '45岁左右',
      gender: '女性',
      consciousness: '怎么叫都不醒，一点反应都没有',
      breathing: '没有呼吸了！胸口都不动了',
      patientCount: '1人',
      additional: [
        '之前有心脏病史',
        '嘴唇发紫',
        '大概5分钟前倒下的',
      ],
    },
    purpose: '快来救命！需要救护车！',
  },

  /** 5步标准协议已覆盖意识+呼吸+年龄，无需补充MPDS问询 */
  mpdsQuestions: [],

  guidance: CAMPAIGN_GUIDANCE.cardiac_arrest,

  specialEvents: [
    {
      id: 'cpr_caller_cry',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'caller_panic',
      dialogue: '她脸色越来越白了！救护车怎么还没到啊！呜呜……',
    },
  ],

  outcomeNarrative: {
    good: '患者心脏骤停，接线员在43秒内完成派车并指导CPR。救护车8分钟后到达，患者被成功除颤，恢复自主心跳。',
    bad: '患者心脏骤停，派车延误加上地址不完整，救护车超过15分钟才到达。错过了黄金抢救时间……',
    prank: '',
  },
}
