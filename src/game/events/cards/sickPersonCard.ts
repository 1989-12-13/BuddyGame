// ============================================================
// MPDS 协议卡片 26 — 非特异性病患
// 分诊级别: 轻伤（绿色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const sickPersonCard: EmergencyScenario = {
  id: 'sick_person',
  title: '不明原因发烧',
  callerId: 'xu_mei',
  phoneNumber: '132****7777',
  baseStation: '丰台区公益西桥附近',
  isPrank: false,
  correctTriage: 'green',

  mpdsCard: {
    number: 26,
    title: '非特异性病患',
    chiefComplaint: '儿童持续发烧三天精神萎靡食欲不振',
    determinantCode: '26-D-2',
    hotCold: 'COLD',
    keyQuestions: [
      '发烧多少度烧了多久？',
      '有没有其他症状？',
      '精神怎么样？',
      '能不能正常喝水吃饭？',
      '有没有出疹子？',
    ],
  },

  openingLine: '120吗我家孩子发烧三天了吃了退烧药退了又烧现在精神很差不吃不喝我想带她去医院但是一个人弄不了',

  fourElements: {
    address: {
      vague: '丰台区公益西桥附近',
      partial: '公益西桥华联商场后面小区',
      full: '公益西桥华联商场后侧东亚三环中心4号楼2单元603室',
    },
    contact: '132****7777',
    condition: {
      chiefComplaint: '孩子反复发烧三天最高39度5现在没精神也不吃东西',
      age: '2岁',
      gender: '女性',
      consciousness: '清醒但是没精神一直蔫蔫的',
      breathing: '正常',
      patientCount: '1人',
      additional: [
        '发烧最高39度5',
        '吃了布洛芬能退到38度但过几个小时又烧起来',
        '不怎么喝水尿少',
        '没有咳嗽流鼻涕',
        '身上没有出疹子',
      ],
    },
    purpose: '孩子烧太久了我怕烧坏了需要去医院',
  },

  // ============================================================
  // 手写对话脚本 — 徐梅（母亲）报告孩子持续发烧
  // 来电者个性：焦虑但配合、语速偏快、不断描述孩子状态
  // 关系：母亲（对孩子了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['丰台区公益西桥华联商场后侧东亚三环中心4号楼2单元603室。'],
        tense: ['公益西桥！华联商场后面！东亚三环中心！4号楼！603！'],
        panic: ['公益西桥！东亚三环！4号楼！603！快来！'],
        lost: ['公益西桥……东亚三环……603……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '丰台区公益西桥华联商场后侧东亚三环中心4号楼2单元603室' },
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。咱接着说，每个问题都帮到孩子。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '小区旁边有什么明显的标志吗？',
      caller: {
        calm: ['公益西桥地铁站B口出来向南走200米。'],
        tense: ['地铁B口！向南200米！华联商场后面！'],
        panic: ['地铁B口……南边200米……'],
        lost: ['地铁口旁边……华联商场……'],
      },
      fillTerminal: { address: '丰台区公益西桥华联商场后侧东亚三环中心4号楼2单元603室，公益西桥地铁站B口出来向南走200米' },
      calmReply: {
        operatorCalm: '好，地铁B口，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['孩子反复发烧三天了，最高39度5。', '吃了退烧药退了又烧，现在精神很差，不吃不喝。'],
        tense: ['孩子烧了三天了！最高39度5！', '退了又烧！现在精神很差！不吃不喝！'],
        panic: ['烧了三天！！39度5！！', '不吃不喝了！！精神很差！！', '你们快来！！'],
        lost: ['孩子烧了三天……', '不吃不喝……精神很差……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '儿童反复发烧3天，最高39.5度，精神萎靡', patientGender: '女性' },
      calmReply: {
        operatorCalm: '我听清楚了。反复发烧三天，精神差——这些我记下了。别急，按我说的做。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '孩子多大？',
      caller: {
        calm: ['2岁。'],
        tense: ['2岁！今年2岁！'],
        panic: ['2岁！！2岁！！'],
        lost: ['2岁……对，2岁。'],
      },
      fillTerminal: { patientAge: '2岁' },
      calmReply: {
        operatorCalm: '好，2岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '孩子清醒吗？呼吸怎么样？',
      caller: {
        calm: ['清醒但没精神，一直蔫蔫的。', '呼吸正常。'],
        tense: ['清醒但没精神！一直蔫蔫的！', '呼吸正常！'],
        panic: ['清醒！！但没精神！！', '呼吸正常！！就是不喝奶！！'],
        lost: ['清醒……但蔫蔫的……', '呼吸正常……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，人清醒，呼吸正常，这我知道了。少量多次喂水，减少衣物，救护车马上到。',
        calm: '好……我喂水。',
        tense: '行……知道了。',
        panic: '嗯……快……',
        lost: '……好。',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13277627777，就是这个号。'],
        tense: ['132……7762……7777！打这个就行！'],
        panic: ['132……这个手机！7777！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '132****7777' },
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
      id: 'mpds_sick_spirit',
      category: 'consciousness',
      tier: 'important',
      timeCost: 2,
      stressEffect: -5,
      label: '精神怎么样？',
      questionText: '孩子精神和平时比怎么样？还玩吗？',
      answer: '很蔫喜欢睡觉不怎么玩',
      answerVague: '没精神...一直睡...',
      ramblingAnswer: '她平时特别淘气的现在完全不动了就是躺着。能叫醒但是醒了一会儿又睡。水也不怎么喝奶也不喝。尿布今天换了三片都是干的我觉得她有点脱水了。',
      panickedAnswer: '不动了！完全不玩了！叫醒一下就又睡！水也不喝！',
      reveals: ['additional'],
      judgment: {
        question: '精神萎靡尿少提示什么？',
        options: [
          { label: '发热伴脱水风险需就医补液', fills: [{ field: 'conditionNote', value: '发热伴脱水风险' }], isCorrect: true },
          { label: '正常发热反应观察即可', fills: [{ field: 'conditionNote', value: '发热精神状态可' }], isCorrect: false },
          { label: '是脑膜炎的表现', fills: [{ field: 'conditionNote', value: '疑似脑膜炎' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_sick_breath',
      category: 'breathing',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '呼吸正常吗？',
      questionText: '孩子呼吸有没有急促或者喘？',
      answer: '呼吸还算正常没有喘',
      answerVague: '还行...',
      ramblingAnswer: '我观察了一下她呼吸还算平稳，没有很急促也没有那种喘的声音。就是睡得比较多身上有点烫，但是没有咳嗽也没有流鼻涕。',
      panickedAnswer: '呼吸正常！！就是没精神！！一直睡！！',
      reveals: ['breathing'],
    },
  ],

  guidance: {
    title: '发热儿童护理指导',
    intro: '救护车已经在路上了。在等待期间请按我说的做。',
    steps: [
      {
        id: 'sick_fluid',
        instruction: '少量多次喂水或口服补液盐，不要一次性灌太多。',
        prompt: '第一步：补充水分',
        options: [
          '少量多次喂水',
          '一次性多喝水',
          '不要喝水',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！少量多次补液是最安全的。',
          incorrect: '不对。一次性大量喝水可能引起呕吐，应少量多次。',
          callerCorrect: '我用勺子一点点喂她喝了点水，没有吐出来！',
          callerIncorrect: '我拿奶瓶给她喝她喝了两口就不喝了',
        },
      },
      {
        id: 'sick_cool',
        instruction: '减少衣物保持室内通风，不要捂得太厚。',
        prompt: '第二步：物理降温',
        options: [
          '减少衣物通风散热',
          '捂被子发汗',
          '酒精擦浴',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！散热通畅才能帮助退烧。',
          incorrect: '不对。捂被子会导致体温进一步升高，酒精擦浴可能被皮肤吸收。',
          callerCorrect: '我把她厚外套脱了开了窗，她好像舒服点了',
          callerIncorrect: '我给她盖了两层被子想让她发汗...她现在脸上红得更厉害了',
        },
      },
      {
        id: 'sick_observe',
        instruction: '观察孩子的精神状态和呼吸，如果出现抽搐或呼吸困难立即报告。',
        prompt: '第三步：密切观察',
        options: [
          '观察精神和呼吸变化',
          '让孩子继续睡不要打扰',
          '用力拍醒孩子',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！持续观察才能及时发现病情变化。',
          incorrect: '不对。需要持续观察意识状态和呼吸频率。',
          callerCorrect: '我坐在旁边看着她呢，睡得还算安稳呼吸也平稳',
          callerIncorrect: '我让她自己睡了我去做饭了...应该没事吧',
        },
      },
    ],
  },

  specialEvents: [],

  outcomeNarrative: {
    good: '家长在指导下给孩子补了水，送医后检查为病毒性感染，经补液和退热治疗后三天康复',
    bad: '家属给孩子捂被子发汗导致体温进一步升高出现热性惊厥，送医后住院一周',
    prank: '',
  },
}
