// ============================================================
// MPDS 协议卡片 25 — 精神问题/自杀企图
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const psychiatricCard: EmergencyScenario = {
  id: 'psychiatric',
  title: '自杀倾向',
  callerId: 'deng_yu',
  phoneNumber: '150****1234',
  baseStation: '朝阳区双井附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 25,
    title: '精神问题/自杀企图',
    chiefComplaint: '年轻女性因抑郁症发作微信告知朋友准备服药自杀现已失联',
    determinantCode: '25-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '患者现在在哪里',
      '有没有已经服用了什么药物',
      '什么时候失联的',
      '有没有遗书或遗言',
      '有没有精神疾病史',
    ],
  },

  openingLine: '喂我朋友刚才给我发微信说不想活了说她吃了好多安眠药让我帮忙照顾她猫然后就不回消息了',

  fourElements: {
    address: {
      vague: '朝阳区双井附近',
      partial: '双井桥北',
      full: '双井桥北天之骄子小区3号楼1单元1502室',
    },
    contact: '150****1234',
    condition: {
      chiefComplaint: '朋友微信发消息说要自杀说吃了药不回了',
      age: '24岁',
      gender: '女性',
      consciousness: '发消息时还清醒但现在已经联系不上了',
      breathing: '未知',
      patientCount: '1人',
      additional: [
        '大约十分钟前发的微信',
        '说有抑郁症很久了',
        '吃了安眠药具体多少不知道',
        '说她对不起大家',
        '我已经在去她家的路上了',
      ],
    },
    purpose: '她吃了药联系不上了你们快来救她',
  },

  // ============================================================
  // 手写对话脚本 — 邓宇（朋友）报告朋友自杀倾向
  // 来电者个性：急促压抑、不断说"她在哪"
  // 关系：朋友（对患者了解一部分）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['朝阳区双井桥北天之骄子小区3号楼1单元1502室。'],
        tense: ['双井桥北！天之骄子！3号楼！1502！你们快来！'],
        panic: ['双井！天之骄子！1502！快来！'],
        lost: ['双井……天之骄子……1502……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '朝阳区双井桥北天之骄子小区3号楼1单元1502室' },
      outburst: '她不回消息了！！你们到底来不来啊！！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。咱接着说，每个问题都帮到她。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '小区旁边有什么明显的标志吗？',
      caller: {
        calm: ['双井桥北侧路东。'],
        tense: ['双井桥北！路东！你们到了就能看到！'],
        panic: ['双井桥北……路东……'],
        lost: ['双井桥旁边……路东……'],
      },
      fillTerminal: { address: '朝阳区双井桥北天之骄子小区3号楼1单元1502室，双井桥北侧路东' },
      calmReply: {
        operatorCalm: '好，双井桥北，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['朋友微信发消息说不想活了，说吃了安眠药。', '让我照顾她猫，然后就不回消息了。', '大概十分钟前发的。'],
        tense: ['朋友说要自杀！吃了安眠药！', '发完消息就不回了！', '大概十分钟前！'],
        panic: ['她吃药了！！不回消息了！！', '十分钟前发的！！你们快来！！', '她会不会已经死了！！'],
        lost: ['朋友说要自杀……', '吃了药……不回了……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '朋友微信告知服药自杀后失联', patientGender: '女性' },
      outburst: '她不回消息了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。朋友说吃了安眠药，失联十分钟——这些我记下了。你到她家了吗？能进去吗？',
        calm: '好……我有密码锁密码。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '她多大岁数？',
      caller: {
        calm: ['24岁。'],
        tense: ['24！她24！'],
        panic: ['24！！24岁！！'],
        lost: ['24……应该是24……'],
      },
      fillTerminal: { patientAge: '24岁' },
      calmReply: {
        operatorCalm: '好，24岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '你进去了吗？她还有意识吗？还在喘气吗？',
      caller: {
        calm: ['进来了。她躺在床上叫不醒。', '呼吸特别浅，几乎听不到。'],
        tense: ['进来了！叫不醒！', '呼吸特别浅！几乎听不到！'],
        panic: ['叫不醒了！！呼吸好浅！！', '你们快来！！', '她会不会死！！'],
        lost: ['进来了……叫不醒……', '呼吸好浅……几乎听不到……', '她不会……不会吧……'],
      },
      fillTerminal: { conscious: false, breathing: true },
      outburst: '她呼吸越来越弱了！！你们快来啊！！',
      calmReply: {
        operatorCalm: '听我说。叫不醒，呼吸很浅——这我知道了。别催吐，让她侧躺，把药瓶收好。我一步步告诉你怎么做。',
        calm: '好……我翻她侧躺。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['15077621234，就是这个号。'],
        tense: ['150……7762……1234！打这个就行！'],
        panic: ['150……这个手机！1234！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '150****1234' },
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
      id: 'mpds_psych_drug',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '药物信息',
      questionText: '知不知道她吃了什么药吃了多少？',
      answer: '她说吃了安眠药但不知道吃了多少',
      answerVague: '安眠药...不知道多少...',
      ramblingAnswer: '她最后一条微信说吃了好多安眠药要去睡觉了让我照顾她的小猫。我问她吃了什么她没回了我打电话也没人接。她之前一直有抑郁症在吃药治疗但最近说停药了因为觉得没效果。我不知道她家里有没有药我也不知道具体什么药。',
      panickedAnswer: '安眠药！她说吃了好多安眠药！但是不知道是什么安眠药！',
      reveals: ['additional'],
      judgment: {
        question: '根据描述判断最佳处置方案是什么？',
        options: [
          { label: '服药自杀失联需立即派车并协助破门', fills: [{ field: 'conditionNote', value: '服药自杀失联需紧急破门救助' }], isCorrect: true },
          { label: '先尝试电话联系不急着派车', fills: [{ field: 'conditionNote', value: '尝试电话联系' }], isCorrect: false },
          { label: '可能是恶作剧先观察', fills: [{ field: 'conditionNote', value: '怀疑是恶作剧' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_psych_key',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '地址确认',
      questionText: '有没有她家钥匙或者能不能叫物业开门？',
      answer: '我有她家密码锁的密码可以进去',
      answerVague: '有...密码...',
      ramblingAnswer: '有的有的她之前告诉过我她家门锁密码因为她经常忘带钥匙让我帮忙。密码是她的生日后面加两个零。我已经在路上了大概还有五分钟到她家。',
      panickedAnswer: '有密码！我马上到了！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '自杀倾向现场指导',
    intro: '请您保持冷静到达后先观察情况不要刺激患者。救护车已经在路上。',
    steps: [
      {
        id: 'psych_enter',
        instruction: '想办法进入房间，先确保安全。',
        prompt: '第一步：进场',
        options: [
          '进入房间观察患者状态',
          '在门口大喊',
          '直接破门',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。进入房间观察患者状态，同时注意周围环境安全。',
          incorrect: '不对。应冷静进入房间观察情况，大喊可能刺激患者情绪。',
          callerCorrect: '我进来了密码打开了！她躺在床上！',
          callerIncorrect: '我在门口大喊了几声她没回应，我不知道该不该破门。',
        },
      },
      {
        id: 'psych_side',
        instruction: '如果患者失去意识让她侧躺。',
        prompt: '第二步：侧卧',
        options: [
          '侧躺保护气道',
          '让她坐起来',
          '给她水喝',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。侧躺可以防止呕吐物阻塞气道。',
          incorrect: '不对。失去意识时不能喂水，侧躺保护气道最重要。',
          callerCorrect: '我把她翻过来侧躺着了她没什么反应但是有呼吸。',
          callerIncorrect: '我给她喝了点水她呛到了咳了几下。',
        },
      },
      {
        id: 'psych_collect',
        instruction: '收集药瓶和遗书交给医生。',
        prompt: '第三步：收集',
        options: [
          '收集药瓶和遗书',
          '扔掉证据',
          '不用管',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。收集药瓶和遗书对医生抢救和治疗非常有帮助。',
          incorrect: '不对。药瓶上的信息对确定药物种类和剂量至关重要。',
          callerCorrect: '我看到了床头柜上有两个空药瓶还有一张纸条我收好了。',
          callerIncorrect: '我没管那些东西直接把她抱到客厅了。',
        },
      },
      {
        id: 'psych_mg',
        instruction: '将患者摆成侧卧体位，头偏向一侧保持呼吸道通畅。',
        prompt: '实操环节：安全侧卧体位',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '他侧躺着了，情绪好像稳定了一些……',
          callerIncorrect: '他不肯配合一直动……',
        },
        miniGame: {
          kind: 'stepOrder',
          title: '安全侧卧体位',
          instruction: '请按正确顺序将患者摆成安全侧卧体位。',
          passThreshold: 0.5,
          steps: [
            '将患者靠近自己一侧的手臂向上弯曲呈直角',
            '将患者另一侧手臂横放胸前',
            '将患者远侧腿的膝盖弯曲',
            '抓住远侧肩膀和膝盖，向自己一侧缓缓翻转',
            '调整头部后仰，保持气道通畅',
          ],
          feedback: { good: '他侧躺着了，情绪好像稳定了一些……', bad: '他不肯配合一直动……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'psych_nobreath',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '我进来了！她躺在床上叫不醒！呼吸特别浅几乎听不到！旁边有空的艾司唑仑瓶子！',
    },
  ],

  outcomeNarrative: {
    good: '你在电话里把家属的情绪先稳住，也交代了现场该做什么。送医洗胃加心理干预，之后转到精神科继续治。',
    bad: '现场的人对着浅昏迷的患者大声喊，人激动起来挣扎，抢救没法顺顺当当做下去。',
    prank: '',
  },
}
