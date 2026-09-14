// ============================================================
// MPDS 协议卡片 12 — 抽搐/癫痫
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const seizureCard: EmergencyScenario = {
  id: 'seizure',
  title: '癫痫发作',
  callerId: 'liu_fang',
  phoneNumber: '159****6666',
  baseStation: '西城区新街口附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 12,
    title: '抽搐/癫痫',
    chiefComplaint: '儿童突发全身抽搐、牙关紧闭、口吐白沫约3分钟',
    determinantCode: '12-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '抽搐从什么时候开始的？',
      '患者是否有意识？',
      '是否有发热？',
      '是否有癫痫病史？',
      '抽搐时有无受伤？',
    ],
  },

  openingLine: '救命！我孩子突然浑身抽搐，眼睛翻上去叫都叫不醒！嘴里往外冒白沫！你们快来啊！！！',

  fourElements: {
    address: {
      vague: '西城区新街口附近',
      partial: '新街口东街小学旁边的家属院',
      full: '新街口东街15号院3号楼4单元602室，楼下有一个晨光文具店',
    },
    contact: '159****6666',
    condition: {
      chiefComplaint: '我孩子下午突然发烧，刚才一下子浑身抽搐口吐白沫，怎么叫都没反应',
      age: '3岁',
      gender: '男性',
      consciousness: '完全没有意识，眼睛翻白',
      breathing: '感觉好像不喘气了......嘴闭得很紧',
      patientCount: '1人',
      additional: [
        '今天下午开始发烧，38度5',
        '从出生到现在第一次抽风',
        '刚才在沙发上玩突然就抽起来了',
        '抽搐大概持续了两三分钟了',
      ],
    },
    purpose: '孩子还在抽！你们快来救救他！怎么办！他会不会咬到舌头！',
  },

  // ============================================================
  // 手写对话脚本 — 刘芳（母亲）报告孩子癫痫发作
  // 来电者个性：尖叫哭喊、语速极快、不断问会不会死
  // 关系：母亲（对孩子了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['西城区新街口东街15号院3号楼4单元602室。'],
        tense: ['新街口东街！15号院！3号楼！4单元602！你们快来！'],
        panic: ['新街口东街！15号院！602！快来啊！'],
        lost: ['新街口……15号院……602……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '西城区新街口东街15号院3号楼4单元602室' },
      outburst: '孩子还在抽！！你们到底来不来啊！！',
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
        calm: ['楼下有个晨光文具店。'],
        tense: ['楼下晨光文具店！你们到了就能看到！'],
        panic: ['晨光文具店……楼下……'],
        lost: ['有个文具店……楼下……'],
      },
      fillTerminal: { address: '西城区新街口东街15号院3号楼4单元602室，楼下有晨光文具店' },
      calmReply: {
        operatorCalm: '好，晨光文具店，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['孩子下午发烧38度5，刚才突然浑身抽搐。', '眼睛翻上去，叫不醒，嘴里冒白沫。', '抽了两三分钟了没停。'],
        tense: ['孩子突然浑身抽搐！眼睛翻上去了！', '嘴里冒白沫！叫不醒！', '抽了两三分钟了没停！'],
        panic: ['浑身抽搐！！眼睛翻上去了！！', '口吐白沫！！叫不醒！！', '你们快来啊！！'],
        lost: ['孩子突然抽了……', '眼睛翻上去……口吐白沫……', '叫不醒……'],
      },
      fillTerminal: { chiefComplaint: '儿童突发全身抽搐，牙关紧闭，口吐白沫', patientGender: '男性' },
      outburst: '他还在抽！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。发烧后突然抽搐，眼睛翻白，口吐白沫——这些我记下了。别按住他，别往嘴里塞东西，按我说的做。',
        calm: '好……我不按他。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '孩子多大？',
      caller: {
        calm: ['3岁。'],
        tense: ['3岁！今年3岁！'],
        panic: ['3岁！！3岁！！'],
        lost: ['3岁……对，3岁。'],
      },
      fillTerminal: { patientAge: '3岁' },
      calmReply: {
        operatorCalm: '好，3岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '孩子还有意识吗？还在喘气吗？',
      caller: {
        calm: ['完全没有意识，眼睛翻白。', '嘴闭得很紧，感觉好像不喘气了。'],
        tense: ['没有意识！眼睛翻白！', '嘴闭得很紧！好像不喘气了！'],
        panic: ['没意识了！！眼睛翻白！！', '好像不喘气了！！你们快来！！', '他会不会死！！'],
        lost: ['没意识了……眼睛翻白……', '嘴闭得很紧……好像不喘气了……', '他是不是已经……'],
      },
      fillTerminal: { conscious: false, breathing: true },
      outburst: '他好像不喘气了！！你们快来啊！！他快死了！！',
      calmReply: {
        operatorCalm: '听我说。没有意识，嘴闭得紧——这我知道了。别按住他，别往嘴里塞东西。把周围尖锐的东西移开，我一步步告诉你怎么做。',
        calm: '好……我移开东西了。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['15977626666，就是这个号。'],
        tense: ['159……7762……6666！打这个就行！'],
        panic: ['159……这个手机！6666！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '159****6666' },
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
      id: 'mpds_seizure_duration',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '抽搐时间',
      questionText: '抽了多长时间了？',
      answer: '大概两三分钟了，一直没停',
      answerVague: '好一会儿了...',
      ramblingAnswer: '我看了下手机，从他开始抽到现在大概有两三分钟了。一开始我以为他在跟我闹着玩，后来发现不对，眼睛翻上去了，嘴里全是沫子，我才慌了打120的。现在还在抽，完全没停下来的意思。',
      panickedAnswer: '两三分钟了！还在抽！一直没停！他会不会这样抽死了啊！',
      reveals: ['additional'],
      judgment: {
        question: '持续抽搐超过2分钟意味着什么？',
        options: [
          { label: '持续抽搐超过2分钟 需紧急处理', fills: [{ field: 'conditionNote', value: '持续抽搐超过2分钟' }], isCorrect: true },
          { label: '刚抽几下 观察即可', fills: [{ field: 'conditionNote', value: '抽搐时间短' }], isCorrect: false },
          { label: '已经停止没事了', fills: [{ field: 'conditionNote', value: '抽搐已停止' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_seizure_fever',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '有无发热',
      questionText: '有没有发烧？',
      answer: '有，今天下午开始发烧，38度5',
      answerVague: '发烧了...下午就发烧...',
      panickedAnswer: '发烧！下午就开始烧了！是不是烧抽了？！热性惊厥是不是？！我在网上看到过！',
      ramblingAnswer: '下午摸他额头就烫手，量了38度5，后来玩着玩着突然就翻白眼抖起来了，我吓坏了。',
      reveals: [],
      judgment: {
        question: '发热伴随抽搐提示什么？',
        options: [
          { label: '热性惊厥 儿童常见', fills: [{ field: 'conditionNote', value: '发热伴随抽搐，热性惊厥可能性大' }], isCorrect: true },
          { label: '癫痫发作', fills: [{ field: 'conditionNote', value: '癫痫发作' }], isCorrect: false },
          { label: '脑膜炎', fills: [{ field: 'conditionNote', value: '警惕脑膜炎' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_seizure_injury',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '受伤',
      questionText: '抽搐时有没有摔倒或撞到？',
      answer: '没有，他在沙发上发作的，没掉下来',
      answerVague: '没掉下来...',
      panickedAnswer: '没有！他在沙发上！没摔着！',
      ramblingAnswer: '他当时就在沙发上玩平板，突然抽起来的，我赶紧把他旁边的东西都拿开了，没摔下去。',
      reveals: [],
    },
  ],

  guidance: {
    title: '抽搐发作急救指导',
    intro: '救护车已经在路上了。请您保持冷静，我来一步步指导您。',
    steps: [
      {
        id: 'sz_remove_danger',
        instruction: '把孩子周围尖锐的东西拿开，不要按住他',
        prompt: '第一步：移除危险',
        options: [
          '清空周围危险物品不要按压',
          '用力按住手脚',
          '往嘴里塞毛巾',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，抽搐时不要强行按压会受伤',
          incorrect: '不对，不要往嘴里塞任何东西也不要强行按压',
          callerCorrect: '我把茶几推开了，他碰不到东西了',
          callerIncorrect: '我按着他手脚了......他力气好大我快按不住了',
        },
      },
      {
        id: 'sz_side_lie',
        instruction: '让患者侧躺，头偏向一侧',
        prompt: '第二步：侧卧体位',
        options: [
          '让患者侧躺头偏向一侧',
          '让患者平躺',
          '让患者坐着',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，侧卧可以防止分泌物堵塞气道',
          incorrect: '不对，平躺可能导致分泌物堵塞气道',
          callerCorrect: '我把他侧过来了，嘴里的沫子流出来了',
          callerIncorrect: '他抽得太厉害了，我搬不动他',
        },
      },
      {
        id: 'sz_timing',
        instruction: '继续观察，如果持续抽搐超过5分钟要告诉我',
        prompt: '第三步：计时观察',
        options: [
          '计时观察抽搐持续时间',
          '不用管等他自己停',
          '用水泼醒他',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，及时记录持续时间很重要',
          incorrect: '不对，需要密切观察抽搐持续情况',
          callerCorrect: '我看着表呢，已经快一分钟了还在抖……',
          callerIncorrect: '我没数时间，就一直等着他停……',
        },
      },
      {
        id: 'sz_mg',
        instruction: '抽搐停止后，将患者摆成侧卧体位，头偏向一侧防误吸。',
        prompt: '实操环节：侧卧防误吸体位',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '抽搐停了！我把他侧过来了！',
          callerIncorrect: '我没敢动他，他就那么躺着……',
        },
        miniGame: {
          kind: 'stepOrder',
          title: '侧卧防误吸体位',
          instruction: '抽搐停止后，请按正确顺序将患者摆成侧卧防误吸体位。',
          passThreshold: 0.5,
          steps: [
            '将患者靠近自己一侧的手臂向上弯曲呈直角',
            '将患者另一侧手臂横放胸前',
            '将患者远侧腿的膝盖弯曲',
            '抓住远侧肩膀和膝盖，向自己一侧缓缓翻转',
            '调整头部后仰，保持气道通畅',
          ],
          feedback: { good: '抽搐停了！我把他侧过来了！', bad: '我没敢动他，他就那么躺着……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'sz_stop',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他...他不抽了！不动了！但是还是叫不醒！还在喘气！这是好了吗？',
    },
  ],

  outcomeNarrative: {
    good: '你让家属护住头、别硬按，抽了五分钟自己停了。诊断是热性惊厥，观察两天康复。',
    bad: '家属往孩子嘴里塞手指，被咬伤了；手上按得也太紧，胳膊软组织挫了伤。后来确认还是热性惊厥。',
    prank: '',
  },
}
