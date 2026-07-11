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
    determinantCode: '25-D-2',
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
    good: '调度员指导现场处置并安抚家属，患者送医后洗胃和心理干预，转至精神科治疗后逐渐康复',
    bad: '现场人员大声喊叫刺激了浅昏迷的患者导致其情绪激动挣扎，影响了抢救进程',
    prank: '',
  },
}
