// ============================================================
// MPDS 协议卡片 5 — 背痛（非创伤/非近期）
// 分诊级别: 绿色
// ============================================================

import type { EmergencyScenario } from '../../types'

export const backPainCard: EmergencyScenario = {
  id: 'back_pain',
  title: '急性腰扭伤',
  callerId: 'tian_feng',
  phoneNumber: '137****4444',
  baseStation: '丰台区科技园附近',
  isPrank: false,
  correctTriage: 'green',

  mpdsCard: {
    number: 5,
    title: '背痛（非创伤/非近期）',
    chiefComplaint: '中年男性搬重物后突然腰痛无法直腰站立',
    determinantCode: '5-C-1',
    hotCold: 'COLD',
    keyQuestions: [
      '背部疼痛从什么时候开始的',
      '是怎么引起的',
      '疼痛在哪个位置',
      '有没有放射到腿部',
      '有没有腿部麻木或无力',
    ],
  },

  openingLine: '120吗，我刚才搬了一个箱子腰突然咔嚓一声响然后就不敢动了，一动就疼得直冒冷汗',

  fourElements: {
    address: {
      vague: '丰台区科技园附近',
      partial: '丰台科技园总部基地办公区',
      full: '科技园总部基地16号楼1层大厅电梯旁',
    },
    contact: '137****4444',
    condition: {
      chiefComplaint: '搬东西的时候腰突然剧痛现在完全直不起来',
      age: '38岁',
      gender: '男性',
      consciousness: '清醒',
      breathing: '疼得不敢深呼吸',
      patientCount: '1人',
      additional: [
        '弯腰搬箱子的时候突然腰部剧痛',
        '感觉像有什么东西卡住了',
        '疼痛局限在腰部没有往腿上跑',
        '腿不麻',
      ],
    },
    purpose: '动不了了需要救护车',
  },

  mpdsQuestions: [
    {
      id: 'mpds_bp_radiation',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '放射痛',
      questionText: '疼痛有没有往腿上跑',
      answer: '没有就是腰中间那一块疼',
      answerVague: '没有，腰那里疼',
      ramblingAnswer: '就是后腰正中间那个位置像被什么东西钉住了一样。腿不麻也没有往屁股上跑的感觉，就是腰那一块。但是我一动就疼得不行哪怕轻轻动一下。',
      panickedAnswer: '没有没有，就是腰！腰那里疼！',
      reveals: ['additional'],
      judgment: {
        question: '疼痛局限在腰部没有放射到腿部，提示什么？',
        options: [
          { label: '单纯腰肌扭伤，未涉及神经根', fills: [{ field: 'conditionNote', value: '疼痛局限腰部，无神经根受累迹象' }], isCorrect: true },
          { label: '腰椎间盘突出压迫神经', fills: [{ field: 'conditionNote', value: '可能有腰椎间盘突出' }], isCorrect: false },
          { label: '肾脏问题导致的牵涉痛', fills: [{ field: 'conditionNote', value: '可能需要排除肾脏问题' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_bp_sensation',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '感觉',
      questionText: '脚趾能动吗腿有感觉吗',
      answer: '能动，脚趾都能动，腿也有感觉',
      answerVague: '能动...',
      ramblingAnswer: '能动，脚趾都能动，腿也有感觉。我刚才试了一下，左脚右脚都没问题，脚趾头也能一个一个地动。就是腰那里疼得不敢动。',
      panickedAnswer: '能动能动！都好的！就是腰疼！',
      reveals: ['additional'],
      judgment: {
        question: '下肢感觉和运动功能正常，提示什么？',
        options: [
          { label: '无神经损伤，单纯肌肉骨骼问题', fills: [{ field: 'conditionNote', value: '下肢神经功能正常' }], isCorrect: true },
          { label: '可能有脊髓压迫，需紧急处理', fills: [{ field: 'conditionNote', value: '警惕脊髓压迫' }], isCorrect: false },
          { label: '外周神经损伤', fills: [{ field: 'conditionNote', value: '外周神经损伤可能' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '急性腰痛等待指导',
    intro: '保持你感觉最舒服的姿势不要强行站直。救护车马上就到。',
    steps: [
      {
        id: 'bp_position',
        instruction: '保持现在最舒服的姿势不要强行活动',
        prompt: '第一步：保持姿势',
        options: [
          '保持当前舒服姿势',
          '强行站直活动',
          '用力转腰拉伸',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！保持最舒服的姿势可以避免加重损伤。',
          incorrect: '不对。急性腰扭伤时强行活动会加重损伤。请保持最舒服的姿势不要动。',
          callerCorrect: '我现在半蹲半站的姿势最舒服，腰稍微弯着一点，不敢动。',
          callerIncorrect: '我刚才试着站直了一下，疼得差点晕过去...我错了...',
        },
      },
      {
        id: 'bp_ice',
        instruction: '如果有冰袋可以冷敷腰部',
        prompt: '第二步：冷敷',
        options: [
          '冰袋冷敷',
          '热毛巾热敷',
          '贴膏药',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！急性期冷敷可以减轻肿胀和疼痛。',
          incorrect: '不对。急性期热敷会加重肿胀。48小时内应冷敷。',
          callerCorrect: '同事给我找了个冰袋，我敷上了，凉凉的舒服一点了。',
          callerIncorrect: '我用热毛巾敷了...现在感觉更疼了...',
        },
      },
      {
        id: 'bp_no_massage',
        instruction: '不要按摩不要强行活动',
        prompt: '第三步：不要',
        options: [
          '不要按摩揉搓',
          '轻轻按摩缓解',
          '用力捶打',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！急性期按摩会加重水肿和疼痛。',
          incorrect: '不对。急性腰扭伤48小时内不要按摩揉搓，会加重炎症反应。',
          callerCorrect: '好我不碰它了，就保持这个姿势等着。',
          callerIncorrect: '我刚才让同事帮我按了两下，按完更疼了...',
        },
      },
      {
        id: 'back_pain_mg',
        instruction: '让患者平躺不动，双手按住腰背部疼痛位置保持稳定。',
        prompt: '实操环节：平卧体位保持',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我按住了他腰上那个痛点，他好像放松了一点。',
          callerIncorrect: '我一松手他又疼得动起来了……',
        },
        miniGame: {
          kind: 'holdPressure',
          title: '平卧体位保持',
          instruction: '让患者平躺不动，双手按住腰背部疼痛位置保持稳定。',
          passThreshold: 0.5,
          holdSec: 8,
          bleedRatePerSec: 8,
          regainPerSec: 14,
          feedback: { good: '我按住了他腰上那个痛点，他好像放松了一点。', bad: '我一松手他又疼得动起来了……' },
        },
      },
    ],
  },

  specialEvents: [],

  outcomeNarrative: {
    good: '患者送医后诊断为急性腰肌扭伤，卧床休息和理疗后一周恢复',
    bad: '患者强行站起活动导致腰椎间盘突出加重，需要手术治疗',
    prank: '',
  },
}
