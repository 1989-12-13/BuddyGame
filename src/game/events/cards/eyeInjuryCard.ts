// ============================================================
// MPDS 协议卡片 16 — 眼部问题/损伤
// 分诊级别: 绿色（化学入眼为急症，正确分诊为黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const eyeInjuryCard: EmergencyScenario = {
  id: 'eye_injury',
  title: '化学物入眼',
  callerId: 'luo_wei',
  phoneNumber: '139****7777',
  baseStation: '海淀区上地信息产业基地',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 16,
    title: '眼部问题/损伤',
    chiefComplaint: '实验室工作人员被化学试剂溅入右眼疼痛剧烈无法睁眼',
    determinantCode: '16-C-1',
    hotCold: 'HOT',
    keyQuestions: [
      '什么东西进了眼睛',
      '眼睛还能不能睁开',
      '有没有用清水冲洗',
      '视力有没有受影响',
      '有没有戴隐形眼镜',
    ],
  },

  openingLine: '120吗！我在实验室做实验被试剂溅到眼睛了！右眼疼得睁不开一直流眼泪！我用洗眼器冲了一下但还是很疼！',

  fourElements: {
    address: {
      vague: '海淀区上地信息产业基地',
      partial: '上地信息路甲28号科实大厦',
      full: '科实大厦B座5层化学实验室，上地地铁站A口出向北300米',
    },
    contact: '139****7777',
    condition: {
      chiefComplaint: '配置溶液的时候一滴液体溅到右眼里了',
      age: '27岁',
      gender: '男性',
      consciousness: '清醒但疼得不行',
      breathing: '正常',
      patientCount: '1人',
      additional: [
        '是盐酸溶液大概1M浓度',
        '已经用洗眼器冲洗了约5分钟',
        '右眼通红一直流眼泪',
        '视力暂时没感觉下降但是看不清因为一直在流泪',
        '没有戴隐形眼镜',
      ],
    },
    purpose: '会不会瞎有没有什么药',
  },

  mpdsQuestions: [
    {
      id: 'mpds_eye_chemical',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '化学品',
      questionText: '是什么化学品入眼了？',
      answer: '盐酸！大概1M浓度的！',
      answerVague: '盐酸...浓度不高...',
      ramblingAnswer: '我们做酸碱滴定的时候我不小心把滴定管里的盐酸甩出来了，一滴溅到右眼里。浓度大概1摩尔不算很浓但是进眼睛还是很疼。我现在一直用洗眼器冲着呢。',
      panickedAnswer: '盐酸！1M的！怎么办啊会不会瞎！',
      reveals: ['additional'],
      judgment: {
        question: '盐酸入眼属于什么损伤？',
        options: [
          { label: '盐酸化学性眼损伤 持续冲洗至少15分钟', fills: [{ field: 'conditionNote', value: '盐酸化学性眼损伤，需持续冲洗' }], isCorrect: true },
          { label: '普通异物入眼 不需要持续冲洗', fills: [{ field: 'conditionNote', value: '误判为普通异物' }], isCorrect: false },
          { label: '酸碱中和即可 不需要冲洗', fills: [{ field: 'conditionNote', value: '错误处理方式' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_eye_flush',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '持续冲洗',
      questionText: '冲洗多久了？有没有停？',
      answer: '冲了大概五分钟了还在冲',
      answerVague: '五分钟...没停...',
      ramblingAnswer: '冲了快五分钟了，一直在冲没停过。但是还是很疼啊，冲完之后感觉好一点点但还是一直疼。',
      panickedAnswer: '冲了！冲了五分钟了！但是还是很疼啊！是不是没用啊？！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '化学性眼损伤冲洗',
    intro: '继续冲洗不要停。化学入眼至少需要冲洗15到20分钟。',
    steps: [
      {
        id: 'eye_flush',
        instruction: '用大量流动清水冲洗至少15分钟不要停',
        prompt: '第一步：持续冲洗',
        options: [
          '继续冲洗至少15分钟',
          '冲洗5分钟就够了',
          '滴眼药水',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！化学入眼必须持续冲洗至少15分钟。',
          incorrect: '不对。化学入眼至少需要冲洗15到20分钟，冲洗不充分会造成持续损伤。',
          callerCorrect: '好的我继续冲！让同事帮我拿了个大瓶矿泉水一直在冲！',
          callerIncorrect: '我停了...冲了五分钟手都酸了...现在眼睛又开始疼了！怎么办！',
        },
      },
      {
        id: 'eye_technique',
        instruction: '翻开眼皮让水流到眼球各个角落',
        prompt: '第二步：冲洗技巧',
        options: [
          '翻开上下眼皮充分冲洗',
          '闭着眼冲',
          '用手揉眼睛',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！翻开眼皮才能冲洗到整个眼球表面。',
          incorrect: '不对。闭眼冲洗效果不佳，揉眼睛会造成二次损伤。应翻开眼皮充分冲洗。',
          callerCorrect: '我翻着眼皮冲了！感觉水流到眼球各个地方了！好多了！',
          callerIncorrect: '我闭着眼冲的...还是疼啊！是不是冲的方法不对？',
        },
      },
      {
        id: 'eye_hospital',
        instruction: '冲洗后仍然疼痛需要去医院检查',
        prompt: '第三步：就医',
        options: [
          '冲洗后去医院眼科',
          '不疼了就不用去了',
          '涂红霉素眼膏',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！化学入眼必须去医院做专业检查。',
          incorrect: '不对。即使症状缓解也必须去医院检查，角膜可能有隐性损伤。',
          callerCorrect: '冲完就去！旁边就有上地医院，我让同事陪我去！',
          callerIncorrect: '不去了...应该没事了吧...（几天后角膜溃疡来投诉了）',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'eye_pain_relief',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'caller_speaks',
      dialogue: '冲了快十分钟了，好像没那么疼了，眼睛能睁开一点了但还是有点模糊',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导持续冲洗15分钟，伤者送医后角膜上皮轻微损伤但无永久损伤，两天后恢复',
    bad: '冲洗不充分导致化学物质持续损伤角膜，送医后诊断为角膜化学性烧伤需要长期用药',
    prank: '',
  },
}
