// ============================================================
// MPDS 协议卡片 29 — 交通/运输事故
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const traumaCarCard: EmergencyScenario = {
  id: 'trauma_car',
  title: '严重车祸',
  callerId: 'wang_xiao',
  phoneNumber: '139****5678',
  baseStation: '海淀区中关村大街附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 29,
    title: '交通/运输事故',
    chiefComplaint: '骑电动车被汽车撞击，外伤出血、脊柱疑似损伤',
    determinantCode: '29-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '发生了什么？（事故机制）',
      '有多少伤员？',
      '伤员是否被困/卡住？',
      '有活动性出血吗？',
      '伤员意识是否清醒？',
    ],
  },

  openingLine: '你好，这边出车祸了，一个骑电动车的人被汽车撞了，流了好多血，人还清醒但是动不了。',

  fourElements: {
    address: {
      vague: '海淀区中关村大街附近',
      partial: '中关村大街和知春路交叉口',
      full: '中关村大街和知春路交叉口，海淀黄庄地铁站A2出口往北50米',
    },
    contact: '139****5678',
    condition: {
      chiefComplaint: '路边有个骑电动车的人被汽车撞了，腿在流血，人还醒着但动不了了',
      age: '30岁左右',
      gender: '男性',
      consciousness: '人是清醒的，能跟我说话',
      breathing: '呼吸看着还算正常',
      patientCount: '1人',
      additional: [
        '右腿有明显外伤，出血量较大',
        '自述腰部疼痛',
        '戴着头盔，头部无明显外伤',
      ],
    },
    purpose: '需要救护车和急救',
  },

  mpdsQuestions: [
    {
      id: 'mpds_bleeding',
      category: 'bleeding',
      tier: 'critical',
      timeCost: 3,
      stressEffect: -8,
      label: '出血严重吗？',
      questionText: '出血量大吗？是涌出来的还是一点点渗出来的？',
      answer: '挺多的，裤腿全湿了……但不是喷出来的那种。',
      answerVague: '好多血...裤子上都是...',
      ramblingAnswer: '挺多的...不是那种喷的，就是一直往外渗，他那个裤腿全湿透了，深色的裤子都被血染得发亮。我刚才试着用纸巾按了一下，根本止不住...不过不是嗞出来的那种，就感觉一直在流。他好像不太疼的样子，但出血量我觉得不少。',
      panickedAnswer: '好多血！！！裤子上地上都是！一直在流一直在流！你快说我要怎么止血啊！！！他不会死吧？！',
      reveals: ['additional', 'consciousness'],
      judgment: {
        question: '根据来电者描述「裤腿全湿、一直渗、不是喷出来的」，出血特征最可能是？',
        options: [
          { label: '动脉喷射性出血', sublabel: '危险！需即刻止血', fills: [{ field: 'conditionNote', value: '动脉喷射性出血' }], isCorrect: false },
          { label: '大面积静脉性渗血', sublabel: '量大但非喷射', fills: [{ field: 'conditionNote', value: '右腿大面积静脉性出血' }], isCorrect: true },
          { label: '少量毛细血管出血', sublabel: '不紧急', fills: [{ field: 'conditionNote', value: '少量外出血' }], isCorrect: false },
          { label: '内出血（体表无明显出血）', fills: [{ field: 'conditionNote', value: '疑似内出血' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '外伤出血控制',
    intro: '救护车正在路上。在等待期间，请帮助伤者控制出血。您能找到干净的布或者衣服吗？',
    steps: [
      {
        id: 'bleed_pressure',
        instruction: '请用干净的布或衣物直接按压在出血部位上，用力但不要过度。',
        prompt: '第一步：止血',
        options: [
          '用干净布直接按压伤口止血',
          '用酒精冲洗伤口',
          '用绳子扎紧伤口上方',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！直接按压是最有效的止血方法。',
          incorrect: '不对。酒精冲洗会刺激伤口加剧疼痛，扎止血带需要专业知识，直接按压是最安全有效的方法。',
          callerCorrect: '我用衣服死死压住了！血好像没刚才渗得那么快了……这是个好兆头吧？',
          callerIncorrect: '我拿酒精给他冲了一下……他疼得嗷嗷叫！是不是我做错了？！出血还是没止住！',
        },
      },
      {
        id: 'bleed_elevate',
        instruction: '如果可能的话，把伤者的腿稍微抬高一点，但要小心不要移动伤者。',
        prompt: '第二步：抬高伤处',
        options: [
          '在不移动身体的前提下抬高腿部',
          '把伤者扶起来坐着',
          '不用管，等救护车来就行',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！抬高伤处有助于减少出血，但千万不要移动疑似脊柱损伤的患者。',
          incorrect: '不对。切忌移动伤者（可能脊柱受伤），只需在不移动的前提下抬高伤处。',
          callerCorrect: '我小心翼翼地给他腿垫了一下，他说感觉比刚才好点了……还跟我说谢谢……',
          callerIncorrect: '他说腰疼得不行，我不敢动他了……但是他腿还在流血，我该怎么办？',
        },
      },
      {
        id: 'bleed_monitor',
        instruction: '请持续观察伤者的意识状态和呼吸，如果出现意识模糊或呼吸异常，立即告诉我。',
        prompt: '第三步：持续观察',
        options: [
          '持续观察意识和呼吸变化',
          '让伤者自己待着',
          '给伤者喝水',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！持续观察是及时发现病情变化的关键。',
          incorrect: '不对。外伤患者可能随时恶化，需要持续观察。另外不要给伤者饮水（可能需手术）。',
          callerCorrect: '我一直盯着他呢……他现在还醒着，在跟我说话。他说腰还是疼，但人还算清楚。',
          callerIncorrect: '他好像想睡觉了……眼睛快闭上了……让他睡一下可以吧？还是说……不能睡？',
        },
      },
      {
        id: 'bleed_mg',
        instruction: '用布料持续按压出血伤口，保持压力不要松手。',
        prompt: '实操环节：持续按压止血',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我按住了！布料被血浸了但我没松手！',
          callerIncorrect: '我手酸松了一下，血又流了……',
        },
        miniGame: {
          kind: 'holdPressure',
          title: '持续按压止血',
          instruction: '用布料持续按压出血伤口，保持压力不要松手。',
          passThreshold: 0.5,
          holdSec: 10,
          bleedRatePerSec: 14,
          regainPerSec: 22,
          feedback: { good: '我按住了！布料被血浸了但我没松手！', bad: '我手酸松了一下，血又流了……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'trauma_update',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '等等……伤者说他的腰越来越疼了，而且右腿好像没感觉了……',
    },
  ],

  outcomeNarrative: {
    good: '车祸伤员得到及时派车和现场止血指导，救护车11分钟后到达。伤员右腿骨折伴腰椎损伤，因现场处置得当，未造成二次伤害。',
    bad: '派车延迟且止血指导错误，伤员出血量较大。救护车到达时伤员已出现早期休克症状……',
    prank: '',
  },
}
