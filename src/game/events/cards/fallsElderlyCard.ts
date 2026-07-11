// ============================================================
// MPDS 协议卡片 17 — 坠落/跌倒
// 分诊级别: 绿色（轻伤）/ 但有骨折和头部受伤可能
// ============================================================

import type { EmergencyScenario } from '../../types'

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

  guidance: {
    title: '疑似骨折急救指导',
    intro: '不要移动老人，让她保持现在的姿势。在救护车到达前这样做。',
    steps: [
      {
        id: 'falls_dont_move',
        instruction: '千万不要搬动或扶起老人，保持原位不要动',
        prompt: '第一步：不要移动',
        options: [
          '保持原位不要动',
          '扶到床上躺着',
          '扶到椅子上坐着',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！移动骨折部位可能导致错位加重或损伤神经血管。',
          incorrect: '不对。对于疑似髋部骨折的患者，任何移动都可能造成二次伤害，应保持原位等待救护车。',
          callerCorrect: '好的好的，我不动她！她还在躺着喊疼，但至少我们没有乱动！',
          callerIncorrect: '我已经把她抱起来了...她一叫疼我就放下了...她好像更疼了...我是不是做错了？！',
        },
      },
      {
        id: 'falls_warmth',
        instruction: '给老人盖上毯子或衣服保暖',
        prompt: '第二步：保暖',
        options: [
          '盖毯子保暖',
          '用热毛巾热敷患处',
          '用冰袋冷敷',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！伤者需要保持体温，但不要热敷或冷敷患处以免加重损伤。',
          incorrect: '不对。不要热敷或冷敷骨折部位，以免加重肿胀或影响血运。轻轻盖上毯子保暖即可。',
          callerCorrect: '我给她盖上被子了，她说不那么冷了。她还是在喊疼但是比刚才好一点了。',
          callerIncorrect: '我用热毛巾敷了她大腿根...她说更疼了...我赶紧拿掉了！',
        },
      },
      {
        id: 'falls_calm',
        instruction: '安抚老人不要让她乱动',
        prompt: '第三步：安抚',
        options: [
          '安抚老人保持不动',
          '让她试着站起来',
          '给她按摩',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！保持不动是最安全的做法。',
          incorrect: '不对。让老人站立或按摩患处都可能加重伤情。',
          callerCorrect: '我跟她说了别动，救护车马上就到。她虽然疼但是很听话没有再动了。',
          callerIncorrect: '她一直在动想翻身...我按不住她！她一动就喊疼！我该怎么办？！',
        },
      },
      {
        id: 'falls_mg',
        instruction: '将老人摆成侧卧复苏体位，头偏向一侧防止呕吐物堵住气道。',
        prompt: '实操环节：侧卧体位摆放',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我把他侧过来了！头也偏着，他说好一些了！',
          callerIncorrect: '我位置摆得不对，他一直说不舒服……',
        },
        miniGame: {
          kind: 'positionDrag',
          title: '侧卧体位摆放',
          instruction: '将老人摆成侧卧复苏体位，头偏向一侧防止呕吐物堵住气道。',
          passThreshold: 0.5,
          targetAngle: 90,
          angleTolerance: 12,
          bodyLabel: '侧卧防误吸',
          feedback: { good: '我把他侧过来了！头也偏着，他说好一些了！', bad: '我位置摆得不对，他一直说不舒服……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'falls_pain_worsen',
      trigger: 'time_elapsed',
      triggerValue: '20',
      type: 'new_symptom',
      dialogue: '她说疼得越来越厉害了，一直在冒冷汗，但人还是清醒的。我能给她吃止痛药吗？',
    },
  ],

  outcomeNarrative: {
    good: '调度员正确指导不要移动老人，救护车到达后初步判断为股骨颈骨折，送医后成功进行髋关节置换术，预后良好',
    bad: '家属自行将老人抱起导致骨折错位加重，损伤了周围血管神经，术后恢复缓慢需要延长住院时间',
    prank: '',
  },
}
