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
    determinantCode: '22-C-2',
    hotCold: 'HOT',
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
    good: '调度员保持与被困者通话稳定情绪，消防在15分钟后到达成功打开电梯门。孕妇送医检查无大碍。',
    bad: '被困者强行扒门导致电梯保护装置启动，维修时间进一步延长。孕妇因缺氧和过度紧张送医后需住院观察。',
    prank: '',
  },
}
