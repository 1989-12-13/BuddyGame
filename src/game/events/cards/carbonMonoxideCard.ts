// ============================================================
// MPDS 协议卡片 8 — 一氧化碳/吸入/危险品
// 分诊级别: 红色
// ============================================================

import type { EmergencyScenario } from '../../types'

export const carbonMonoxideCard: EmergencyScenario = {
  id: 'carbon_monoxide',
  title: '一氧化碳中毒',
  callerId: 'long_jie',
  phoneNumber: '185****6666',
  baseStation: '昌平区回龙观附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 8,
    title: '一氧化碳/吸入/危险品',
    chiefComplaint: '在家中煤炉取暖后出现头晕恶心意识模糊',
    determinantCode: '8-D-2',
    hotCold: 'HOT',
    keyQuestions: [
      '是什么情况下出现的症状',
      '有没有使用煤炉或燃气',
      '房间通风情况如何',
      '有几个人有症状',
      '有没有意识不清的人',
    ],
  },

  openingLine: '喂我头好晕想吐浑身没劲我女朋友已经叫不醒了...我们家里生了煤炉是不是中毒了',

  fourElements: {
    address: {
      vague: '昌平区回龙观附近',
      partial: '回龙观龙跃苑东五区',
      full: '龙跃苑东五区12号楼4单元101室，回龙观地铁站东侧1000米',
    },
    contact: '185****6666',
    condition: {
      chiefComplaint: '煤炉取暖后头晕恶心浑身无力意识模糊',
      age: '28岁',
      gender: '男性',
      consciousness: '我自己还醒着但晕乎乎的我女朋友已经叫不醒了',
      breathing: '呼吸好像正常',
      patientCount: '1人',
      additional: [
        '家里生了煤炉取暖',
        '窗户关得很严',
        '三个人都有症状',
        '女朋友最严重',
      ],
    },
    purpose: '是不是煤气中毒了要不要开窗',
  },

  // ============================================================
  // 手写对话脚本 — 龙杰（室友）报告一氧化碳中毒
  // 来电者个性：语气迷糊、说不清来龙去脉、需要耐心引导
  // 关系：室友（对现场了解，自己也有症状）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['昌平区回龙观龙跃苑东五区12号楼4单元101室。'],
        tense: ['回龙观！龙跃苑东五区！12号楼！4单元101！'],
        panic: ['龙跃苑！12号楼！101！快来！'],
        lost: ['回龙观……龙跃苑……101……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '昌平区回龙观龙跃苑东五区12号楼4单元101室' },
      outburst: '我女朋友叫不醒了！你们到底来不来啊！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你晕，救护车已经在路上了。你先去把窗户打开，每一个问题都帮到你们。',
        calm: '好……好，我去开窗。',
        tense: '行……行，我开窗，你说。',
        panic: '我开着……你快说……',
        lost: '……好。',
      },
    },

    // --- 步骤1b：标志建筑 ---
    ask_landmark: {
      operator: '小区旁边有什么明显的标志吗？',
      caller: {
        calm: ['回龙观地铁站东侧1000米。'],
        tense: ['回龙观地铁站！东边1000米！'],
        panic: ['地铁站东边……1000米……你们到了就能找到！'],
        lost: ['地铁站旁边……我不确定……'],
      },
      fillTerminal: { address: '昌平区回龙观龙跃苑东五区12号楼4单元101室，回龙观地铁站东侧1000米' },
      calmReply: {
        operatorCalm: '好，地铁站东侧，记下了。你做得对，现在咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    // --- 步骤2：事件经过 ---
    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['家里生了煤炉取暖，窗户关着。', '早上起来头晕想吐，女朋友叫不醒了。'],
        tense: ['煤炉！烧了一晚上！窗户关着！', '我头晕！女朋友叫不醒了！', '是不是中毒了！'],
        panic: ['煤炉！！一整晚！！', '她叫不醒了！！我是不是也快不行了！！', '你们快来！！'],
        lost: ['煤炉……窗户关着……', '她叫不醒了……', '我也晕……'],
      },
      fillTerminal: { chiefComplaint: '煤炉取暖后头晕恶心意识模糊，女友昏迷', patientGender: '男性' },
      outburst: '她不行了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。煤炉取暖，窗户关着，你头晕，女朋友叫不醒——这些我记下了。你先开窗通风，按我说的做。',
        calm: '好……我去开窗。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    // --- 步骤3：患者年龄 ---
    step3_age: {
      operator: '你多大岁数？',
      caller: {
        calm: ['28岁。'],
        tense: ['28！我28！'],
        panic: ['28！！28岁！！'],
        lost: ['28……应该是28……'],
      },
      fillTerminal: { patientAge: '28岁' },
      calmReply: {
        operatorCalm: '好，28岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    // --- 步骤4：意识与呼吸 ---
    step4_vitals: {
      operator: '你还有意识吗？你女朋友呢？她还在喘气吗？',
      caller: {
        calm: ['我还醒着，但晕乎乎的。', '女朋友叫不醒了，但呼吸好像有。'],
        tense: ['我还醒着！但走路不稳！', '她叫不醒了！但好像还在喘气！'],
        panic: ['我还醒着！！但很晕！！', '她叫不醒了！！好像还在喘！！', '你们快来！！'],
        lost: ['我还醒着……但很晕……', '她叫不醒了……好像在喘……', '我也要倒了……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      outburst: '我也快站不住了！！你们快来啊！！',
      calmReply: {
        operatorCalm: '听我说。你还醒着，女朋友叫不醒但有呼吸——这我知道了。先开窗，把她搬到通风的地方，我一步步告诉你怎么做。',
        calm: '好……我去开窗搬人。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    // --- 联系电话 ---
    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['18577626666，就是这个号。'],
        tense: ['185……7762……6666！打这个！'],
        panic: ['185……这个手机！6666！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '185****6666' },
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
      id: 'mpds_co_environment',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '现场环境',
      questionText: '什么燃料多久了通风吗',
      answer: '煤炉烧了一晚上了窗户全关着',
      answerVague: '煤炉...一整晚...',
      ramblingAnswer: '昨天晚上太冷了生了煤炉睡觉的，门窗都关得严严实实的。早上起来我就觉得头晕恶心以为是感冒了，起来上了个厕所发现走路不稳，想叫我女朋友发现她怎么叫都叫不醒。这才反应过来是一氧化碳中毒了。',
      panickedAnswer: '煤炉！烧了一晚上了！窗户都关着！我女朋友叫不醒了怎么办！',
      reveals: ['additional'],
      judgment: {
        question: '密闭空间煤炉燃烧，多人出现相似症状，考虑什么？',
        options: [
          { label: '一氧化碳中毒，立即开窗通风', fills: [{ field: 'conditionNote', value: '一氧化碳中毒，密闭空间煤炉燃烧' }], isCorrect: true },
          { label: '食物中毒，需询问吃了什么', fills: [{ field: 'conditionNote', value: '可能是食物中毒' }], isCorrect: false },
          { label: '感冒引起的流感症状', fills: [{ field: 'conditionNote', value: '可能是流感' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_co_count',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 1,
      stressEffect: -5,
      label: '人数',
      questionText: '一共有几个人有症状谁最严重',
      answer: '三个人我女朋友最严重我和另一个室友头晕想吐',
      answerVague: '三个...我女朋友最重...',
      ramblingAnswer: '我们三个人合租的，我女朋友、我、还有另一个室友。我和室友就是头晕想吐浑身没劲，但是我女朋友特别严重，她躺在床上怎么叫都不醒，呼吸倒是有但是叫不醒。',
      panickedAnswer: '三个人！三个！我女朋友最严重叫不醒了！她是不是要死了！',
      reveals: ['additional'],
      judgment: {
        question: '三人同时出现症状，一人意识丧失，判断为？',
        options: [
          { label: '群体性一氧化碳中毒，需紧急处理', fills: [{ field: 'conditionNote', value: '群体性一氧化碳中毒，多人受累' }], isCorrect: true },
          { label: '普通感冒，三人同时感染', fills: [{ field: 'conditionNote', value: '可能是感冒' }], isCorrect: false },
          { label: '食物中毒，共同进食所致', fills: [{ field: 'conditionNote', value: '食物中毒可能' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '一氧化碳中毒急救',
    intro: '立即打开所有门窗通风。能行动的人先把不能动的人搬到通风处。',
    steps: [
      {
        id: 'co_ventilate',
        instruction: '立即打开所有门窗通风',
        prompt: '第一步：通风',
        options: [
          '打开门窗通风',
          '先打电话再通风',
          '开空调换气',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！立即开窗通风，降低一氧化碳浓度。',
          incorrect: '不对！必须立即开窗通风，每一秒都很重要！',
          callerCorrect: '我开了！窗户全开了！我室友去开大门了！风进来了！',
          callerIncorrect: '我还在打电话...还没来得及开窗...我女朋友好像呼吸变慢了...',
        },
      },
      {
        id: 'co_move',
        instruction: '把不能动的人搬到空气流通的地方',
        prompt: '第二步：撤离',
        options: [
          '把人搬到通风处',
          '原地等待',
          '继续睡觉',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！尽快把意识不清的人转移到通风处。',
          incorrect: '不对！必须立即把患者转移到通风处，原地等待会加重中毒。',
          callerCorrect: '我和室友一起把我女朋友抬到门口走廊上了，她好像动了一下！',
          callerIncorrect: '我让她在床上躺着...她不动了...我害怕...',
        },
      },
      {
        id: 'co_position',
        instruction: '意识不清的人侧躺',
        prompt: '第三步：体位',
        options: [
          '侧躺保持气道通畅',
          '平躺',
          '坐起来',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！侧躺可以防止呕吐物窒息。',
          incorrect: '不对。意识不清者应侧躺，防止呕吐物堵塞气道。',
          callerCorrect: '我把她侧过来了！她的呼吸好像顺了一点...',
          callerIncorrect: '她平躺着...刚才吐了一点...吐到嘴里了...怎么办啊她会不会呛到...',
        },
      },
      {
        id: 'carbon_monoxide_mg',
        instruction: '将患者摆成侧卧复苏体位，头偏向一侧保持呼吸道通畅。',
        prompt: '实操环节：侧卧复苏体位',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我把他侧过来了，头也偏了！他呼吸声好像大了！',
          callerIncorrect: '我摆的位置不太对，他好像更难受了……',
        },
        miniGame: {
          kind: 'stepOrder',
          title: '侧卧复苏体位',
          instruction: '将患者摆成侧卧复苏体位。请按正确顺序点击操作步骤。',
          passThreshold: 0.5,
          steps: [
            '将患者靠近自己一侧的手臂向上弯曲呈直角',
            '将患者另一侧手臂横放胸前',
            '将患者远侧腿的膝盖弯曲',
            '抓住远侧肩膀和膝盖，向自己一侧缓缓翻转',
            '调整头部后仰，保持气道通畅',
          ],
          feedback: { good: '我把他侧过来了，头也偏了！他呼吸声好像大了！', bad: '我摆的位置不太对，他好像更难受了……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'co_worsen',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '我室友刚才还能走两步现在也站不住了......窗户都打开了但是他们还躺在地上不动啊',
    },
  ],

  outcomeNarrative: {
    good: '你听出屋里不对劲，先让他们开窗、把人挪出去。三个人做高压氧之后都醒了，恢复得不错。',
    bad: '家属先忙着打电话，没顾上开窗。三个人中毒都更深，最重的那个后来出现迟发性脑病。',
    prank: '',
  },
}
