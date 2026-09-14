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

  // ============================================================
  // 手写对话脚本 — 雷刚（工友）报告工友高处坠落伤
  // 来电者个性：急切但能配合、不断描述伤者状态变化
  // 关系：工友（对现场了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体位置。',
      caller: {
        calm: ['通州区梨园镇云景东路在建工地3号楼一层入口。'],
        tense: ['通州梨园！云景东路！工地3号楼！一层入口！你们快来！'],
        panic: ['梨园！工地！3号楼！快来！'],
        lost: ['梨园……工地……3号楼……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '通州区梨园镇云景东路在建工地3号楼一层入口' },
      outburst: '他不动了！！你们到底来不来啊！！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。咱接着说，每个问题都帮到他。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '工地旁边有什么明显的标志吗？',
      caller: {
        calm: ['通州梨园地铁站向南500米。'],
        tense: ['梨园地铁站！向南500米！你们到了就能看到！'],
        panic: ['梨园地铁站……南边500米……'],
        lost: ['地铁站旁边……向南……'],
      },
      fillTerminal: { address: '通州区梨园镇云景东路在建工地3号楼一层入口，通州梨园地铁站向南500米' },
      calmReply: {
        operatorCalm: '好，梨园地铁站向南，记下了。咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['工人在三层脚手架上失足摔下来了。', '右腿大腿变形了，头上在流血。', '他说腰不敢动。'],
        tense: ['从脚手架摔下来了！三层楼高！', '右腿变形了！头在流血！', '腰也不敢动！'],
        panic: ['摔下来了！！三层楼高！！', '腿折了！！头在流血！！', '你们快来！！'],
        lost: ['从脚手架摔下来了……', '腿变形了……头在流血……', '腰不敢动……'],
      },
      fillTerminal: { chiefComplaint: '从4米高坠落，右股骨骨折，头部外伤，疑似脊柱损伤', patientGender: '男性' },
      outburst: '他越来越迷糊了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。从三层摔下来，腿变形，头流血，腰不敢动——这些我记下了。别移动他，可能有脊柱伤，按我说的做。',
        calm: '好……我不动他。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他多大岁数？',
      caller: {
        calm: ['36岁。'],
        tense: ['36！他36！'],
        panic: ['36！！36岁！！'],
        lost: ['36……应该是36……'],
      },
      fillTerminal: { patientAge: '36岁' },
      calmReply: {
        operatorCalm: '好，36岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还清醒吗？呼吸怎么样？',
      caller: {
        calm: ['刚才还醒着，但现在越来越迷糊了。', '呼吸急促，不太规则。'],
        tense: ['越来越迷糊了！刚才还能说话！', '呼吸急促！不太规则！'],
        panic: ['叫不醒了！！眼睛睁着但不聚焦！！', '呼吸很奇怪！！你们快来！！'],
        lost: ['叫不太应了……眼睛睁着……', '呼吸急促……不太规则……', '他不会……不会吧……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      outburst: '他完全不动了！！呼吸越来越弱！！你们快来啊！！',
      calmReply: {
        operatorCalm: '听我说。越来越迷糊，呼吸不规则——这我知道了。别移动他，固定住头，用布压住头上的血。我一步步告诉你怎么做。',
        calm: '好……我固定住了。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13677629999，就是这个号。'],
        tense: ['136……7762……9999！打这个就行！'],
        panic: ['136……这个手机！9999！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '136****9999' },
      requireComplete: true,
      calmReply: {
        operatorCalm: '电话记好了。别急，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },
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
    good: '你反复说别搬动，止血也压住了位置。车八分钟到，股骨骨折加硬膜下血肿，手术之后脱离了危险。',
    bad: '现场的人搬动伤者，脊柱受了二次伤，头上的出血也没压住。失血太多又合并脊髓损伤，预后不好。',
    prank: '',
  },
}
