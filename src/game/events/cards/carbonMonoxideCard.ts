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
    good: '调度员指导开窗通风和转移患者，三人送医后经高压氧治疗全部清醒恢复良好',
    bad: '家属先打电话求助而未立即通风导致三人中毒加深，最严重的患者出现迟发性脑病',
    prank: '',
  },
}
