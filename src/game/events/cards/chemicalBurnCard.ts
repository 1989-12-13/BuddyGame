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
    determinantCode: '7-D-2',
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

  // ============================================================
  // 手写对话脚本 — 陈明（同事）报告浓硫酸灼伤
  // 来电者个性：紧张但尽力配合、主动提供信息
  // 关系：同事（对现场了解）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，园区和楼号。',
      caller: {
        calm: ['大兴区亦庄经济技术开发区，生物医药园A座3楼302实验室。'],
        tense: ['亦庄！生物医药园！A座3楼！302实验室！你们快来！'],
        panic: ['生物医药园！A座！302！快来！'],
        lost: ['亦庄……生物医药园……302……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '大兴区亦庄经济技术开发区生物医药园A座3楼302实验室' },
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你紧张，救护车已经在路上了。咱接着说，每个问题都能帮到他。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    // --- 步骤1b：标志建筑 ---
    ask_landmark: {
      operator: '园区旁边有什么明显的标志吗？',
      caller: {
        calm: ['亦庄线荣京东街站向西500米。'],
        tense: ['荣京东街站！向西500米！就在路边！'],
        panic: ['荣京东街站……西边500米……'],
        lost: ['地铁站旁边……向西……'],
      },
      fillTerminal: { address: '大兴区亦庄经济技术开发区生物医药园A座3楼302实验室，亦庄线荣京东街站向西500米' },
      calmReply: {
        operatorCalm: '好，荣京东街站，记下了。咱继续。',
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
        calm: ['同事做实验时浓硫酸溅到右手背了。', '皮肤烧了一块，已经用水冲了五分钟了。'],
        tense: ['浓硫酸溅到手背了！98%的！', '已经用水冲了五分钟了！', '他疼得不行！'],
        panic: ['硫酸！！手背！！98%的！！', '已经冲了水！！但他还是疼！！', '你们快来！！'],
        lost: ['硫酸溅到了……手背……', '在冲水……但还是很疼……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '98%浓硫酸灼伤右手背，已冲洗5分钟', patientGender: '男性' },
      outburst: '他疼得受不了了！！你们到底来不来！！',
      calmReply: {
        operatorCalm: '我听清楚了。浓硫酸溅到手背，已经在冲水——这些我记下了。你做得很对，继续冲水别停，按我说的做。',
        calm: '好……我们继续冲。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    // --- 步骤3：患者年龄 ---
    step3_age: {
      operator: '他多大岁数？',
      caller: {
        calm: ['28岁。'],
        tense: ['28！他今年28！'],
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
      operator: '他还清醒吗？呼吸怎么样？',
      caller: {
        calm: ['清醒，但疼得不行。', '呼吸正常，没有溅到脸上。'],
        tense: ['清醒！但疼得厉害！', '呼吸正常！脸上没事！他戴着护目镜！'],
        panic: ['清醒！！疼！！呼吸正常！！', '脸上没事！！你们快来！！'],
        lost: ['还醒着……疼得厉害……', '呼吸正常……脸上没事……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，人清醒，呼吸正常，这我知道了。继续冲水，别涂任何东西，救护车马上到。',
        calm: '好……继续冲。',
        tense: '行……知道了。',
        panic: '嗯……快……',
        lost: '……好。',
      },
    },

    // --- 联系电话 ---
    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13577627890，就是这个号。'],
        tense: ['135……7762……7890！打这个就行！'],
        panic: ['135……这个手机！7890！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '135****7890' },
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
    good: '你带着他一遍遍冲，也让他把沾上的衣服脱了。车到时疼得没那么厉害了，诊断是浅二度灼伤，恢复顺利。',
    bad: '现场没一直冲，还涂了药膏，灼伤反而更深，后来做了植皮。',
    prank: '',
  },
}
