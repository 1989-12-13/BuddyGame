// ============================================================
// MPDS 协议卡片 14 — 溺水/水域事故
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CPR_MINI_GAME_INSTRUCTION } from '../../../components/minigames/engines/cprUtils'

export const drowningCard: EmergencyScenario = {
  id: 'drowning',
  title: '溺水',
  callerId: 'zhou_ming',
  phoneNumber: '138****9999',
  baseStation: '朝阳区奥体中心附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 14,
    title: '溺水/水域事故',
    chiefComplaint: '青年男性游泳池溺水，救上岸后无意识无呼吸',
    determinantCode: '14-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '溺水时间多久？',
      '是否在游泳/深水区？',
      '救上岸时有无呼吸和意识？',
      '有无颈部或脊柱损伤可能？',
      '是否有跳水或潜水动作？',
    ],
  },

  openingLine: '你好，我在奥体中心游泳馆，有个人溺水了，刚捞上来，不动了，我叫不醒他',

  fourElements: {
    address: {
      vague: '朝阳区奥体中心附近',
      partial: '奥体中心游泳馆',
      full: '奥体中心游泳馆西门入口处，门口有个蓝色泳池指示牌',
    },
    contact: '138****9999',
    condition: {
      chiefComplaint: '游泳池有个男的溺水了，刚被救生员捞上来，人不动了',
      age: '大概三十岁左右',
      gender: '男性',
      consciousness: '完全没有反应，怎么叫都不醒',
      breathing: '不知道，好像胸口不动了',
      patientCount: '1人',
      additional: [
        '救生员刚把他从深水区拖上来',
        '不知道溺水多久了，发现的时候已经在水底了',
        '有一群人在做心肺复苏',
        '嘴里没有异物',
      ],
    },
    purpose: '快派救护车，他好像没有呼吸了',
  },

  // ============================================================
  // 手写对话脚本 — 周明（路人）报告游泳池溺水
  // 来电者个性：语气镇定、叙述有条理、能冷静配合
  // 关系：路人（对溺水者不了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体位置。',
      caller: {
        calm: ['朝阳区奥体中心游泳馆，西门入口处。'],
        tense: ['奥体中心游泳馆！西门！你们快来！'],
        panic: ['奥体中心！游泳馆！西门！快来！'],
        lost: ['奥体中心……游泳馆……西门……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '朝阳区奥体中心游泳馆西门入口处' },
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你紧张，救护车已经在路上了。咱接着说，每个问题都帮到他。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '游泳馆门口有什么明显的标志吗？',
      caller: {
        calm: ['门口有个蓝色泳池指示牌。'],
        tense: ['蓝色泳池指示牌！就在门口！你们到了就能看到！'],
        panic: ['蓝色牌子……门口……'],
        lost: ['有个牌子……蓝色……'],
      },
      fillTerminal: { address: '朝阳区奥体中心游泳馆西门入口处，门口有蓝色泳池指示牌' },
      calmReply: {
        operatorCalm: '好，蓝色指示牌，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['游泳馆有个人溺水了，刚被救生员捞上来。', '人不动了，叫不醒他。', '不知道溺水多久了。'],
        tense: ['有人溺水了！刚捞上来！', '不动了！叫不醒！', '不知道溺水多久了！'],
        panic: ['溺水了！！不动了！！', '叫不醒了！！你们快来！！', '他快不行了！！'],
        lost: ['有人溺水了……', '不动了……叫不醒……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '游泳池溺水，救上岸后无意识', patientGender: '男性' },
      outburst: '他没反应了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。溺水，捞上来不动了——这些我记下了。你现在是我唯一的帮手，按我说的做，他有机会。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他大概多大岁数？',
      caller: {
        calm: ['大概三十岁左右。'],
        tense: ['三十岁左右！年轻人！'],
        panic: ['三十岁！！年轻人！！'],
        lost: ['三十岁……应该是……'],
      },
      fillTerminal: { patientAge: '约30岁' },
      calmReply: {
        operatorCalm: '好，大约三十岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还有意识吗？还在喘气吗？',
      caller: {
        calm: ['完全没有反应，怎么叫都不醒。', '胸口好像不动了，可能没有呼吸了。'],
        tense: ['没有反应！怎么叫都不醒！', '胸口好像不动了！可能没有呼吸了！'],
        panic: ['没有反应！！叫不醒了！！', '胸口不动了！！没有呼吸！！', '你们快来啊！！'],
        lost: ['叫不醒了……胸口也不动了……', '他是不是已经……', '不会的不会的……'],
      },
      fillTerminal: { conscious: false, breathing: false },
      outburst: '他没气了！！你们快来啊！！他快死了！！',
      calmReply: {
        operatorCalm: '听我说。没有意识、没有呼吸——这我知道了。现在你能救他。我会一步步教你做心肺复苏，你按我说的来，每一秒都很重要。',
        calm: '好……我跟你做。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13877629999，就是这个号。'],
        tense: ['138……7762……9999！打这个就行！'],
        panic: ['138……这个手机！9999！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '138****9999' },
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
      id: 'mpds_drowning_time',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 3,
      stressEffect: -8,
      label: '溺水时间',
      questionText: '溺水多久了？',
      answer: '不太确定……就几分钟，我看到的时候救生员已经在捞了',
      answerVague: '几分钟...不知道...',
      ramblingAnswer: '我其实也不太确定具体多久，我是听见有人喊救命才知道出事了，跑过去的时候救生员已经跳下去了，捞了大概一两分钟才捞上来。所以从发现到上来可能有四五分钟吧，在水底多久就不知道了。',
      panickedAnswer: '不知道多久！！我看到的时候他已经在水里了！！好像有一会儿了！！他脸都白了！！',
      reveals: ['additional'],
      judgment: {
        question: '溺水时间大约多久？',
        options: [
          { label: '溺水不足1分钟', fills: [], isCorrect: false },
          { label: '估计溺水4-5分钟', fills: [{ field: 'conditionNote', value: '溺水时间约4-5分钟，黄金救援时间' }], isCorrect: true },
          { label: '溺水超过10分钟', fills: [], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_drowning_spine',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '脊柱损伤可能',
      questionText: '有没有跳水或撞到头部？',
      answer: '不清楚……好像是游着游着突然就不行了',
      answerVague: '不知道...',
      ramblingAnswer: '没人看到具体怎么回事，就听那边扑腾了几声然后就没动静了。救生员说应该是抽筋了沉下去的，没看到撞到头。但是游泳池边上也没看到有血什么的，应该不是跳水出的事。',
      panickedAnswer: '不知道！！我哪知道啊！！就看到他沉下去了！！',
      reveals: [],
    },
  ],

  guidance: {
    title: '溺水CPR指导',
    intro: '救护车已经在路上了。溺水急救的关键是尽快恢复呼吸。请您按我说的做。',
    steps: [
      {
        id: 'drowning_airway',
        instruction: '请把溺水者平躺，头后仰，下巴抬起，检查嘴里有没有异物',
        prompt: '第一步：开放气道',
        options: [
          '清理口腔开放气道',
          '直接开始按压',
          '把患者倒过来控水',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，开放气道是溺水急救第一步',
          incorrect: '不对，不要控水会耽误时间，首先要开放气道',
          callerCorrect: '我把他头往后仰了，嘴里好像有点水，我擦掉了',
          callerIncorrect: '我把他倒过来控水了……他吐了一些水出来但还是没醒',
        },
      },
      {
        id: 'drowning_breaths',
        instruction: '先做5次人工呼吸，捏住鼻子，口对口吹气',
        prompt: '第二步：人工呼吸',
        options: [
          '先做5次人工呼吸',
          '直接开始胸外按压',
          '先做30次按压',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，溺水需要先给5次人工呼吸',
          incorrect: '不对，溺水与心脏骤停不同需要先给人工呼吸',
          callerCorrect: '我吹了5次！他胸口有起伏！好像有反应了！',
          callerIncorrect: '我直接按了......他现在还是没反应',
        },
      },
      {
        id: 'drowning_compressions',
        instruction: '30次按压接2次人工呼吸，一直做到救护车到',
        prompt: '第三步：胸外按压',
        options: [
          '30:2循环',
          '一直按压不要停',
          '等他自主呼吸',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，持续30:2循环是关键',
          incorrect: '不对，需要按30:2的节奏循环',
          callerCorrect: '我们在按！01 02 03 我一数他就有节奏地按',
          callerIncorrect: '我看他好像有点呼吸了就没按了...但现在又不喘了',
        },
      },
      {
        id: 'drowning_cpr_game',
        instruction: '实操演练：CPR 30:2 循环。',
        prompt: '实操环节：CPR 30:2',
        options: ['开始'],
        correctIndex: 0,
        feedback: {
          correct: 'CPR操作到位。',
          incorrect: 'CPR操作需改进。',
          callerCorrect: '我按了30下又吹了2口气！他好像有反应了！',
          callerIncorrect: '我光顾着吹气了，按压节奏没跟上……',
        },
        miniGame: {
          kind: 'cpr',
          title: 'CPR 30:2',
          instruction: CPR_MINI_GAME_INSTRUCTION,
          passThreshold: 0.5,
          cycles: 2,
          feedback: { good: '我按了30下又吹了2口气！他好像有反应了！', bad: '我光顾着吹气了，按压节奏没跟上……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'drowning_nose_water',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他鼻子里往外流水了！这是好事还是坏事？！',
    },
  ],

  outcomeNarrative: {
    good: '你在电话里带着他做 CPR，按到十几下人就呛咳出声。送医两天后出院。',
    bad: '现场先忙着控水，按压的黄金时间就这么过去了。脑缺氧太久，留下了后遗症。',
    prank: '',
  },
}
