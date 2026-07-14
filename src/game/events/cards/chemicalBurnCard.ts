// ============================================================
// MPDS 协议卡片 07 — 烧伤（烫伤）/爆炸伤
// 分诊级别: 轻伤（绿色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const chemicalBurnCard: EmergencyScenario = {
  id: 'chemical_burn',
  title: '化学品灼伤',
  callerId: 'chen_ming',
  phoneNumber: '135****7890',
  baseStation: '大兴区亦庄开发区附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 7,
    title: '烧伤（烫伤）/爆炸伤',
    chiefComplaint: '98%浓硫酸溅到右手背，单部位化学灼伤',
    determinantCode: '7-C-3',
    hotCold: 'HOT',
    keyQuestions: [
      '是什么化学品？（化学品名和浓度）',
      '伤及哪些部位？面积多大？',
      '有无吸入或溅入眼睛？',
      '是否在用流动水冲洗？持续多久？',
      '伤者意识和呼吸是否正常？',
    ],
  },

  openingLine: '你好120，我们在实验室做实验，同事不小心把浓硫酸溅到手上了，皮肤烧伤了一大片，现在应该怎么处理？',

  fourElements: {
    address: {
      vague: '大兴区亦庄开发区附近',
      partial: '亦庄经济技术开发区，生物医药园',
      full: '生物医药园A座3楼302实验室，亦庄线荣京东街站向西500米',
    },
    contact: '135****7890',
    condition: {
      chiefComplaint: '同事在实验室做实验，浓硫酸溅到手背上了，皮肤烧了一大块',
      age: '28岁',
      gender: '男性',
      consciousness: '人是清醒的，但疼得不行',
      breathing: '呼吸正常',
      patientCount: '1人',
      additional: [
        '浓硫酸溅到右手背',
        '已用流动水冲洗了5分钟',
        '伤者疼痛剧烈但可忍受',
        '没有溅到眼睛或面部',
      ],
    },
    purpose: '需要救护车，同时需要现场处理指导',
  },

  mpdsQuestions: [
    {
      id: 'mpds_chem_what',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -8,
      label: '什么化学品？',
      questionText: '具体是什么化学品？浓度是多少？',
      answer: '是浓硫酸，浓度大概98%。就溅了一小滴。',
      answerVague: '硫酸...浓的...',
      ramblingAnswer: '浓硫酸...试剂瓶上写的是98%，分析纯的。就是我们实验室做酸化实验用的那种。我同事转移的时候手一滑，滴管里甩出来一小滴掉在手背上了...就很小一滴，但是马上就起了一个大泡。还好他反应快，马上把手套摘了冲到水龙头那边去了。',
      panickedAnswer: '硫酸！！！浓硫酸！！98%的！！就溅了一小滴！！但是马上皮就变了！！发白！！',
      reveals: ['chiefComplaint'],
      judgment: {
        question: '98%浓硫酸溅到手上——损伤程度判断？',
        options: [
          { label: '强腐蚀性化学灼伤，需紧急处理', fills: [{ field: 'chiefComplaint', value: '98%浓硫酸化学灼伤右手背' }], isCorrect: true },
          { label: '小滴溅洒，不严重', fills: [{ field: 'chiefComplaint', value: '轻微化学烧伤' }], isCorrect: false },
          { label: '可能是热烧伤而非化学灼伤', fills: [{ field: 'chiefComplaint', value: '疑似热烧伤' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_chem_area',
      category: 'bleeding',
      tier: 'important',
      timeCost: 2,
      stressEffect: -5,
      label: '伤到哪里了？',
      questionText: '除了手还有哪些地方被溅到了？脸上或眼睛有没有？',
      answer: '没有没有，就是右手背，面积大概一个手掌心那么大。他戴了护目镜的。',
      answerVague: '就是手...右手...',
      ramblingAnswer: '没有没有，我仔细看了，就是右手背，虎口往下一点的位置，面积大概...一个瓶盖那么大吧，但是周围一圈都发红了。他当时戴着护目镜和实验服，脸上没事，眼睛也没问题。实验服上溅了几滴但没渗透进去。真的就是手背上那一小块，不过看起来挺吓人的。',
      panickedAnswer: '就手！！右手！！手背！！别的地方没有！！他戴着护目镜！！脸上没事！！但是手背已经...已经烧白了！！',
      reveals: ['additional', 'consciousness'],
      judgment: {
        question: '灼伤范围仅右手背一小块，未波及面部——伤情分级？',
        options: [
          { label: '单部位局限性化学灼伤', fills: [{ field: 'conditionNote', value: '右手背局限性化学灼伤，面积约1%' }, { field: 'conscious', value: true }], isCorrect: true },
          { label: '大面积化学灼伤', fills: [{ field: 'conditionNote', value: '大面积化学灼伤' }], isCorrect: false },
          { label: '可能吸入化学品', fills: [{ field: 'conditionNote', value: '需排查吸入性损伤' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_chem_rinse',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '冲洗了吗？',
      questionText: '你们有没有用流动水冲洗？冲了多久？',
      answer: '冲了，已经用流动水冲了差不多五分钟了。',
      answerVague: '冲了...冲了一会儿...',
      ramblingAnswer: '冲了冲了！他一溅到马上就冲到水池那边去了，一直用那个洗眼器接的水管在冲。大概冲了有五分钟左右了吧，我帮他计着时间的，因为实验室培训时候教过要冲15到20分钟...他现在手还在水龙头下面冲着呢，我叫他不要停。',
      panickedAnswer: '冲了！！一直在冲！！冲了好几分钟了！！还要冲多久？！我就让他冲着不要停！！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '化学品灼伤处理',
    intro: '救护车已经出发了。化学灼伤的现场处理至关重要，请按我说的做。',
    steps: [
      {
        id: 'chem_rinse',
        instruction: '继续用大量流动清水冲洗伤处，至少冲洗15-20分钟。不要用热水，用常温水。',
        prompt: '持续冲洗伤口',
        options: [
          '用大量流动常温水持续冲洗至少15分钟',
          '涂烫伤膏',
          '用冰块冷敷',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！大量流动水冲洗是化学灼伤的首选处理方法。',
          incorrect: '不对。不要涂任何药膏（会阻碍散热和化学物质清除），也不要用冰块（可能造成冻伤叠加）。',
          callerCorrect: '我让他一直冲着！手在水龙头下面淋着，他说比刚才好受点了，烧灼感没那么强了。',
          callerIncorrect: '我刚才给他涂了烫伤膏……他现在疼得更厉害了！手背发红发黑……是不是更严重了？！',
        },
      },
      {
        id: 'chem_clothing',
        instruction: '小心脱掉或剪掉被污染的手套和衣物，注意不要把化学品扩散到其他部位的皮肤上。',
        prompt: '去除污染衣物',
        options: [
          '小心剪掉/脱掉被污染的衣物手套',
          '不用管衣物，只冲水',
          '用布擦拭干净',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！去除污染源才能彻底清除化学品。',
          incorrect: '不对。被污染的衣物手套会持续接触皮肤造成进一步损伤，必须去除。',
          callerCorrect: '我帮他把手套剪掉了！手上确实还有硫酸痕迹……现在继续冲水呢！他说没那么疼了。',
          callerIncorrect: '我没敢碰他衣服……就一直让他冲水来着……他说还是疼，手套黏在手上会不会有事啊？',
        },
      },
    ],
  },

  specialEvents: [],

  outcomeNarrative: {
    good: '接线员正确指导了持续冲洗和污染衣物去除。救护车到达时伤者疼痛有所缓解，送医后诊断为浅二度化学灼伤，预后良好。',
    bad: '现场处理不当（未持续冲洗或涂抹了药膏），导致化学灼伤加深为深二度，需要植皮手术……',
    prank: '',
  },
}
