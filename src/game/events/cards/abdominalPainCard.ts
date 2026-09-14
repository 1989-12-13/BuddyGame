// ============================================================
// MPDS 协议卡片 1 — 腹痛
// 分诊级别: 黄色
// ============================================================

import type { EmergencyScenario } from '../../types'

export const abdominalPainCard: EmergencyScenario = {
  id: 'abdominal_pain',
  title: '急性腹痛',
  callerId: 'xu_dawei',
  phoneNumber: '138****1111',
  baseStation: '海淀区苏州街附近',
  isPrank: false,
  correctTriage: 'green',

  mpdsCard: {
    number: 1,
    title: '腹痛/背痛',
    chiefComplaint: '中年男性右下腹剧烈疼痛、恶心呕吐、疼痛逐渐加重',
    determinantCode: '1-D-2',
    hotCold: 'COLD',
    keyQuestions: [
      '疼痛从什么时候开始的',
      '疼痛在哪个位置',
      '疼痛是持续的还是阵发性的',
      '有没有发烧恶心呕吐',
      '有没有排便问题',
    ],
  },

  openingLine: '喂120吗，我肚子疼得不行了，从昨晚开始右下腹一直疼，现在越来越厉害，动一下都疼得冒冷汗',

  variants: [
    {
      id: 'food_poisoning_party',
      callers: ['lin_mei', 'fan_tao'],
      openingLine: '你们快来！我们公司十几个人中午吃完工作餐全都不对劲了，好几个又吐又拉，有个人刚才直接晕过去了！',
      purpose: '不止一个人！你们能不能多派几辆车过来？我们这边倒了一片！',
      condition: {
        chiefComplaint: '公司集体聚餐后多人呕吐腹泻，其中一人晕厥',
        age: '38岁',
        gender: '女性',
        consciousness: '大部分人清醒，晕倒那位刚醒过来，还坐在地上缓',
        breathing: '都在喘粗气，看着很难受',
        patientCount: '十几人（其中一人晕厥）',
        additional: [
          '中午吃的盒饭，鸡腿饭和炒青菜，好几个人说鸡腿味道不太对',
          '最早发病的是下午两点，陆续开始有同事喊肚子疼',
          '有人吐了四五次，嘴唇都白了',
          '晕倒那位是蹲下去捡东西时突然倒下的',
        ],
      },
      answers: {
        mpds_abd_pain_transfer: {
          answer: '几乎都是先肚子中间绞着疼，后来整个肚子都疼，分不清是哪儿了',
          answerVague: '到处都疼……分不清……',
          ramblingAnswer: '不是一个人的事，是好多人都这样。大部分是先说肚子中间绞着疼，然后就说不清具体哪儿疼了，反正整个肚子都不舒服。有个女同事吐得最厉害，说胃和肚子一起翻。晕倒那个倒没喊疼，就是突然站起来蹲下去，一屁股坐地上了。',
          panickedAnswer: '好多人都在喊肚子疼！！到处疼！！分不清！！有人还晕过去了！！',
        },
        mpds_abd_fever: {
          answer: '有几个说有点低烧，大多数没量，但是都在吐，还有好几个在拉肚子',
          answerVague: '吐……拉……好像有人发烧……',
          ramblingAnswer: '好几个人在拉肚子，跑厕所都排队了。温度计我们只有一个，量了三个，一个37度8一个38度1，还有一个正常的。吐的人也多，前台那个妹妹吐完之后脸都绿了。工作餐就那一家送的，我们天天订。',
          panickedAnswer: '都在吐都在拉！！有人发烧！！一屋子人！！你们快派车！！',
        },
      },
      specialEvents: [
        {
          id: 'abd_mass_collapse',
          trigger: 'after_dispatch',
          triggerValue: '',
          type: 'new_symptom',
          dialogue: '又倒下一个！现在都蹲在地上起不来了，有几个人开始说手脚发麻，是不是很严重啊？！',
        },
      ],
      outcomeNarrative: {
        good: '你按人数重新核了一遍现场，把发病时间、共同进食和症状分布都记进了交接单。救护车分批到场，送医后陆续补液观察，第二天大部分人都陆续回了家。',
        bad: '电话里没问出到底有多少人不舒服，第一批车到了才发现现场远超预期，临时从别的站点调车。有几位症状偏重的等得比较久。',
      },
      menu: { category: '消化泌尿', desc: '集体食物中毒 · 多人分诊', tag: '📞' },
    },
  ],

  fourElements: {
    address: {
      vague: '海淀区苏州街附近',
      partial: '苏州街长远天地大厦',
      full: '苏州街长远天地大厦A座1206室，苏州街地铁站A口出来往北走100米',
    },
    contact: '138****1111',
    condition: {
      chiefComplaint: '右下腹疼了一晚上了，刚开始还能忍现在完全忍不住了',
      age: '32岁',
      gender: '男性',
      consciousness: '清醒，但疼得脸色发白',
      breathing: '疼得不敢深呼吸',
      patientCount: '1人',
      additional: [
        '昨晚开始胃周围疼后来转移到右下腹',
        '早上吐了两次',
        '没有发烧',
        '按压的时候右下腹更疼',
      ],
    },
    purpose: '我是不是阑尾炎了要不要去医院',
  },

  mpdsQuestions: [
    {
      id: 'mpds_abd_pain_transfer',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '疼痛位置和转移',
      questionText: '疼痛是不是从胃附近转到右下腹的',
      answer: '对！昨晚是胃附近疼，今天早上变成右下腹了',
      answerVague: '对...从胃转到肚子下面了...',
      ramblingAnswer: '昨天晚上八九点开始胃那个位置隐隐作痛我以为吃坏了肚子没在意，但是早上起来发现疼的地方跑到右下腹了，而且越来越疼跟针扎一样。我试着按了一下右下腹疼得我差点叫出来。',
      panickedAnswer: '从胃转到右下腹了！越来越疼！按都不敢按！',
      reveals: ['additional'],
      judgment: {
        question: '转移性右下腹痛是典型什么表现？',
        options: [
          { label: '转移性右下腹痛 高度怀疑急性阑尾炎', fills: [{ field: 'conditionNote', value: '转移性右下腹痛，高度怀疑急性阑尾炎' }], isCorrect: true },
          { label: '可能是胃肠炎引起的疼痛转移', fills: [{ field: 'conditionNote', value: '可能是胃肠炎' }], isCorrect: false },
          { label: '可能是肾结石放射痛', fills: [{ field: 'conditionNote', value: '可能是肾结石' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_abd_fever',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '伴随症状',
      questionText: '有没有发烧恶心呕吐',
      answer: '吐了两次，但是没发烧',
      answerVague: '吐了...没发烧...',
      ramblingAnswer: '早上吐了两次，吐的都是水，吃了点粥也吐出来了。体温量了36度8没有发烧。大便也正常没有拉肚子。',
      panickedAnswer: '吐了两次！！没发烧！！但是疼得受不了了！！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '急性腹痛等待指导',
    intro: '不要吃任何东西包括水，不要吃止痛药。救护车马上就到',
    steps: [
      {
        id: 'abd_food',
        instruction: '暂时不要吃任何东西也不要喝水',
        prompt: '第一步：禁食禁水',
        options: [
          '禁食禁水直到医生检查',
          '喝点热水缓解',
          '吃止痛药',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！禁食禁水可以避免加重病情和影响后续检查。',
          incorrect: '不对。进食饮水可能加重病情，止痛药会掩盖症状影响医生判断。',
          callerCorrect: '好的我不吃了不喝了，就这么等着。',
          callerIncorrect: '我刚吃了片止痛药...现在好像好点了...但是肚子还是胀胀的...',
        },
      },
      {
        id: 'abd_position',
        instruction: '找到最舒服的姿势躺着或侧卧屈膝',
        prompt: '第二步：调整体位',
        options: [
          '侧卧屈膝减轻腹部张力',
          '平躺伸直腿',
          '来回走动',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！侧卧屈膝可以减轻腹部肌肉张力缓解疼痛。',
          incorrect: '不对。侧卧屈膝才是减轻腹部张力的最佳体位。',
          callerCorrect: '我侧躺着了，腿蜷起来，好像好一点点。',
          callerIncorrect: '我走了一下，走不动，一动更疼了。',
        },
      },
      {
        id: 'abd_observe',
        instruction: '如果疼痛突然减轻或呕吐加重立即告诉我',
        prompt: '第三步：密切观察',
        options: [
          '观察疼痛变化',
          '用力按压疼痛部位',
          '热敷肚子',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！注意观察疼痛变化，有异常随时报告。',
          incorrect: '不对。不要按压或热敷，以免掩盖或加重病情。',
          callerCorrect: '好的我注意着，现在还是右下腹在疼。',
          callerIncorrect: '我按了一下...更疼了！',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'abd_pain_worsen',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '疼得更厉害了！我现在连腰都直不起来了！是不是阑尾要穿孔了',
    },
  ],

  outcomeNarrative: {
    good: '你让他别给患者喂水喂饭，也别自己找止痛药压着。到医院一查是急性阑尾炎，当天下午就上了手术台，三天后出院。',
    bad: '电话里没拦住，患者自己吞了两片止痛药，疼是压下去了，真正的问题也跟着被盖住了。等发现是阑尾穿孔，人已经多住了一周。',
    prank: '',
  },
}
