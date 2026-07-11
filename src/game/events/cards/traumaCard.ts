// ============================================================
// MPDS 协议卡片 30 — 创伤（多发伤）
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const traumaCard: EmergencyScenario = {
  id: 'trauma',
  title: '高处坠落伤',
  callerId: 'lei_gang',
  phoneNumber: '136****9999',
  baseStation: '通州区梨园附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 30,
    title: '创伤',
    chiefComplaint: '中年男性从4米高脚手架坠落右腿变形意识模糊',
    determinantCode: '30-D-2',
    hotCold: 'HOT',
    keyQuestions: [
      '从多高的地方摔下来的？',
      '着地部位是哪里？',
      '有没有头部着地？',
      '有没有脊柱损伤的可能？',
      '患者意识是否清楚？',
    ],
  },

  openingLine: '120吗工地出事了！一个人从脚手架上摔下来了有三四米高！右腿折了！人清醒但迷糊了！',

  fourElements: {
    address: {
      vague: '通州区梨园附近',
      partial: '梨园镇在建住宅小区工地',
      full: '梨园镇云景东路在建工地3号楼一层入口，通州梨园地铁站向南500米',
    },
    contact: '136****9999',
    condition: {
      chiefComplaint: '工人在三层脚手架作业时失足摔下来了',
      age: '36岁',
      gender: '男性',
      consciousness: '刚才还醒着但是现在越来越迷糊了',
      breathing: '呼吸急促不规则',
      patientCount: '1人',
      additional: [
        '从三层楼高的脚手架摔到水泥地上',
        '右腿大腿明显变形',
        '头上在流血头发都湿了',
        '地上有血',
        '腰部不敢动',
      ],
    },
    purpose: '快派救护车可能快不行了',
  },

  mpdsQuestions: [
    {
      id: 'mpds_trauma_conscious',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 3,
      stressEffect: -10,
      label: '意识在变差吗？',
      questionText: '伤者的意识是不是越来越差了？',
      answer: '是！刚才还知道疼现在问他话也不回答了！',
      answerVague: '不说话了...迷糊了...',
      ramblingAnswer: '刚摔下来的时候他还喊疼得受不了问我们他的腿怎么了，但是现在大概过了几分钟他越来越不说话了，眼睛睁着但是不聚焦，我们喊他也不回答了，呼吸变得很奇怪。',
      panickedAnswer: '叫不醒了！刚才还能说话的现在不行了！眼睛睁着但跟没看到一样！',
      reveals: ['consciousness'],
      judgment: {
        question: '意识进行性下降最可能提示什么？',
        options: [
          { label: '失血性休克或颅脑损伤', fills: [{ field: 'conditionNote', value: '意识恶化高度警惕失血性休克或颅脑损伤' }], isCorrect: true },
          { label: '只是吓到了过一会儿就好', fills: [{ field: 'conditionNote', value: '惊吓反应' }], isCorrect: false },
          { label: '睡着了正常现象', fills: [{ field: 'conditionNote', value: '患者睡眠状态' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_trauma_injuries',
      category: 'bleeding',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -8,
      label: '哪些部位受伤？',
      questionText: '他身上哪些部位有外伤？有没有明显的出血或变形？',
      answer: '右腿变形了头上在流血腰部不敢动',
      answerVague: '腿...头...腰...',
      ramblingAnswer: '右腿大腿位置明显弯了一个不该弯的角度，肯定是骨折了。头上后脑勺位置在流血，头发湿了一大片，地上也有一小滩血。他自己说腰也疼不敢动。脸上没有什么伤但是脸色很白。',
      panickedAnswer: '腿折了！！大腿弯了！！头在流血！！他说腰也疼！！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '严重创伤急救指导',
    intro: '不要移动伤者可能有脊柱损伤。救护车马上就到请按我说的做。',
    steps: [
      {
        id: 'trauma_neck',
        instruction: '用手固定住伤者的头部两侧，不要让他移动脖子。绝对不要搬动他。',
        prompt: '第一步：固定颈部',
        options: [
          '固定颈部不要移动',
          '扶他坐起来',
          '让他转头看看四周',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！高处坠落必须高度怀疑脊柱损伤。',
          incorrect: '不对。高处坠落最怕脊柱损伤，移动可能导致截瘫。',
          callerCorrect: '我跪在他头旁边用两手固定住他的头了！',
          callerIncorrect: '我已经把他扶起来了......他疼得大叫了一声！',
        },
      },
      {
        id: 'trauma_bleed',
        instruction: '用干净的布料按压头部出血部位，用力压住不要松手。',
        prompt: '第二步：止血',
        options: [
          '按压头部止血',
          '用绳子勒住头',
          '撒烟灰止血',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！直接按压是最有效的止血方法。',
          incorrect: '不对。不要在伤口上撒任何东西，直接按压即可。',
          callerCorrect: '我用干净衣服压住了他的头！血好像没那么快流了！',
          callerIncorrect: '我在伤口上撒了烟灰...血好像止住了一点但是混着烟灰黑乎乎的',
        },
      },
      {
        id: 'trauma_warm',
        instruction: '用衣服或毯子盖住伤者身体保暖。不要给他喝水。',
        prompt: '第三步：保暖防休克',
        options: [
          '盖衣物保暖防休克',
          '用冷水降温',
          '给他喝水补充体力',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！保暖防休克，且不能喝水可能需手术。',
          incorrect: '不对。创伤患者不要喝水（可能需全麻手术），也不要降温。',
          callerCorrect: '我把我的外套脱了盖在他身上了！他好像在发抖！',
          callerIncorrect: '他想喝水我给他喝了一点...是不是不能喝？',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'trauma_shock',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他完全不动了！呼吸好像越来越弱了！手脚开始变凉了！你们来了没有！',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导保持不动和止血，救护车8分钟到达。送医后诊断为右股骨骨折伴硬膜下血肿，经手术抢救后脱离危险',
    bad: '现场人员搬运伤者导致脊柱二次损伤且未控制头部出血，伤者失血量过大合并脊髓损伤，预后较差',
    prank: '',
  },
}
