// ============================================================
// MPDS 协议卡片 3 — 动物咬伤/攻击
// 分诊级别: 绿色（轻伤）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const animalBiteCard: EmergencyScenario = {
  id: 'animal_bite',
  title: '狗咬伤',
  callerId: 'song_na',
  phoneNumber: '159****2222',
  baseStation: '朝阳区潘家园附近',
  isPrank: false,
  correctTriage: 'green',

  mpdsCard: {
    number: 3,
    title: '动物咬伤/攻击',
    chiefComplaint: '儿童被流浪狗咬伤小腿，出血不止但非大量',
    determinantCode: '3-C-3',
    hotCold: 'COLD',
    keyQuestions: [
      '什么动物咬伤的',
      '咬伤部位在哪里',
      '伤口有多大是否在出血',
      '动物是家养还是流浪',
      '伤者有无神经症状或恐水',
    ],
  },

  openingLine: '120吗！我孩子在小区被一条流浪狗咬了！小腿上两个牙印一直在流血！但狗已经跑了！',

  fourElements: {
    address: {
      vague: '朝阳区潘家园附近',
      partial: '潘家园旧货市场南门对面小区',
      full: '潘家园南里小区7号楼前小花园，潘家园地铁站C口出来向南走300米',
    },
    contact: '159****2222',
    condition: {
      chiefComplaint: '孩子在小区花园玩被一条黄色流浪狗咬了左小腿',
      age: '7岁',
      gender: '男性',
      consciousness: '清醒，在哭',
      breathing: '哭得喘不过气',
      patientCount: '1人',
      additional: [
        '左小腿后面有两个牙印',
        '伤口在渗血但不是喷出来的',
        '狗是流浪狗已经跑掉了',
        '不知道狗有没有打疫苗',
      ],
    },
    purpose: '要不要打狂犬疫苗现在怎么处理伤口',
  },

  // ============================================================
  // 手写对话脚本 — 宋娜（母亲）报告孩子被狗咬伤
  // 来电者个性：声音发抖语速极快、不停哭喊
  // 关系：母亲（对孩子了解）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['朝阳区潘家园南里小区7号楼前小花园。'],
        tense: ['潘家园！潘家园南里！7号楼前面小花园！你们快来！'],
        panic: ['潘家园南里！7号楼！花园！快来啊！'],
        lost: ['潘家园……南里……花园……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '朝阳区潘家园南里小区7号楼前小花园' },
      outburst: '你们到底来不来啊！孩子还在流血！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。咱接着说，每个问题都帮到孩子。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    // --- 步骤1b：标志建筑 ---
    ask_landmark: {
      operator: '小区旁边有什么明显的标志吗？',
      caller: {
        calm: ['潘家园地铁站C口出来向南走300米。'],
        tense: ['地铁C口！向南300米！就在路东边！'],
        panic: ['地铁C口……南边300米……你们到了就能看到！'],
        lost: ['地铁口……旁边……我不确定了……'],
      },
      fillTerminal: { address: '朝阳区潘家园南里小区7号楼前小花园，潘家园地铁站C口向南300米' },
      calmReply: {
        operatorCalm: '好，地铁站C口，我记下了。你做得很好，咱继续。',
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
        calm: ['孩子在小区花园玩，被一条流浪狗咬了左小腿。', '两个牙印，在渗血，狗已经跑了。'],
        tense: ['孩子被狗咬了！左小腿！', '两个牙印在流血！狗跑了！', '是一条脏兮兮的流浪狗！'],
        panic: ['被狗咬了！！左腿！！在流血！！', '狗跑了！！是流浪狗！！', '会不会得狂犬病啊！！'],
        lost: ['孩子被咬了……在流血……', '狗跑了……', '怎么办啊……'],
      },
      fillTerminal: { chiefComplaint: '儿童被流浪狗咬伤左小腿，伤口渗血', patientGender: '男性' },
      outburst: '孩子一直在哭！！血还在流！！你们快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。孩子被流浪狗咬了左腿，在渗血——这些我记下了。你按我说的处理伤口，每一步都很重要。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    // --- 步骤3：患者年龄 ---
    step3_age: {
      operator: '孩子多大？',
      caller: {
        calm: ['7岁。'],
        tense: ['7岁！今年7岁！'],
        panic: ['7岁！！7岁！！'],
        lost: ['7岁……对，7岁。'],
      },
      fillTerminal: { patientAge: '7岁' },
      calmReply: {
        operatorCalm: '好，7岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    // --- 步骤4：意识与呼吸 ---
    step4_vitals: {
      operator: '孩子清醒吗？呼吸怎么样？',
      caller: {
        calm: ['清醒，在哭。', '哭得喘不过气，但没有别的问题。'],
        tense: ['清醒！一直在哭！', '哭得喘不过气来！但没晕！'],
        panic: ['在哭！！清醒！！哭得喘不上气！！', '没有晕！！你们快来！！'],
        lost: ['在哭……醒着……', '哭得喘不过气……', '吓死我了……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，孩子还清醒，这我知道了。先别慌，按我说的处理伤口就行。',
        calm: '好……我听着。',
        tense: '好，你说，怎么做？',
        panic: '怎么做……你快说……',
        lost: '……我试试……',
      },
    },

    // --- 联系电话 ---
    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['15977622222，就是这个号。'],
        tense: ['159……7762……2222！打这个就行！'],
        panic: ['159……这个手机！2222！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '159****2222' },
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
      id: 'mpds_bite_wound',
      category: 'bleeding',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '伤口情况',
      questionText: '伤口深不深血流得多不多',
      answer: '两个牙印破皮了在渗血但不算太多',
      answerVague: '破了...在流血...',
      ramblingAnswer: '裤子上破了两小洞，挽起来看小腿后面有两个牙印有点深好像咬进去了，周围一圈已经开始肿了发红。血在往外渗但是没有一直流，我用纸巾按了一下纸巾上有血但不算太多。',
      panickedAnswer: '破了！流血了！两个牙印！狗跑了！要不要打针！',
      reveals: ['additional'],
    },
    {
      id: 'mpds_bite_animal',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '动物情况',
      questionText: '狗是家养的还是流浪狗',
      answer: '流浪狗，脖子上没有牌，我们小区经常看到它',
      answerVague: '流浪狗...没有主人...',
      ramblingAnswer: '流浪狗，脖子上没有牌子的，毛脏兮兮的。我们小区经常看到它在垃圾桶那边翻吃的，保安赶过几次但也没抓住。今天孩子在花园玩球，那狗突然窜出来咬了他一口就跑掉了。',
      panickedAnswer: '流浪狗！脏兮兮的！咬完就跑掉了！孩子会不会得狂犬病啊！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '动物咬伤紧急处理',
    intro: '伤口需要处理但要先止血。请不要自己用嘴巴吸伤口。',
    steps: [
      {
        id: 'bite_wash',
        instruction: '用流动清水和肥皂冲洗伤口至少15分钟',
        prompt: '第一步：冲洗伤口',
        options: [
          '肥皂水冲洗15分钟',
          '用酒精直接消毒',
          '用嘴巴吸出毒血',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！肥皂水冲洗可以有效减少狂犬病毒量。',
          incorrect: '不对。酒精直接刺激伤口会引起剧痛，吸吮伤口可能造成二次感染。',
          callerCorrect: '好我在洗！孩子哭得很厉害但是我在冲，肥皂水，我计时了！',
          callerIncorrect: '我倒了酒精上去...孩子哭得撕心裂肺的...我是不是做错了？',
        },
      },
      {
        id: 'bite_stop_bleeding',
        instruction: '冲洗后找到伤口近心端的动脉止血点，用干净纱布持续用力按压',
        prompt: '第二步：近心端动脉止血',
        options: [
          '按压近心端动脉止血',
          '涂抹红药水',
          '包上创可贴',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！找到近心端动脉按压止血最有效。',
          incorrect: '不对。红药水和创可贴不适用于动物咬伤伤口。',
          callerCorrect: '我在伤口上方找到了动脉的位置按住了！血基本止住了！',
          callerIncorrect: '我涂了红药水，现在伤口一片红也看不清楚还在不在流血。',
        },
      },
      {
        id: 'bite_hospital',
        instruction: '处理后尽快去医院打狂犬疫苗',
        prompt: '第三步：就医接种疫苗',
        options: [
          '去医院打狂犬疫苗和破伤风',
          '在家观察两天再去',
          '涂碘伏就可以了',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！流浪狗咬伤必须尽快接种狂犬疫苗和破伤风疫苗。',
          incorrect: '不对。流浪狗咬伤不能观察等待，必须尽快就医接种疫苗。',
          callerCorrect: '好的我知道了，冲洗完了我马上带孩子去最近的医院！',
          callerIncorrect: '我想先观察两天看看...万一不打针应该也没事吧？',
        },
      },
      {
        id: 'bite_position_game',
        instruction: '伤者小腿被狗咬伤出血，请选择正确的按压止血位置。',
        prompt: '实操环节：选择止血位置',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '正确！小腿出血应从大腿根部股动脉近心端止血。',
          incorrect: '不对。小腿动脉出血需要在大腿根部近心端股动脉处按压。',
          callerCorrect: '我在大腿根部按住了！血果然不流了！',
          callerIncorrect: '我按在伤口上纱布很快就湿透了...',
        },
        miniGame: {
          kind: 'locationSelect',
          title: '腿部止血位置',
          instruction: '伤者小腿被狗咬伤出血，应该在哪个位置按压止血？',
          passThreshold: 0.5,
          bodyPart: 'leg',
          woundDesc: '小腿被狗咬伤，活动性出血',
          options: [
            '大腿根部（股动脉近心端）',
            '小腿伤口处',
            '膝盖窝',
          ],
          correctIndex: 0,
          feedback: { good: '我在大腿根部按住了！血果然不流了！', bad: '我按在伤口上纱布很快就湿透了...' },
        },
      },
    ],
  },

  specialEvents: [],

  outcomeNarrative: {
    good: '你让孩子别揉伤口，先用肥皂水一遍遍冲。到医院把狂犬和破伤风都补上，伤口一周就长好了。',
    bad: '家属拿酒精直接往伤口上倒，孩子疼得直哭闹，伤口被刺激得更难处理，冲洗的最佳时间也过去了。',
    prank: '',
  },
}
