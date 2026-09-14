// ============================================================
// MPDS 协议卡片 17 — 坠落/跌倒
// 分诊级别: 绿色（轻伤）/ 但有骨折和头部受伤可能
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CAMPAIGN_GUIDANCE } from './campaignGuidance'

export const fallsElderlyCard: EmergencyScenario = {
  id: 'falls_elderly',
  title: '老人跌倒',
  callerId: 'ma_tao',
  phoneNumber: '135****5555',
  baseStation: '西城区德胜门附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 17,
    title: '坠落/跌倒',
    chiefComplaint: '老年女性从床上跌落，右髋部疼痛无法站立，疑似骨折',
    determinantCode: '17-C-2',
    hotCold: 'COLD',
    keyQuestions: [
      '从多高的地方摔下来？',
      '摔到了哪个部位？',
      '有没有头痛、恶心、呕吐？',
      '有没有出血或明显外伤？',
      '老人平时有没有骨质疏松？',
    ],
  },

  openingLine: '你好，我妈刚才从床上掉下来了，大概半米高，现在躺在地上动不了说右边胯骨疼得厉害，站不起来',

  fourElements: {
    address: {
      vague: '西城区德胜门附近',
      partial: '德胜门内大街',
      full: '德胜门内大街103号院2号楼3单元101室，德胜门桥往南200米路西',
    },
    contact: '135****5555',
    condition: {
      chiefComplaint: '我妈午睡翻身时从床上滚下来了，大概半米高，摔到右边',
      age: '78岁',
      gender: '女性',
      consciousness: '人是清醒的，能正常说话',
      breathing: '呼吸正常',
      patientCount: '1人',
      additional: [
        '右髋部着地',
        '右腿无法活动一碰就疼',
        '有骨质疏松和高血压',
        '没有流血',
        '意识一直清楚',
      ],
    },
    purpose: '她疼得不行动不了，我能不能把她抱到床上？',
  },

  mpdsQuestions: [
    {
      id: 'mpds_falls_injury',
      category: 'pain',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '受伤部位: 哪里疼？',
      questionText: '哪里疼？具体是哪个部位？',
      answer: '右边大腿根附近，一动就疼得嗷嗷叫',
      answerVague: '右边大腿根...疼...',
      ramblingAnswer: '右边...就是胯骨那个位置，大腿根往上那一块。她自己说疼得钻心，我轻轻碰了一下她就大叫。右腿完全不敢动，稍微碰一下就疼得不行。左脚倒是还能活动。躺在地上一直喊疼，我想把她抱起来她不让说疼死了。',
      panickedAnswer: '右腿大腿根那一块！！疼得钻心！！我碰都不敢碰！！',
      reveals: ['additional'],
      judgment: {
        question: '右髋部剧痛无法承重提示什么？',
        options: [
          { label: '疑似股骨颈骨折不能移动', fills: [{ field: 'conditionNote', value: '疑似股骨颈骨折，禁止移动患者' }], isCorrect: true },
          { label: '可能是普通肌肉拉伤', fills: [{ field: 'conditionNote', value: '考虑肌肉拉伤' }], isCorrect: false },
          { label: '腰椎间盘突出发作', fills: [{ field: 'conditionNote', value: '考虑腰椎问题' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_falls_head',
      category: 'consciousness',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '头部: 有没有撞到头？',
      questionText: '有没有撞到头？',
      answer: '没有，她说头没碰到，是右边身子先落地的',
      answerVague: '没...没撞到...',
      ramblingAnswer: '没有，她说头没碰到，是右边身子先落地的。我刚才一直在问，她自己说头没事，就是右边大腿根那里疼得不行。',
      panickedAnswer: '没有撞到头！！就是右边疼！！',
      reveals: ['consciousness'],
    },
  ],

  guidance: CAMPAIGN_GUIDANCE.falls_elderly,

  specialEvents: [
    {
      id: 'falls_pain_worsen',
      trigger: 'time_elapsed',
      triggerValue: '20',
      type: 'new_symptom',
      dialogue: '她说疼得越来越厉害了，一直在冒冷汗，但人还是清醒的。我能给她吃止痛药吗？',
    },
    {
      id: 'falls_consciousness_correction',
      trigger: 'time_elapsed',
      triggerValue: '45',
      type: 'caller_correction',
      dialogue: '等一下……等一下！我刚才叫他，他没应我了！刚才还答应得好好的，怎么突然就……他是不是不行了？！',
      correction: {
        question: '来电者改口：患者从「有反应」变成「叫不应」。你如何处置？',
        options: [
          {
            label: '按最新观察更新为无反应，并重新确认呼吸',
            sublabel: '最新的现场观察优先，但呼吸仍需再核实一次',
            fills: [{ field: 'conscious', value: false }],
            isCorrect: true,
          },
          {
            label: '维持「有反应」的判断，等专业人员到场再评估',
            sublabel: '忽略最新观察会让后续处置建立在过时信息上',
            fills: [],
            isCorrect: false,
          },
        ],
      },
    },
  ],

  outcomeNarrative: {
    good: '你没让马涛去抱老人，让他拿被子垫在身下、守在旁边说话。老人一直醒着，救护车到的时候还能自己认出儿子。',
    bad: '电话里对"能不能抱"回得太含糊，马涛自己把老人往床上抬了一次。老人疼得叫出声，之后右腿的位置看着更别扭了。',
    prank: '',
  },
}
