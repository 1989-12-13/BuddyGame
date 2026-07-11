// ============================================================
// MPDS 协议卡片 31 — 晕厥/无意识
// 分诊级别: 黄色
// ============================================================

import type { EmergencyScenario } from '../../types'

export const unconsciousFaintingCard: EmergencyScenario = {
  id: 'unconscious_fainting',
  title: '晕厥',
  callerId: 'han_lei',
  phoneNumber: '188****0000',
  baseStation: '西城区西单附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 31,
    title: '晕厥/无意识',
    chiefComplaint: '年轻女性在公交车上突然晕倒数秒后恢复意识',
    determinantCode: '31-C-2',
    hotCold: 'HOT',
    keyQuestions: [
      '晕倒多长时间了',
      '晕倒时有没有抽搐',
      '现在有没有恢复意识',
      '有没有撞到头部',
      '之前有没有不舒服',
    ],
  },

  openingLine: '120吗公交车上有个女孩突然晕倒了现在刚醒过来但是脸色很差说头晕',

  fourElements: {
    address: {
      vague: '西城区西单附近',
      partial: '西单路口北公交站',
      full: '西单路口北公交站往南50米正在行驶的22路公交车上',
    },
    contact: '188****0000',
    condition: {
      chiefComplaint: '女孩在公交车上站着突然就软倒下去了',
      age: '23岁',
      gender: '女性',
      consciousness: '刚才晕了大概十几秒现在醒过来了但迷迷糊糊的',
      breathing: '呼吸较浅',
      patientCount: '1人',
      additional: [
        '从早上到现在没吃早饭',
        '车厢内非常拥挤闷热',
        '晕倒时没有抽搐口吐白沫',
        '没有撞到头因为旁边有人扶住了',
        '以前也晕倒过一次',
      ],
    },
    purpose: '她醒了但是还是很晕要不要给她吃什么',
  },

  mpdsQuestions: [
    {
      id: 'mpds_faint_seizure',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '晕倒情况',
      questionText: '晕倒时有没有抽搐？有没有咬舌头？',
      answer: '没有就是突然软下去了像睡着了一样',
      answerVague: '没有...就是倒了...',
      ramblingAnswer: '她就那样站着然后眼睛一翻腿一软就往地上倒了。幸好旁边有个大姐一把扶住了她没有摔到地上。没有抽搐也没有翻白眼就是单纯晕过去了。大概过了十几秒她自己就睁开眼睛了但是看起来很迷茫不知道发生了什么事。',
      panickedAnswer: '没有！！就是突然倒了！！眼睛翻了一下！！但是没抽！！',
      reveals: ['consciousness', 'additional'],
      judgment: {
        question: '短暂意识丧失无抽搐=单纯性晕厥',
        options: [
          { label: '血管迷走性晕厥可能性大 低血糖或闷热诱因', fills: [{ field: 'conditionNote', value: '血管迷走性晕厥可能性大' }], isCorrect: true },
          { label: '癫痫发作可能', fills: [{ field: 'conditionNote', value: '警惕癫痫可能' }], isCorrect: false },
          { label: '心源性晕厥可能', fills: [{ field: 'conditionNote', value: '警惕心源性晕厥' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_faint_symptom',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '伴随症状',
      questionText: '晕倒前有没有心慌胸闷眼前发黑？',
      answer: '她说刚才觉得胸闷眼前发黑然后就不知道了',
      answerVague: '胸闷...眼前黑...',
      ramblingAnswer: '她现在稍微好点了能说话了。她说刚才就觉得胸闷喘不上气眼前一阵一阵发黑耳朵里嗡嗡响然后就什么都不知道了。以前大一军训的时候也晕过一次。她早上没吃早饭。',
      panickedAnswer: '胸闷！她说喘不上气！然后就黑了！什么都不记得了！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '晕厥急救指导',
    intro: '让她平躺抬高双脚帮助血液回流大脑。救护车马上就到。',
    steps: [
      {
        id: 'faint_position',
        instruction: '让她平躺，双脚抬高30厘米',
        prompt: '第一步：体位',
        options: [
          '平躺抬高双脚',
          '扶她坐着',
          '让她站起来走走',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！平躺抬高双脚有助于血液回流大脑。',
          incorrect: '不对。晕厥时应平躺抬脚，坐着或站立会加重脑供血不足。',
          callerCorrect: '她躺下了！我把她的腿架在旁边的座位上了！她说好像好一点了！',
          callerIncorrect: '我扶她坐起来了……她好像又晕了！头又低下去了！怎么办？！',
        },
      },
      {
        id: 'faint_air',
        instruction: '解开衣领，保持空气流通',
        prompt: '第二步：通风',
        options: [
          '解开衣领保持通风',
          '给她盖上厚衣服',
          '围住她保暖',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！保持空气流通很重要。',
          incorrect: '不对。晕厥时需要新鲜空气，不需要过度保暖。',
          callerCorrect: '我把她衣领松开了！车窗也打开了！她深呼吸了几下说好多了！',
          callerIncorrect: '我给她盖上衣服了……但是她说更闷了……是不是不对啊？！',
        },
      },
      {
        id: 'faint_observe',
        instruction: '如果再次晕倒或出现抽搐立即报告',
        prompt: '第三步：观察',
        options: [
          '观察意识呼吸',
          '喂她吃东西',
          '掐人中',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！密切观察患者状态。',
          incorrect: '不对。意识未完全恢复前不要喂食，掐人中也没有科学依据。',
          callerCorrect: '好的！我看着她！她眼睛睁开了！在问发生什么事了！',
          callerIncorrect: '我掐了她人中……她喊疼……但是好像精神了点了……这样对吗？',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'faint_relapse',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '她又晕了！没有抽搐！但是怎么叫都不醒了！比刚才严重！',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导平躺抬脚，患者意识逐渐恢复。送医检查后为血管迷走性晕厥，补充液体后出院。',
    bad: '患者被扶起坐着导致脑供血不足再次晕厥且摔倒在地造成头部外伤。',
    prank: '',
  },
}
