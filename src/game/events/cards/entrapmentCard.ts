// ============================================================
// MPDS 协议卡片 22 — 无法进入的现场/被困
// 分诊级别: 黄色
// ============================================================

import type { EmergencyScenario } from '../../types'

export const entrapmentCard: EmergencyScenario = {
  id: 'entrapment',
  title: '电梯困人',
  callerId: 'wei_qiang',
  phoneNumber: '139****3333',
  baseStation: '海淀区中关村西区附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 22,
    title: '无法进入的现场/被困',
    chiefComplaint: '电梯故障停运，内有孕妇呼吸困难、情绪激动',
    determinantCode: '22-D-2',
    hotCold: 'COLD',
    keyQuestions: [
      '被困在哪里？',
      '有多少人被困？',
      '有没有人受伤或生病？',
      '通风情况如何？',
      '有没有紧急联系方式？',
    ],
  },

  openingLine: '120吗！我们被困在电梯里了！里面有个孕妇说她喘不上气！电梯已经停了快20分钟了！维修的人还没来！',

  fourElements: {
    address: {
      vague: '海淀区中关村西区附近',
      partial: '中关村西区银科大厦',
      full: '银科大厦东侧货梯，中关村地铁站E口出来向西走200米',
    },
    contact: '139****3333',
    condition: {
      chiefComplaint: '电梯卡在两层楼之间里面有一个孕妇说胸闷头晕',
      age: '30岁左右',
      gender: '女性',
      consciousness: '清醒但脸色很差',
      breathing: '说喘不上气呼吸急促',
      patientCount: '1人',
      additional: [
        '电梯卡在3楼和4楼之间',
        '孕妇怀孕大概7个月',
        '通风很差里面很闷',
        '已经困了20分钟',
        '其他3个人暂时没事',
      ],
    },
    purpose: '孕妇快不行了你们快想办法把她弄出去',
  },

  // ============================================================
  // 手写对话脚本 — 魏强（家属）报告电梯困人
  // 来电者个性：语气焦急但积极配合、反复催促快点来
  // 关系：家属（对孕妇了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，大厦名和位置。',
      caller: {
        calm: ['海淀区中关村西区银科大厦东侧货梯。'],
        tense: ['中关村西区！银科大厦！东侧货梯！你们快来！'],
        panic: ['银科大厦！货梯！快来！'],
        lost: ['中关村……银科大厦……货梯……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '海淀区中关村西区银科大厦东侧货梯' },
      outburst: '你们到底还有多久到啊！孕妇快撑不住了！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，消防已经在路上了。咱接着说，每个问题都帮到她。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '大厦旁边有什么明显的标志吗？',
      caller: {
        calm: ['中关村地铁站E口出来向西走200米。'],
        tense: ['地铁E口！向西200米！你们到了就能看到！'],
        panic: ['地铁E口……西边200米……'],
        lost: ['地铁口旁边……向西……'],
      },
      fillTerminal: { address: '海淀区中关村西区银科大厦东侧货梯，中关村地铁站E口出来向西走200米' },
      calmReply: {
        operatorCalm: '好，地铁E口，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['电梯卡在3楼和4楼之间。', '里面有个孕妇说胸闷头晕。', '已经困了20分钟了。'],
        tense: ['电梯卡住了！3楼和4楼之间！', '孕妇说胸闷头晕！喘不上气！', '困了20分钟了！'],
        panic: ['电梯卡住了！！孕妇喘不上气！！', '困了20分钟了！！你们快来！！', '她快不行了！！'],
        lost: ['电梯卡住了……', '孕妇喘不上气……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '电梯困人，孕妇胸闷头晕，通风不良', patientGender: '女性' },
      outburst: '她快晕过去了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。电梯卡住，孕妇胸闷——这些我记下了。别扒门，按我说的做。',
        calm: '好……我不扒门。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '她多大岁数？',
      caller: {
        calm: ['30岁左右。'],
        tense: ['30岁左右！怀孕7个月！'],
        panic: ['30岁！！怀孕7个月！！'],
        lost: ['30岁……怀孕7个月……'],
      },
      fillTerminal: { patientAge: '约30岁' },
      calmReply: {
        operatorCalm: '好，30岁左右，怀孕7个月，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '她还清醒吗？能说话吗？',
      caller: {
        calm: ['清醒，但脸色很差。', '说喘不上气，呼吸急促。'],
        tense: ['清醒！但脸色很差！', '喘不上气！呼吸很急！'],
        panic: ['清醒！！但脸色很差！！', '喘不上气！！呼吸急促！！', '你们快来！！'],
        lost: ['还清醒……但脸色很差……', '喘不上气……', '她快晕了……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，还清醒，这我知道了。让她坐低一些，别站起来，给她扇风。消防马上到。',
        calm: '好……我让她坐下了。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13977623333，就是这个号。'],
        tense: ['139……7762……3333！打这个就行！'],
        panic: ['139……这个手机！3333！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '139****3333' },
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
      id: 'mpds_trap_env',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -8,
      label: '被困情况怎么样？',
      questionText: '电梯里通风怎么样？大家都能正常呼吸吗？',
      answer: '通风很差很闷孕妇最严重说头晕想吐',
      answerVague: '很闷...孕妇最难受...',
      ramblingAnswer: '电梯里又闷又热，大家都开始出汗了。那个孕妇说胸闷头晕恶心想吐，靠着墙坐在地上，脸色很白。其他三个人目前还算好但是也都觉得闷。我们已经打了电梯维修电话但是他们说还要二三十分钟才能到。',
      panickedAnswer: '孕妇不行了！！她蹲在地上说喘不上气！！快想办法让她出去！！其他人也开始慌了！！',
      reveals: ['additional'],
      judgment: {
        question: '密闭空间内孕妇出现呼吸困难，首要处理是什么？',
        options: [
          { label: '保持通风安抚情绪并催促救援', fills: [{ field: 'conditionNote', value: '密闭空间缺氧需要尽快救援' }], isCorrect: true },
          { label: '强行扒门逃生', fills: [{ field: 'conditionNote', value: '强行扒门可能导致电梯坠落' }], isCorrect: false },
          { label: '给孕妇喂水', fills: [{ field: 'conditionNote', value: '给孕妇喂水' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_trap_preg',
      category: 'consciousness',
      tier: 'important',
      timeCost: 2,
      stressEffect: -5,
      label: '孕妇状况？',
      questionText: '孕妇有没有出血或者肚子疼？',
      answer: '没有出血就是说闷得难受',
      answerVague: '没有出血...就是喘不上气...',
      ramblingAnswer: '她说肚子没有疼也没有出血，就是心慌头晕喘不上气。我让她靠着墙坐下来了，给她扇风。她老公也在旁边一直安慰她。她说以前没有过这种情况但电梯里真的太闷了。',
      panickedAnswer: '没有血！但是她说头晕得不行了快要晕过去了！！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '被困电梯指导',
    intro: '消防救援已经在路上了。请保持冷静按我说的做。',
    steps: [
      {
        id: 'trap_keep_calm',
        instruction: '保持冷静不要强行扒门，电梯可能突然启动很危险。',
        prompt: '第一步：保持冷静',
        options: [
          '不要扒门等待救援',
          '用力扒开电梯门',
          '从顶上爬出去',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！等待专业人员救援最安全。',
          incorrect: '不对！强行扒门非常危险可能导致电梯坠落。',
          callerCorrect: '好的我们不乱动等着！但是孕妇越来越难受了怎么办！',
          callerIncorrect: '我们已经把门扒开一条缝了......但是外面是墙啊！',
        },
      },
      {
        id: 'trap_air',
        instruction: '尽量让孕妇坐低一些保持通风，可以用手或纸扇风。',
        prompt: '第二步：改善通风',
        options: [
          '让孕妇坐低保持通风',
          '让孕妇站起来活动',
          '大家挤在一起保暖',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！坐低可以减少耗氧量。',
          incorrect: '不对。站起来会增加耗氧量应该让她保持低姿势。',
          callerCorrect: '她坐地上了我一直在给她扇风她说好一点了！',
          callerIncorrect: '我让她站起来走走......她说更晕了',
        },
      },
      {
        id: 'trap_monitor',
        instruction: '持续观察孕妇的意识，如果她意识变差立即告诉我。',
        prompt: '第三步：观察意识',
        options: [
          '密切观察孕妇意识',
          '大家一起聊天分散注意',
          '让孕妇睡觉休息',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！意识变化是重要的预警信号。',
          incorrect: '不对。需要密切观察孕妇的意识状态不能放松。',
          callerCorrect: '她还能跟我说话，说比刚才好一点了，我一直在跟她说话让她保持清醒！',
          callerIncorrect: '她好像快睡着了......我让她睡一下应该没事吧？',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'trap_rescue',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'caller_panic',
      dialogue: '听到外面有动静了！是消防员来了吗！！孕妇说还能撑住！你们快一点！',
    },
  ],

  outcomeNarrative: {
    good: '你一直没挂电话，陪着她把呼吸放慢。消防十五分钟打开门，送医检查没大碍。',
    bad: '被困的人自己扒门，触发了保护装置，维修拖得更久。孕妇缺氧加上过度紧张，送医后住了一阵。',
    prank: '',
  },
}
