// ============================================================
// MPDS 协议卡片 09 — 心脏/呼吸骤停/死亡
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CPR_MINI_GAME_INSTRUCTION } from '../../../components/minigames/engines/cprUtils'

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

  guidance: {
    title: '心肺复苏（CPR）指导',
    intro: '救护车已经在路上了。在救护车到达之前，请您按照我的指令来帮助患者。您能做胸外按压吗？',
    steps: [
      {
        id: 'cpr_position',
        instruction: '请让患者平躺在地板上，确保背部是硬的平整的平面。',
        prompt: '第一步：摆好体位',
        options: [
          '让患者平躺在硬地板上',
          '把患者扶起来坐在椅子上',
          '让患者侧躺',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！平躺硬地板是做CPR的前提。',
          incorrect: '不对。心脏骤停必须平躺在硬平面上，坐姿或侧躺无法有效按压。',
          callerCorrect: '好！我把他放平了！躺地板上了！然后呢？下一步我该做什么？！',
          callerIncorrect: '啊？扶他起来坐着？他人都没反应了怎么坐啊……你是不是说错了？',
        },
      },
      {
        id: 'cpr_hands',
        instruction: '请把您一只手的手掌根部放在患者胸骨正中，两乳头连线的中点。另一只手叠在上面，十指相扣。',
        prompt: '第二步：找到按压位置',
        options: [
          '手掌根部放在胸骨正中两乳头连线中点',
          '手掌放在肚子上',
          '手掌放在左胸心脏位置',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！胸骨正中是最有效的按压位置。',
          incorrect: '不对。按压位置应在胸骨正中（两乳头连线中点），不是肚子或左胸。',
          callerCorrect: '放好了！两只手叠在一起，就放在你说的那个位置！现在要怎么按？快告诉我！',
          callerIncorrect: '放肚子上了……但是他肚子一点反应都没有啊……我真的放对了吗？他没动静啊！',
        },
      },
      {
        id: 'cpr_depth',
        instruction: '请用力按压，深度至少5厘米，频率大约每分钟100-120次，跟我数节奏：01、02、03……',
        prompt: '第三步：按压节奏',
        options: [
          '深度5cm，频率100-120次/分钟',
          '轻轻按压，不要太用力',
          '越快越好，不管深度',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！标准CPR是深度5-6cm，频率100-120次/分钟。',
          incorrect: '不对。按压力度不够或太快太慢都会影响效果。标准是5cm深度，100-120次/分钟。',
          callerCorrect: '我跟你的节奏按了！01、02、03！她胸口在起伏！我的手感觉得到！她是不是有反应了？！',
          callerIncorrect: '我怕太大力把她按坏……就稍微轻轻按了按……她好像还是没反应……是不是我做错了？',
        },
      },
      {
        id: 'cpr_game',
        instruction: '开始心肺复苏：30次胸外按压后做2次人工呼吸，循环2轮。',
        prompt: '实操环节：CPR 30:2',
        options: ['开始'],
        correctIndex: 0,
        feedback: {
          correct: 'CPR操作到位。',
          incorrect: 'CPR操作需改进。',
          callerCorrect: '我按了30下又吹了2口气，他好像有反应了！',
          callerIncorrect: '我太紧张了，手一直在抖……按不准节奏',
        },
        miniGame: {
          kind: 'cpr',
          title: '心肺复苏 30:2',
          instruction: CPR_MINI_GAME_INSTRUCTION,
          passThreshold: 0.5,
          cycles: 2,
          feedback: { good: '我按了30下又吹了2口气，他好像有反应了！', bad: '我太紧张了，手一直在抖……按不准节奏' },
        },
      },
    ],
  },

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
