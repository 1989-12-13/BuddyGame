// ============================================================
// MPDS 协议卡片 10 — 胸痛/心脏问题
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CAMPAIGN_GUIDANCE } from './campaignGuidance'

export const chestPainCard: EmergencyScenario = {
  id: 'chest_pain',
  title: '疑似心梗',
  callerId: 'sun_wei',
  phoneNumber: '136****8888',
  baseStation: '海淀区中关村科技园附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 10,
    title: '胸痛/心脏问题',
    chiefComplaint: '中年男性突发胸痛、大汗淋漓，放射至左肩',
    determinantCode: '10-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '疼痛从什么时候开始的？',
      '疼痛在哪个位置？有没有放射到其他地方？',
      '疼痛性质是怎么样的？（压榨样/针刺样/撕裂样）',
      '有没有出冷汗、恶心、呼吸困难？',
      '有没有心脏病史？',
    ],
  },

  openingLine: '120吗！我朋友突然说胸口疼得厉害，满头大汗，脸色煞白，动不了了！',

  fourElements: {
    address: {
      vague: '海淀区中关村科技园附近',
      partial: '中关村科技园B座一楼大厅',
      full: '中关村科技园B座一楼大厅休息区，海淀大街和中关村大街交叉口东南角',
    },
    contact: '136****8888',
    condition: {
      chiefComplaint: '我朋友刚才开会的时候突然捂着胸口说疼，现在脸色煞白坐在椅子上动不了',
      age: '45岁',
      gender: '男性',
      consciousness: '人是清醒的，但看起来很痛苦',
      breathing: '呼吸急促，喘不上气',
      patientCount: '1人',
      additional: [
        '疼痛从胸口往左边胳膊和脖子蔓延',
        '他说像有大石头压在胸口上',
        '出了一身冷汗，衣服都湿透了',
        '有高血压和高血脂病史',
      ],
    },
    purpose: '他是不是心梗了？你们快来！要带什么东西吗？',
  },

  mpdsQuestions: [
    {
      id: 'mpds_chest_pain_type',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '疼痛性质',
      questionText: '疼痛是什么样的感觉？',
      answer: '他说像有个大石头压在胸口上，喘不上气',
      answerVague: '压着疼...喘不上气...',
      ramblingAnswer: '他说像有个大石头压在胸口上一样，喘气都费劲。刚才开会的时候还好好的，突然就说胸口闷得慌，然后就开始疼了。现在越来越疼了，他一直捂着胸口，脸色白得吓人。',
      panickedAnswer: '他说胸口像被压住了一样！！喘不上气！！脸色白得吓人！！你们到底什么时候到啊？！',
      reveals: ['additional'],
      judgment: {
        question: '压榨样胸痛最可能的诊断？',
        options: [
          { label: '压榨样疼痛（心梗典型表现）', fills: [{ field: 'conditionNote', value: '压榨样胸痛，高度怀疑急性心梗' }], isCorrect: true },
          { label: '针刺样疼痛', fills: [], isCorrect: false },
          { label: '撕裂样疼痛', fills: [], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_chest_radiation',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '放射痛',
      questionText: '疼痛有没有往其他地方跑？',
      answer: '有！他说左边胳膊和脖子那一带都疼',
      answerVague: '好像有...左边...',
      ramblingAnswer: '有！他刚才说胸口疼，后来又捂着左边胳膊说那边也疼，连脖子那一块都酸疼酸疼的。我查过心梗的症状，好像这就是放射痛对吧？他是不是真的是心梗了？',
      panickedAnswer: '有！！他说左边整条胳膊都麻了！！脖子也不舒服！！你们快啊！！',
      reveals: ['additional'],
      judgment: {
        question: '疼痛放射至左肩左臂——这提示什么？',
        options: [
          { label: '典型心梗放射痛，心肌缺血表现', fills: [{ field: 'conditionNote', value: '疼痛放射至左肩左臂，典型心梗表现' }], isCorrect: true },
          { label: '只是普通肌肉酸痛', fills: [], isCorrect: false },
          { label: '可能是主动脉夹层放射痛', fills: [], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_chest_history',
      category: 'pain',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '用药史',
      questionText: '有没有心脏病史或做过支架？',
      answer: '有高血压高血脂，但没做过支架',
      answerVague: '高血压...高血脂...',
      ramblingAnswer: '他平时身体还算可以的，就是有高血压和高血脂，一直在吃降压药。没做过支架，也没有冠心病史。不过他爸以前是心梗走的，所以他一直挺注意的，每年体检都做。但是今天突然就这样了。',
      panickedAnswer: '有高血压！！一直吃降压药！！没做过支架！！但是他说疼得受不了了！！',
      reveals: ['additional'],
    },
  ],

  guidance: CAMPAIGN_GUIDANCE.chest_pain,

  specialEvents: [
    {
      id: 'chest_worsening',
      trigger: 'time_elapsed',
      triggerValue: '20',
      type: 'new_symptom',
      dialogue: '他手捂着胸口说越来越疼了！疼得说不出话了！脸色更差了！',
    },
  ],

  outcomeNarrative: {
    good: '患者急性前壁心梗，调度员快速识别并指导嚼服阿司匹林，18分钟后患者到达导管室，支架植入后恢复良好',
    bad: '患者坚持站着走动，加重了心脏负担，到达医院后因室颤抢救，虽然最终存活但心肌大面积坏死',
    prank: '',
  },
}
