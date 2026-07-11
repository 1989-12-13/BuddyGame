// ============================================================
// MPDS 协议卡片 33 — 泌尿系统问题
// 分诊级别: 轻伤（绿色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const urinaryCard: EmergencyScenario = {
  id: 'urinary',
  title: '肾绞痛',
  callerId: 'zheng_yu',
  phoneNumber: '158****6666',
  baseStation: '东城区东直门附近',
  isPrank: false,
  correctTriage: 'green',

  mpdsCard: {
    number: 33,
    title: '泌尿系统问题',
    chiefComplaint: '中年男性突發左侧腰腹部剧烈绞痛放射至会阴部伴恶心',
    determinantCode: '33-B-2',
    hotCold: 'COLD',
    keyQuestions: [
      '疼痛在哪个位置？',
      '疼痛是什么感觉？',
      '有没有发烧？',
      '排尿有没有问题或血尿？',
      '有没有肾结石病史？',
    ],
  },

  openingLine: '120吗我左边腰这里疼得要命，一阵一阵的，疼得我直冒冷汗还恶心想吐，是不是肾结石犯了',

  fourElements: {
    address: {
      vague: '东城区东直门附近',
      partial: '东直门外大街东方银座',
      full: '东直门外大街东方银座公寓C座1508室',
    },
    contact: '158****6666',
    condition: {
      chiefComplaint: '左侧腰腹部绞痛一阵一阵的疼得要命伴有恶心',
      age: '35岁',
      gender: '男性',
      consciousness: '清醒但疼得坐立不安',
      breathing: '疼得喘粗气',
      patientCount: '1人',
      additional: [
        '疼痛半小时前突然开始',
        '疼痛是阵发性的每几分钟疼一次',
        '疼痛从腰往肚子下面放射',
        '以前有过肾结石病史',
        '没有发烧',
      ],
    },
    purpose: '受不了了需要打止痛针',
  },

  mpdsQuestions: [
    {
      id: 'mpds_urinary_pain',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -6,
      label: '疼痛在哪个位置？',
      questionText: '具体哪里疼？疼痛有没有往其他地方跑？',
      answer: '左边腰这里，疼的时候往肚子下面和小肚子那边串',
      answerVague: '左边腰...往下串...',
      ramblingAnswer: '左边腰后面那个位置，就是肾那个地方，疼起来的时候感觉有一条线一样从腰往下串到肚子然后到下面。一阵一阵的大概三四分钟疼一次，疼起来的时候我根本站不住只能蹲着。不疼的时候又跟没事人一样但是过一会儿又来了。',
      panickedAnswer: '腰！！左边腰！！往下串到肚子！！疼死我了！！一阵一阵的根本受不了！！',
      reveals: ['additional'],
      judgment: {
        question: '阵发性绞痛从腰部向会阴部放射，最可能的诊断是？',
        options: [
          { label: '输尿管结石（肾绞痛）', fills: [{ field: 'conditionNote', value: '肾绞痛，拟诊输尿管结石' }], isCorrect: true },
          { label: '急性阑尾炎', fills: [{ field: 'conditionNote', value: '疑似阑尾炎' }], isCorrect: false },
          { label: '急性肠胃炎', fills: [{ field: 'conditionNote', value: '疑似肠胃炎' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_urinary_urine',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -4,
      label: '小便有血吗？',
      questionText: '小便有没有颜色不对或者带血？',
      answer: '刚才尿了一次有点发红',
      answerVague: '有点红...',
      ramblingAnswer: '我刚才疼得受不了去上了个厕所，尿出来颜色有点偏红像洗肉水一样。我以前结石的时候也是这样所以我很怕是结石又犯了。上次结石疼了一整天才排出来，这次我不想再受那个罪了。',
      panickedAnswer: '红的！！尿出来是红的！！跟以前结石一样！！快给我打止痛针！！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '肾绞痛等待指导',
    intro: '救护车在路上了。在等待期间我来教您怎么缓解。',
    steps: [
      {
        id: 'urinary_position',
        instruction: '找一个最舒服的姿势，侧躺蜷腿可以减轻疼痛。',
        prompt: '第一步：缓解姿势',
        options: [
          '侧躺蜷腿放松',
          '不停走动缓解',
          '用力按压疼痛部位',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！侧躺蜷腿可以减轻腰腹部张力。',
          incorrect: '不对。剧烈活动可能加重症状，应保持静止。',
          callerCorrect: '我侧躺着蜷着腿好像好了一点点',
          callerIncorrect: '我一直在客厅走来走去但是越来越疼了',
        },
      },
      {
        id: 'urinary_drink',
        instruction: '如果可以的话多喝点水，有助于结石排出。',
        prompt: '第二步：多喝水',
        options: [
          '多喝水帮助排石',
          '不要喝水',
          '喝碳酸饮料',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！充分饮水有助于结石排出。',
          incorrect: '不对。多喝水是肾结石最有效的保守治疗方法之一。',
          callerCorrect: '我喝了一大杯水了希望这该死的石头赶紧出来',
          callerIncorrect: '我不敢喝水怕更疼......',
        },
      },
      {
        id: 'urinary_observe',
        instruction: '观察有没有发烧，如果发烧说明可能有感染需要紧急处理。',
        prompt: '第三步：观察发热',
        options: [
          '观察有无发烧',
          '用力蹦跳排石',
          '热敷腰背部',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！结石伴发热是紧急情况。',
          incorrect: '不对。不要剧烈运动可能加重损伤。',
          callerCorrect: '没有发烧，就是一阵一阵疼得厉害',
          callerIncorrect: '我跳了几下好像更疼了...',
        },
      },
      {
        id: 'urinary_mg',
        instruction: '用温热毛巾敷在患者腰腹部疼痛位置保持。',
        prompt: '实操环节：热敷缓解',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '毛巾敷上了！他说热敷着舒服一些！',
          callerIncorrect: '毛巾凉了他又疼起来了……',
        },
        miniGame: {
          kind: 'holdPressure',
          title: '热敷缓解',
          instruction: '用温热毛巾敷在患者腰腹部疼痛位置保持。',
          passThreshold: 0.5,
          holdSec: 6,
          bleedRatePerSec: 8,
          regainPerSec: 12,
          feedback: { good: '毛巾敷上了！他说热敷着舒服一些！', bad: '毛巾凉了他又疼起来了……' },
        },
      },
    ],
  },

  specialEvents: [],

  outcomeNarrative: {
    good: '患者送医后确诊为输尿管下段结石，经止痛和促排石治疗后三天结石自行排出',
    bad: '患者剧烈活动导致结石移动嵌顿加重，出现肾积水需行体外碎石治疗',
    prank: '',
  },
}
