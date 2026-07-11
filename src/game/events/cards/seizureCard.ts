// ============================================================
// MPDS 协议卡片 12 — 抽搐/癫痫
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const seizureCard: EmergencyScenario = {
  id: 'seizure',
  title: '癫痫发作',
  callerId: 'liu_fang',
  phoneNumber: '159****6666',
  baseStation: '西城区新街口附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 12,
    title: '抽搐/癫痫',
    chiefComplaint: '儿童突发全身抽搐、牙关紧闭、口吐白沫约3分钟',
    determinantCode: '12-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '抽搐从什么时候开始的？',
      '患者是否有意识？',
      '是否有发热？',
      '是否有癫痫病史？',
      '抽搐时有无受伤？',
    ],
  },

  openingLine: '救命！我孩子突然浑身抽搐，眼睛翻上去叫都叫不醒！嘴里往外冒白沫！你们快来啊！！！',

  fourElements: {
    address: {
      vague: '西城区新街口附近',
      partial: '新街口东街小学旁边的家属院',
      full: '新街口东街15号院3号楼4单元602室，楼下有一个晨光文具店',
    },
    contact: '159****6666',
    condition: {
      chiefComplaint: '我孩子下午突然发烧，刚才一下子浑身抽搐口吐白沫，怎么叫都没反应',
      age: '3岁',
      gender: '男性',
      consciousness: '完全没有意识，眼睛翻白',
      breathing: '感觉好像不喘气了......嘴闭得很紧',
      patientCount: '1人',
      additional: [
        '今天下午开始发烧，38度5',
        '从出生到现在第一次抽风',
        '刚才在沙发上玩突然就抽起来了',
        '抽搐大概持续了两三分钟了',
      ],
    },
    purpose: '孩子还在抽！你们快来救救他！怎么办！他会不会咬到舌头！',
  },

  mpdsQuestions: [
    {
      id: 'mpds_seizure_duration',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '抽搐时间',
      questionText: '抽了多长时间了？',
      answer: '大概两三分钟了，一直没停',
      answerVague: '好一会儿了...',
      ramblingAnswer: '我看了下手机，从他开始抽到现在大概有两三分钟了。一开始我以为他在跟我闹着玩，后来发现不对，眼睛翻上去了，嘴里全是沫子，我才慌了打120的。现在还在抽，完全没停下来的意思。',
      panickedAnswer: '两三分钟了！还在抽！一直没停！他会不会这样抽死了啊！',
      reveals: ['additional'],
      judgment: {
        question: '持续抽搐超过2分钟意味着什么？',
        options: [
          { label: '持续抽搐超过2分钟 需紧急处理', fills: [{ field: 'conditionNote', value: '持续抽搐超过2分钟' }], isCorrect: true },
          { label: '刚抽几下 观察即可', fills: [{ field: 'conditionNote', value: '抽搐时间短' }], isCorrect: false },
          { label: '已经停止没事了', fills: [{ field: 'conditionNote', value: '抽搐已停止' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_seizure_fever',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '有无发热',
      questionText: '有没有发烧？',
      answer: '有，今天下午开始发烧，38度5',
      answerVague: '发烧了...下午就发烧...',
      panickedAnswer: '发烧！下午就开始烧了！是不是烧抽了？！热性惊厥是不是？！我在网上看到过！',
      judgment: {
        question: '发热+抽搐提示什么？',
        options: [
          { label: '热性惊厥 儿童常见', fills: [{ field: 'conditionNote', value: '发热+抽搐，热性惊厥可能性大' }], isCorrect: true },
          { label: '癫痫发作', fills: [{ field: 'conditionNote', value: '癫痫发作' }], isCorrect: false },
          { label: '脑膜炎', fills: [{ field: 'conditionNote', value: '警惕脑膜炎' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_seizure_injury',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '受伤',
      questionText: '抽搐时有没有摔倒或撞到？',
      answer: '没有，他在沙发上发作的，没掉下来',
    },
  ],

  guidance: {
    title: '抽搐发作急救指导',
    intro: '救护车已经在路上了。请您保持冷静，我来一步步指导您。',
    steps: [
      {
        id: 'sz_remove_danger',
        instruction: '把孩子周围尖锐的东西拿开，不要按住他',
        prompt: '第一步：移除危险',
        options: [
          '清空周围危险物品不要按压',
          '用力按住手脚',
          '往嘴里塞毛巾',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，抽搐时不要强行按压会受伤',
          incorrect: '不对，不要往嘴里塞任何东西也不要强行按压',
          callerCorrect: '我把茶几推开了，他碰不到东西了',
          callerIncorrect: '我按着他手脚了......他力气好大我快按不住了',
        },
      },
      {
        id: 'sz_side_lie',
        instruction: '让患者侧躺，头偏向一侧',
        prompt: '第二步：侧卧体位',
        options: [
          '让患者侧躺头偏向一侧',
          '让患者平躺',
          '让患者坐着',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，侧卧可以防止分泌物堵塞气道',
          incorrect: '不对，平躺可能导致分泌物堵塞气道',
          callerCorrect: '我把他侧过来了，嘴里的沫子流出来了',
          callerIncorrect: '他抽得太厉害了，我搬不动他',
        },
      },
      {
        id: 'sz_timing',
        instruction: '继续观察，如果持续抽搐超过5分钟要告诉我',
        prompt: '第三步：计时观察',
        options: [
          '计时观察抽搐持续时间',
          '不用管等他自己停',
          '用水泼醒他',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，及时记录持续时间很重要',
          incorrect: '不对，需要密切观察抽搐持续情况',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'sz_stop',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他...他不抽了！不动了！但是还是叫不醒！还在喘气！这是好了吗？',
    },
  ],

  outcomeNarrative: {
    good: '调度员正确指导家属在抽搐中保护儿童，抽搐5分钟后自行停止。患儿送医诊断为热性惊厥，住院观察2天后康复',
    bad: '家属往孩子嘴里塞手指导致咬伤，且按压过紧导致孩子手臂软组织挫伤，送医后确认是热性惊厥',
    prank: '',
  },
}
