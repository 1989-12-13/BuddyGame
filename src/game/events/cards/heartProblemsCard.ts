// ============================================================
// MPDS 协议卡片 19 — 心脏问题/起搏器
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const heartProblemsCard: EmergencyScenario = {
  id: 'heart_problems',
  title: '心律失常',
  callerId: 'zhong_qi',
  phoneNumber: '158****6666',
  baseStation: '朝阳区望京soho附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 19,
    title: '心脏问题/起搏器',
    chiefComplaint: '中年女性突发心悸心慌心跳极快伴胸闷头晕约半小时',
    determinantCode: '19-C-2',
    hotCold: 'HOT',
    keyQuestions: [
      '心跳大概多快有没有规律',
      '什么时候开始的',
      '有没有胸闷胸痛或头晕',
      '有没有心脏病史或起搏器',
      '有没有晕倒过',
    ],
  },

  openingLine: '120吗我同事突然心跳特别快心慌得不行说胸口发闷头晕站不住',

  fourElements: {
    address: {
      vague: '朝阳区望京soho附近',
      partial: '望京soho塔1 15层办公区',
      full: '望京soho塔1 15层1508室望京东地铁站B口出来进大厅上电梯',
    },
    contact: '136****8888',
    condition: {
      chiefComplaint: '同事上班时突然说心跳加速心慌前胸发闷头晕眼花',
      age: '52岁',
      gender: '女性',
      consciousness: '清醒但很害怕脸色发白',
      breathing: '呼吸急促',
      patientCount: '1人',
      additional: [
        '大概十分钟前突然开始',
        '自测脉搏特别快估摸有一百五六十下',
        '之前有过类似情况但是没这么严重',
        '有冠心病史',
      ],
    },
    purpose: '她是不是心脏病发了要不要吃药',
  },

  mpdsQuestions: [
    {
      id: 'mpds_heart_onset',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '症状开始',
      questionText: '什么时候开始的？之前有没有诱因？',
      answer: '十分钟前开会发言的时候突然就开始了',
      answerVague: '刚才...开会的时候突然...',
      ramblingAnswer: '刚才开会她在发言说着说着突然就停了捂着胸口说心慌心跳得好快然后赶紧坐下来了。她说感觉心脏要跳出来了一样。以前偶尔也有过心跳快但是休息一下就过去了这次一直不好。',
      panickedAnswer: '就刚刚！开会说着话突然就不行了！心跳快得不行了！',
      reveals: ['additional'],
      judgment: {
        question: '根据描述判断最可能是什么情况？',
        options: [
          { label: '突发快速心律失常 需心电图确诊', fills: [{ field: 'conditionNote', value: '突发快速心律失常，可能为阵发性室上速或房颤' }], isCorrect: true },
          { label: '普通紧张导致的心跳加快', fills: [{ field: 'conditionNote', value: '可能是紧张引起的心跳加快' }], isCorrect: false },
          { label: '低血糖发作', fills: [{ field: 'conditionNote', value: '可能是低血糖' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_heart_history',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -3,
      label: '既往史',
      questionText: '有没有心脏病史？吃过什么药？',
      answer: '有冠心病平时吃阿司匹林和他汀',
      answerVague: '有...冠心病...在吃药...',
      ramblingAnswer: '她跟我说过她有冠心病一直在吃阿司匹林和他汀。她说以前医生说过她心律不齐但是没当回事。身上没有带什么急救药。',
      panickedAnswer: '冠心病！有冠心病！在吃阿司匹林！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '心悸等待指导',
    intro: '让患者保持安静不要走动。救护车马上就到。',
    steps: [
      {
        id: 'heart_position',
        instruction: '让患者半坐卧位，不要走动。',
        prompt: '第一步：体位',
        options: [
          '半坐卧位安静休息',
          '平躺脚抬高',
          '站起来走走',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。半坐卧位有助于减轻心脏负担。',
          incorrect: '不对。患者应保持半坐卧位安静休息，减少心脏耗氧。',
          callerCorrect: '她坐好了靠在椅子上，看起来比刚才好一些了。',
          callerIncorrect: '她站起来走了几步说更难受了心跳得更快了！',
        },
      },
      {
        id: 'heart_calm',
        instruction: '安抚患者，让她慢慢深呼吸。',
        prompt: '第二步：安抚',
        options: [
          '安抚情绪引导深呼吸',
          '让她憋气用力',
          '大声说话保持清醒',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。安抚和深呼吸有助于缓解焦虑和心悸。',
          incorrect: '不对。应安抚情绪并引导深呼吸，不可让患者憋气。',
          callerCorrect: '我跟她说慢慢呼吸，她跟着我做深呼吸看起来放松一些了。',
          callerIncorrect: '我让她憋气她说憋不住更难受了。',
        },
      },
      {
        id: 'heart_observe',
        instruction: '如果晕倒立即开始CPR并报告。',
        prompt: '第三步：观察',
        options: [
          '观察意识',
          '让她自己待着',
          '给她喝咖啡提神',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。密切观察意识状态，晕倒立即CPR。',
          incorrect: '不对。不能放任不管也不能给咖啡刺激心脏。应持续观察。',
          callerCorrect: '好的我一直看着她，她闭着眼休息但还清醒。',
          callerIncorrect: '她刚才好像迷糊了一下不过又醒了，我差点没注意到。',
        },
      },
      {
        id: 'heart_mg',
        instruction: '如患者意识丧失，立即开始胸外按压，保持节奏。',
        prompt: '实操环节：胸外按压节奏',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我按了！跟着节奏在按！',
          callerIncorrect: '我按得没节奏，手也酸了……',
        },
        miniGame: {
          kind: 'rhythmPress',
          title: '胸外按压节奏',
          instruction: '如患者意识丧失，立即开始胸外按压，保持节奏。',
          passThreshold: 0.5,
          targetBpm: 100,
          bpmTolerance: 12,
          durationSec: 12,
          feedback: { good: '我按了！跟着节奏在按！', bad: '我按得没节奏，手也酸了……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'heart_improve',
      trigger: 'after_question',
      triggerValue: '',
      type: 'caller_speaks',
      dialogue: '她坐着休息了一会儿感觉好一些了心跳没那么快了但还是有点心慌',
    },
  ],

  outcomeNarrative: {
    good: '患者送医后心电图显示阵发性室上速经药物治疗后恢复窦性心律住院观察两天后出院',
    bad: '患者坚持站起来走动导致症状加重晕倒后头部撞到桌角造成额外创伤',
    prank: '',
  },
}
