// ============================================================
// MPDS 协议卡片 18 — 头痛
// 分诊级别: 绿色（突然剧烈头痛需警惕脑血管问题，正确分诊为黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const severeHeadacheCard: EmergencyScenario = {
  id: 'severe_headache',
  title: '剧烈头痛',
  callerId: 'gao_yan',
  phoneNumber: '156****8888',
  baseStation: '东城区东四附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 18,
    title: '头痛',
    chiefComplaint: '中年女性突发炸裂样头痛、伴有呕吐和畏光',
    determinantCode: '18-C-1',
    hotCold: 'HOT',
    keyQuestions: [
      '头痛从什么时候开始的',
      '是什么样的疼痛之前有没有类似情况',
      '疼痛有多严重1到10分',
      '有没有呕吐视力模糊或脖子僵硬',
      '有没有高血压病史',
    ],
  },

  openingLine: '120吗我头突然疼得不行了像要炸开一样从来没有这么疼过刚才还吐了',

  fourElements: {
    address: {
      vague: '东城区东四附近',
      partial: '东四北大街',
      full: '东四北大街303号2单元501室',
    },
    contact: '156****8888',
    condition: {
      chiefComplaint: '在家看电视突然头痛欲裂像被雷劈了一样',
      age: '45岁',
      gender: '女性',
      consciousness: '清醒但疼得没法正常说话',
      breathing: '正常',
      patientCount: '1人',
      additional: [
        '半小时前突然发作',
        '疼痛是最剧烈的程度10分',
        '吐了一次',
        '有点怕光',
        '有高血压史',
      ],
    },
    purpose: '是不是脑出血了要不要吃药',
  },

  // ============================================================
  // 手写对话脚本 — 高艳（本人）报告突发剧烈头痛
  // 来电者个性：疼痛压抑语气、说话断断续续、畏光畏声
  // 关系：本人（对患者完全了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体到楼号。',
      caller: {
        calm: ['东城区东四北大街303号2单元501室。'],
        tense: ['东四北大街！303号！2单元501！嘶——疼……'],
        panic: ['东四北大街！303号！501！嘶——'],
        lost: ['东四……303号……501……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '东城区东四北大街303号2单元501室' },
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你疼，救护车已经在路上了。咱接着说。',
        calm: '好……你问。',
        tense: '行……嘶——你问。',
        panic: '嗯……快问……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '楼旁边有什么明显的标志吗？',
      caller: {
        calm: ['东四地铁站B口往北200米。'],
        tense: ['地铁B口！往北200米！'],
        panic: ['地铁B口……北边……嘶——'],
        lost: ['地铁口旁边……往北……'],
      },
      fillTerminal: { address: '东城区东四北大街303号2单元501室，东四地铁站B口往北200米' },
      calmReply: {
        operatorCalm: '好，地铁B口，记下了。咱继续。',
        calm: '好，你说。',
        tense: '行……我听着。',
        panic: '嗯……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['半小时前头突然疼起来，像炸开一样。', '从来没这么疼过，吐了一次。', '有高血压史。'],
        tense: ['头要炸了！突然来的！', '吐了一次！从来没有这么疼过！', '有高血压！'],
        panic: ['炸开一样！！突然就来了！！', '吐了！！像雷劈了一样！！', '我是不是要死了！！'],
        lost: ['头疼……炸开一样……', '吐了……', '好疼……'],
      },
      fillTerminal: { chiefComplaint: '突发炸裂样头痛伴呕吐，有高血压史', patientGender: '女性' },
      outburst: '哎哟！疼死了！你们到底来不来！',
      calmReply: {
        operatorCalm: '我听清楚了。突然炸裂样头痛，还吐了——这些我记下了。别吃止痛药，按我说的做。',
        calm: '好……我不吃药。',
        tense: '行……嘶——知道了。',
        panic: '嗯……不吃……',
        lost: '……好。',
      },
    },

    step3_age: {
      operator: '您多大岁数？',
      caller: {
        calm: ['45岁。'],
        tense: ['45！我45！'],
        panic: ['45！嘶——'],
        lost: ['45……对，45。'],
      },
      fillTerminal: { patientAge: '45岁' },
      calmReply: {
        operatorCalm: '好，45岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行……你说。',
        panic: '嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '人清醒吗？呼吸怎么样？',
      caller: {
        calm: ['清醒，但疼得没法正常说话。', '呼吸正常。'],
        tense: ['清醒！但疼得说不出话！', '呼吸正常！嘶——'],
        panic: ['清醒！！疼！！嘶——', '呼吸正常！！但好疼！！'],
        lost: ['醒着……疼得说不出话……', '呼吸正常……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，人清醒，呼吸正常，这我知道了。关灯躺下，别吃任何止痛药，救护车马上到。',
        calm: '好……我躺着。',
        tense: '行……嘶——知道了。',
        panic: '嗯……快……',
        lost: '……好。',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['15677628888，就是这个号。'],
        tense: ['156……7762……8888！打这个！'],
        panic: ['156……8888！嘶——'],
        lost: ['156……这个手机……'],
      },
      fillTerminal: { contact: '156****8888' },
      requireComplete: true,
      calmReply: {
        operatorCalm: '电话记好了。别急，咱继续。',
        calm: '好，你说。',
        tense: '行……我听着。',
        panic: '嗯。',
        lost: '……好。',
      },
    },
  },

  mpdsQuestions: [
    {
      id: 'mpds_headache_nature',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '头痛性质',
      questionText: '是什么样的疼？什么时候开始的？',
      answer: '像炸开一样突然一下子就来了半小时前',
      answerVague: '突然就疼了...半小时前...',
      ramblingAnswer: '大概半小时前我在沙发上坐着看电视突然一下头就跟要炸开一样剧痛。我活这么大从来没这么疼过。然后我就觉得恶心得不行跑去厕所吐了。我老公把灯关了因为我看到光就更疼。',
      panickedAnswer: '炸开一样！！！突然就来了！！像雷劈了一样！！我是不是要死了！！',
      reveals: ['additional'],
      judgment: {
        question: '突然炸裂样头痛伴呕吐提示什么？',
        options: [
          { label: '突发炸裂样头痛 警惕蛛网膜下腔出血', fills: [{ field: 'conditionNote', value: '疑似蛛网膜下腔出血' }], isCorrect: true },
          { label: '普通偏头痛 休息即可', fills: [{ field: 'conditionNote', value: '误判为偏头痛' }], isCorrect: false },
          { label: '颈椎病引起的头痛', fills: [{ field: 'conditionNote', value: '误判为颈椎病' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_headache_symptom',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '伴随症状',
      questionText: '有没有脖子发硬？手脚发麻？',
      answer: '脖子有点硬但是手脚没事',
      answerVague: '脖子硬...手脚没事...',
      ramblingAnswer: '我老公说我脖子有点硬，他让我低头我低不下去，但是手脚都能动也没有发麻的感觉。就是头太疼了，像有人在脑子里打鼓一样。',
      panickedAnswer: '脖子硬！！特别硬！！动不了！！手脚还好但是头要炸了！！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '剧烈头痛等待指导',
    intro: '不要吃任何止痛药保持安静。救护车马上就到。',
    steps: [
      {
        id: 'headache_rest',
        instruction: '躺在安静黑暗的房间休息',
        prompt: '第一步：安静休息',
        options: [
          '安静暗室休息',
          '开灯看电视',
          '出门透气',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！安静暗室休息可以减少刺激。',
          incorrect: '不对。光和噪音会加重头痛，应保持安静避光环境。',
          callerCorrect: '我躺在卧室了窗帘拉上了老公把电视关了，感觉好一点点。',
          callerIncorrect: '我开着灯在看电视...越看越疼...是不是不该这样？',
        },
      },
      {
        id: 'headache_observe',
        instruction: '观察意识变化，如果出现意识模糊立即报告',
        prompt: '第二步：观察意识',
        options: [
          '观察意识',
          '多喝水',
          '吃止痛药',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！密切观察意识状态非常重要。',
          incorrect: '不对。在明确诊断前不应自行用药或大量喝水，应重点观察意识变化。',
          callerCorrect: '我老公在旁边看着我呢，一有不对就告诉您！',
          callerIncorrect: '我吃了片止痛药...是不是不该吃？',
        },
      },
      {
        id: 'headache_dont',
        instruction: '不要吃止痛药，不要热敷',
        prompt: '第三步：不要自行用药',
        options: [
          '不要自行用药',
          '吃阿司匹林',
          '热敷头部',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！在诊断明确前绝对不要自行用药。',
          incorrect: '不对。阿司匹林会加重出血风险，热敷会增加颅内压力。',
          callerCorrect: '好！我什么药都不吃！就等着救护车来！',
          callerIncorrect: '我老公给我吃了阿司匹林...说是止疼的...是不是做错了？',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'headache_worsen',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '她说头越来越疼了而且看东西有点双影了这是怎么回事',
    },
  ],

  outcomeNarrative: {
    good: '你让她安静躺下，一路盯着变化。后来查出蛛网膜下腔出血，做介入之后恢复得不错。',
    bad: '患者自己吃了阿司匹林，出血更厉害了。送医时已经形成颅内血肿，得开颅。',
    prank: '',
  },
}
