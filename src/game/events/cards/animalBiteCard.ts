// ============================================================
// MPDS 协议卡片 3 — 动物咬伤/攻击
// 分诊级别: 绿色（轻伤）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const animalBiteCard: EmergencyScenario = {
  id: 'animal_bite',
  title: '狗咬伤',
  callerId: 'song_na',
  phoneNumber: '159****2222',
  baseStation: '朝阳区潘家园附近',
  isPrank: false,
  correctTriage: 'green',

  mpdsCard: {
    number: 3,
    title: '动物咬伤/攻击',
    chiefComplaint: '儿童被流浪狗咬伤小腿，出血不止但非大量',
    determinantCode: '3-C-3',
    hotCold: 'COLD',
    keyQuestions: [
      '什么动物咬伤的',
      '咬伤部位在哪里',
      '伤口有多大是否在出血',
      '动物是家养还是流浪',
      '伤者有无神经症状或恐水',
    ],
  },

  openingLine: '120吗！我孩子在小区被一条流浪狗咬了！小腿上两个牙印一直在流血！但狗已经跑了！',

  fourElements: {
    address: {
      vague: '朝阳区潘家园附近',
      partial: '潘家园旧货市场南门对面小区',
      full: '潘家园南里小区7号楼前小花园，潘家园地铁站C口出来向南走300米',
    },
    contact: '159****2222',
    condition: {
      chiefComplaint: '孩子在小区花园玩被一条黄色流浪狗咬了左小腿',
      age: '7岁',
      gender: '男性',
      consciousness: '清醒，在哭',
      breathing: '哭得喘不过气',
      patientCount: '1人',
      additional: [
        '左小腿后面有两个牙印',
        '伤口在渗血但不是喷出来的',
        '狗是流浪狗已经跑掉了',
        '不知道狗有没有打疫苗',
      ],
    },
    purpose: '要不要打狂犬疫苗现在怎么处理伤口',
  },

  mpdsQuestions: [
    {
      id: 'mpds_bite_wound',
      category: 'bleeding',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '伤口情况',
      questionText: '伤口深不深血流得多不多',
      answer: '两个牙印破皮了在渗血但不算太多',
      answerVague: '破了...在流血...',
      ramblingAnswer: '裤子上破了两小洞，挽起来看小腿后面有两个牙印有点深好像咬进去了，周围一圈已经开始肿了发红。血在往外渗但是没有一直流，我用纸巾按了一下纸巾上有血但不算太多。',
      panickedAnswer: '破了！流血了！两个牙印！狗跑了！要不要打针！',
      reveals: ['additional'],
    },
    {
      id: 'mpds_bite_animal',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '动物情况',
      questionText: '狗是家养的还是流浪狗',
      answer: '流浪狗，脖子上没有牌，我们小区经常看到它',
      answerVague: '流浪狗...没有主人...',
      ramblingAnswer: '流浪狗，脖子上没有牌子的，毛脏兮兮的。我们小区经常看到它在垃圾桶那边翻吃的，保安赶过几次但也没抓住。今天孩子在花园玩球，那狗突然窜出来咬了他一口就跑掉了。',
      panickedAnswer: '流浪狗！脏兮兮的！咬完就跑掉了！孩子会不会得狂犬病啊！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '动物咬伤紧急处理',
    intro: '伤口需要处理但要先止血。请不要自己用嘴巴吸伤口。',
    steps: [
      {
        id: 'bite_wash',
        instruction: '用流动清水和肥皂冲洗伤口至少15分钟',
        prompt: '第一步：冲洗伤口',
        options: [
          '肥皂水冲洗15分钟',
          '用酒精直接消毒',
          '用嘴巴吸出毒血',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！肥皂水冲洗可以有效减少狂犬病毒量。',
          incorrect: '不对。酒精直接刺激伤口会引起剧痛，吸吮伤口可能造成二次感染。',
          callerCorrect: '好我在洗！孩子哭得很厉害但是我在冲，肥皂水，我计时了！',
          callerIncorrect: '我倒了酒精上去...孩子哭得撕心裂肺的...我是不是做错了？',
        },
      },
      {
        id: 'bite_stop_bleeding',
        instruction: '冲洗后用干净纱布按压止血',
        prompt: '第二步：按压止血',
        options: [
          '纱布按压止血',
          '涂抹红药水',
          '包上创可贴',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！干净纱布按压止血是最安全的方法。',
          incorrect: '不对。红药水和创可贴不适用于动物咬伤伤口。',
          callerCorrect: '按住了！血基本止住了，纱布上有一点点血印。',
          callerIncorrect: '我涂了红药水，现在伤口一片红也看不清楚还在不在流血。',
        },
      },
      {
        id: 'bite_hospital',
        instruction: '处理后尽快去医院打狂犬疫苗',
        prompt: '第三步：就医接种疫苗',
        options: [
          '去医院打狂犬疫苗和破伤风',
          '在家观察两天再去',
          '涂碘伏就可以了',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！流浪狗咬伤必须尽快接种狂犬疫苗和破伤风疫苗。',
          incorrect: '不对。流浪狗咬伤不能观察等待，必须尽快就医接种疫苗。',
          callerCorrect: '好的我知道了，冲洗完了我马上带孩子去最近的医院！',
          callerIncorrect: '我想先观察两天看看...万一不打针应该也没事吧？',
        },
      },
    ],
  },

  specialEvents: [],

  outcomeNarrative: {
    good: '调度员指导肥皂水冲洗和止血，患者送医后接种狂犬疫苗和破伤风疫苗，伤口一周后愈合',
    bad: '家属用酒精直接冲洗导致孩子剧痛哭闹伤口被刺激更难处理，错过了最佳冲洗时间',
    prank: '',
  },
}
