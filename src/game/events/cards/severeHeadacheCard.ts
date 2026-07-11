// ============================================================
// MPDS 协议卡片 18 — 头痛
// 分诊级别: 绿色（突然剧烈头痛需警惕脑血管问题，正确分诊为黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const severeHeadacheCard: EmergencyScenario = {
  id: 'severe_headache',
  title: '剧烈头痛',
  callerId: 'gao_yan',
  phoneNumber: '156****8888',
  baseStation: '东城区东四附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 18,
    title: '头痛',
    chiefComplaint: '中年女性突发炸裂样头痛、伴有呕吐和畏光',
    determinantCode: '18-C-2',
    hotCold: 'HOT',
    keyQuestions: [
      '头痛从什么时候开始的',
      '是什么样的疼痛之前有没有类似情况',
      '疼痛有多严重1到10分',
      '有没有呕吐视力模糊或脖子僵硬',
      '有没有高血压病史',
    ],
  },

  openingLine: '120吗我头突然疼得不行了像要炸开一样从来没有这么疼过刚才还吐了',

  fourElements: {
    address: {
      vague: '东城区东四附近',
      partial: '东四北大街',
      full: '东四北大街303号2单元501室',
    },
    contact: '156****8888',
    condition: {
      chiefComplaint: '在家看电视突然头痛欲裂像被雷劈了一样',
      age: '45岁',
      gender: '女性',
      consciousness: '清醒但疼得没法正常说话',
      breathing: '正常',
      patientCount: '1人',
      additional: [
        '半小时前突然发作',
        '疼痛是最剧烈的程度10分',
        '吐了一次',
        '有点怕光',
        '有高血压史',
      ],
    },
    purpose: '是不是脑出血了要不要吃药',
  },

  mpdsQuestions: [
    {
      id: 'mpds_headache_nature',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '头痛性质',
      questionText: '是什么样的疼？什么时候开始的？',
      answer: '像炸开一样突然一下子就来了半小时前',
      answerVague: '突然就疼了...半小时前...',
      ramblingAnswer: '大概半小时前我在沙发上坐着看电视突然一下头就跟要炸开一样剧痛。我活这么大从来没这么疼过。然后我就觉得恶心得不行跑去厕所吐了。我老公把灯关了因为我看到光就更疼。',
      panickedAnswer: '炸开一样！！！突然就来了！！像雷劈了一样！！我是不是要死了！！',
      reveals: ['additional'],
      judgment: {
        question: '突然炸裂样头痛伴呕吐提示什么？',
        options: [
          { label: '突发炸裂样头痛 警惕蛛网膜下腔出血', fills: [{ field: 'conditionNote', value: '疑似蛛网膜下腔出血' }], isCorrect: true },
          { label: '普通偏头痛 休息即可', fills: [{ field: 'conditionNote', value: '误判为偏头痛' }], isCorrect: false },
          { label: '颈椎病引起的头痛', fills: [{ field: 'conditionNote', value: '误判为颈椎病' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_headache_symptom',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '伴随症状',
      questionText: '有没有脖子发硬？手脚发麻？',
      answer: '脖子有点硬但是手脚没事',
      answerVague: '脖子硬...手脚没事...',
      ramblingAnswer: '我老公说我脖子有点硬，他让我低头我低不下去，但是手脚都能动也没有发麻的感觉。就是头太疼了，像有人在脑子里打鼓一样。',
      panickedAnswer: '脖子硬！！特别硬！！动不了！！手脚还好但是头要炸了！！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '剧烈头痛等待指导',
    intro: '不要吃任何止痛药保持安静。救护车马上就到。',
    steps: [
      {
        id: 'headache_rest',
        instruction: '躺在安静黑暗的房间休息',
        prompt: '第一步：安静休息',
        options: [
          '安静暗室休息',
          '开灯看电视',
          '出门透气',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！安静暗室休息可以减少刺激。',
          incorrect: '不对。光和噪音会加重头痛，应保持安静避光环境。',
          callerCorrect: '我躺在卧室了窗帘拉上了老公把电视关了，感觉好一点点。',
          callerIncorrect: '我开着灯在看电视...越看越疼...是不是不该这样？',
        },
      },
      {
        id: 'headache_observe',
        instruction: '观察意识变化，如果出现意识模糊立即报告',
        prompt: '第二步：观察意识',
        options: [
          '观察意识',
          '多喝水',
          '吃止痛药',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！密切观察意识状态非常重要。',
          incorrect: '不对。在明确诊断前不应自行用药或大量喝水，应重点观察意识变化。',
          callerCorrect: '我老公在旁边看着我呢，一有不对就告诉您！',
          callerIncorrect: '我吃了片止痛药...是不是不该吃？',
        },
      },
      {
        id: 'headache_dont',
        instruction: '不要吃止痛药，不要热敷',
        prompt: '第三步：不要自行用药',
        options: [
          '不要自行用药',
          '吃阿司匹林',
          '热敷头部',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！在诊断明确前绝对不要自行用药。',
          incorrect: '不对。阿司匹林会加重出血风险，热敷会增加颅内压力。',
          callerCorrect: '好！我什么药都不吃！就等着救护车来！',
          callerIncorrect: '我老公给我吃了阿司匹林...说是止疼的...是不是做错了？',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'headache_worsen',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '她说头越来越疼了而且看东西有点双影了这是怎么回事',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导保持安静并密切观察，患者送医后确诊为蛛网膜下腔出血行介入治疗恢复良好',
    bad: '患者自行服用阿司匹林加剧了出血，送医时已形成颅内血肿需要开颅手术',
    prank: '',
  },
}
