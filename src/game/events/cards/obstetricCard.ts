// ============================================================
// MPDS 协议卡片 24 — 妊娠/分娩/流产
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const obstetricCard: EmergencyScenario = {
  id: 'obstetric',
  title: '产科急症',
  callerId: 'zhao_lei',
  phoneNumber: '137****3456',
  baseStation: '丰台区方庄附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 24,
    title: '妊娠/分娩/流产',
    chiefComplaint: '孕38周破水、规律宫缩3-4分钟，第二胎',
    determinantCode: '24-D-3',
    hotCold: 'HOT',
    keyQuestions: [
      '怀孕多少周了？',
      '羊水破了多久？什么颜色？',
      '宫缩间隔和持续时间？',
      '有无阴道大量出血？',
      '能看到婴儿头部或脐带吗？',
    ],
  },

  openingLine: '救命啊！！！我老婆要生了！预产期还有两周但是刚才突然破水了！她疼得不行了！你们快来啊！！！',

  fourElements: {
    address: {
      vague: '丰台区方庄附近',
      partial: '方庄芳城园一区',
      full: '芳城园一区5号楼1单元802室，楼下有个链家地产',
    },
    contact: '137****3456',
    condition: {
      chiefComplaint: '我老婆怀孕38周，刚才突然破水了，宫缩越来越频繁',
      age: '32岁',
      gender: '女性',
      consciousness: '人是清醒的，但疼得话都说不全了',
      breathing: '呼吸很急促，一直在喘',
      patientCount: '1个人（肚子里还有个孩子）',
      additional: [
        '预产期还有2周',
        '羊水已破，大约5分钟前',
        '宫缩间隔约3-4分钟',
        '这是第二胎',
      ],
    },
    purpose: '马上派救护车！可能需要接生！',
  },

  mpdsQuestions: [
    {
      id: 'mpds_ob_water',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '羊水什么颜色？',
      questionText: '羊水是什么颜色的？清的还是有颜色？',
      answer: '清的！就是透明的！',
      answerVague: '水...是水...透明的...',
      ramblingAnswer: '清的！透明的！我刚看了一眼，地板上湿了一片，没有颜色也没味道...跟水一样。这个正常吗？我记得以前第一胎那时候破水好像也是清的。应该不是带血的吧，没有红色也没有黄绿色，就是透明的。',
      panickedAnswer: '水！！！就是水！！！透明的！！没有什么颜色！！也没有血！！',
      reveals: ['additional'],
      judgment: {
        question: '羊水「透明无色」提示什么？',
        options: [
          { label: '正常羊水，无胎儿窘迫迹象', fills: [{ field: 'conditionNote', value: '羊水清亮，无胎粪污染' }], isCorrect: true },
          { label: '可能有胎粪污染（黄色/绿色）', fills: [{ field: 'conditionNote', value: '羊水可能胎粪污染' }], isCorrect: false },
          { label: '血性羊水，可能有胎盘早剥', fills: [{ field: 'conditionNote', value: '血性羊水，警惕胎盘早剥' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_ob_contraction',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '宫缩间隔多久？',
      questionText: '宫缩大概隔多久一次？每次持续多长时间？',
      answer: '大概三四分钟一次……每次疼几十秒吧！',
      answerVague: '几分钟...她一直疼...',
      ramblingAnswer: '三四分钟...可能三分钟也可能四分钟，我一直在看手机计时...一开始间隔还挺长的可能有十分钟，现在越来越密了！刚才那波疼了有四五十秒吧，她疼得抓住我的手臂指甲都掐进去了...这正常吗？是不是快生了？',
      panickedAnswer: '越来越快了！！一开始十分钟一次现在感觉两三分钟就疼一次了！！她疼得嗷嗷叫！！我受不了了！！',
      reveals: ['additional'],
      judgment: {
        question: '宫缩从10分钟缩短到3-4分钟——这提示什么阶段？',
        options: [
          { label: '活跃期产程，即将分娩', fills: [{ field: 'conditionNote', value: '活跃期产程，宫缩3-4分钟一次' }], isCorrect: true },
          { label: '假性宫缩，可能不会马上生', fills: [{ field: 'conditionNote', value: '可能是假性宫缩' }], isCorrect: false },
          { label: '异常宫缩，可能有危险', fills: [{ field: 'conditionNote', value: '宫缩异常，警惕' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_ob_bleeding',
      category: 'bleeding',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '有出血吗？',
      questionText: '有没有大量出血？',
      answer: '没……没有！就是羊水！',
      answerVague: '没...好像没有...',
      ramblingAnswer: '没有没有，我仔细看了，就是羊水，没有血。地板上就是透明的水渍。我特别看了一下她垫的毛巾，也没有红色。应该就是普通的破水...至少目前没有出血。',
      panickedAnswer: '没有血！！就是水！！但是水好多啊！！一直在流！！会不会流光了啊？！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '院前分娩指导',
    intro: '救护车正在赶来。请您保持冷静，我来指导您。首先让您妻子平躺，用枕头垫高头部。',
    steps: [
      {
        id: 'ob_position',
        instruction: '让产妇平躺，双腿弯曲分开。准备好干净的毛巾或床单。',
        prompt: '第一步：准备体位',
        options: [
          '让产妇平躺，双腿弯曲分开',
          '让产妇站起来走动',
          '让产妇坐着用力',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！平躺是安全的分娩体位。',
          incorrect: '不对。破水后应平躺，站立或坐着会增加脐带脱垂风险。',
          callerCorrect: '她躺好了！腿也弯着了！她一直在喊疼……宫缩又来了！接下来怎么做？！',
          callerIncorrect: '她站着呢……我让她走了一下，她疼得站不住啊！破水是不是越来越多了？怎么办？！',
        },
      },
      {
        id: 'ob_push',
        instruction: '当宫缩来临时，指导产妇深呼吸并向下用力。在宫缩间歇让她休息。',
        prompt: '第二步：指导用力',
        options: [
          '宫缩时向下用力，间歇时休息',
          '一直持续用力',
          '不要用力，等医生来',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！配合宫缩节奏用力最有效。',
          incorrect: '不对。持续用力会导致产妇过度疲劳，应配合宫缩节奏。',
          callerCorrect: '她跟着宫缩的节奏在用力！一疼我就让她使劲……不疼的时候她就喘口气！我看到孩子头了！！头出来了！！',
          callerIncorrect: '我让她一直使劲……她现在没力气了……她说不行了使不上劲了……怎么办啊孩子还没出来！',
        },
      },
      {
        id: 'ob_baby',
        instruction: '如果婴儿头部出现，请用手轻轻托住，千万不要用力拉。让婴儿自然娩出。',
        prompt: '第三步：接住婴儿',
        options: [
          '轻轻托住婴儿头部，不要拉拽',
          '用力把婴儿拉出来',
          '不要碰婴儿',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！轻轻托住保护婴儿，自然娩出。',
          incorrect: '不对。用力拉拽可能造成婴儿臂丛神经损伤，但也不能不接。应轻轻托住。',
          callerCorrect: '我托住头了！好小……他在动！他动了！眼睛睁开了！孩子出来了！呜……呜呜……出来了！！',
          callerIncorrect: '我……我没敢碰……她就那么掉在地上了……哇哇大哭！孩子哭了！但是他掉地上了！！我是不是闯祸了？！',
        },
      },
      {
        id: 'ob_mg',
        instruction: '帮助产妇左侧卧位，减轻子宫对下腔静脉的压迫。',
        prompt: '实操环节：左侧卧位保持',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我让她左侧躺好了！她说舒服一点了！',
          callerIncorrect: '她一动又平躺回去了……',
        },
        miniGame: {
          kind: 'holdPressure',
          title: '左侧卧位保持',
          instruction: '帮助产妇左侧卧位，减轻子宫对下腔静脉的压迫。',
          passThreshold: 0.5,
          holdSec: 8,
          bleedRatePerSec: 8,
          regainPerSec: 14,
          feedback: { good: '我让她左侧躺好了！她说舒服一点了！', bad: '她一动又平躺回去了……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'ob_push_urge',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'caller_panic',
      dialogue: '她说有想大便的感觉！是不是要生了？！我该怎么办啊啊啊！！！',
    },
  ],

  outcomeNarrative: {
    good: '接线员冷静指导院前分娩，产妇在救护车到达前顺利分娩。母婴平安，新生儿评分良好。',
    bad: '家属慌乱中未按指导操作，产妇在家中无人监护的情况下分娩，新生儿有轻度窒息……',
    prank: '',
  },
}
