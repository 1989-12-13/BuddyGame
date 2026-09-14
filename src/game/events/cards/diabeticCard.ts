// ============================================================
// MPDS 协议卡片 13 — 糖尿病问题
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const diabeticCard: EmergencyScenario = {
  id: 'diabetic',
  title: '低血糖昏迷',
  callerId: 'lin_mei',
  phoneNumber: '137****7777',
  baseStation: '朝阳区国贸CBD附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 13,
    title: '糖尿病问题',
    chiefComplaint: '中年女性突发意识模糊、大汗淋漓、四肢无力，有糖尿病史',
    determinantCode: '13-D-2',
    hotCold: 'COLD',
    keyQuestions: [
      '患者有无糖尿病史？',
      '最近一次吃饭是什么时候？',
      '是否有意识？能否应答？',
      '是否出冷汗、发抖？',
      '是否有呕吐或腹泻？',
    ],
  },

  openingLine: '喂120吗？我同事突然不对劲，浑身发抖出冷汗，跟她说话也没反应了，她有糖尿病！',

  fourElements: {
    address: {
      vague: '朝阳区国贸CBD附近',
      partial: '国贸写字楼A座18层',
      full: '国贸写字楼A座18层1803室，国贸地铁站D口出来进大厅上电梯',
    },
    contact: '137****7777',
    condition: {
      chiefComplaint: '同事中午就说不舒服没吃饭，下午突然浑身发抖出冷汗，叫不答应了',
      age: '38岁',
      gender: '女性',
      consciousness: '不太清醒，能哼哼但说不出完整的话',
      breathing: '呼吸有点浅但还算正常',
      patientCount: '1人',
      additional: [
        '有I型糖尿病史',
        '中午没吃饭，说是早上打了胰岛素',
        '刚才突然开始发抖出大汗',
        '身上没有外伤',
      ],
    },
    purpose: '她是不是低血糖了？要不要给她吃糖？',
  },

  // ============================================================
  // 手写对话脚本 — 林美（同事）报告同事低血糖昏迷
  // 来电者个性：紧张但配合、主动补充观察细节
  // 关系：同事（对患者了解一部分）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，楼层和房间号。',
      caller: {
        calm: ['朝阳区国贸写字楼A座18层1803室。'],
        tense: ['国贸写字楼！A座！18层！1803室！你们快来！'],
        panic: ['国贸！A座！1803！快来！'],
        lost: ['国贸……A座……1803……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '朝阳区国贸写字楼A座18层1803室' },
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你紧张，救护车已经在路上了。咱接着说，每个问题都帮到她。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '写字楼大厅怎么上去？旁边有什么标志吗？',
      caller: {
        calm: ['国贸地铁站D口出来进大厅上电梯。'],
        tense: ['地铁D口！进大厅！上电梯到18层！'],
        panic: ['地铁D口……大厅……18层！'],
        lost: ['地铁口旁边……大厅……'],
      },
      fillTerminal: { address: '朝阳区国贸写字楼A座18层1803室，国贸地铁站D口出来进大厅上电梯' },
      calmReply: {
        operatorCalm: '好，地铁D口，记下了。咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['同事中午没吃饭，下午突然浑身发抖出冷汗。', '叫她不太应了，她有糖尿病。'],
        tense: ['同事突然发抖出冷汗！', '叫不太应了！她有糖尿病！', '是不是低血糖了！'],
        panic: ['她不对劲了！！发抖出冷汗！！', '叫不答应了！！有糖尿病！！', '你们快来！！'],
        lost: ['她突然发抖……', '叫不太应了……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '突发意识模糊，大汗淋漓，有糖尿病史', patientGender: '女性' },
      outburst: '她不答应了！！你们到底来不来！！',
      calmReply: {
        operatorCalm: '我听清楚了。有糖尿病，中午没吃，突然发抖出汗——这像是低血糖，我记下了。你别慌，按我说的做。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '她多大岁数？',
      caller: {
        calm: ['38岁。'],
        tense: ['38！她今年38！'],
        panic: ['38！！38岁！！'],
        lost: ['38……应该是38……'],
      },
      fillTerminal: { patientAge: '38岁' },
      calmReply: {
        operatorCalm: '好，38岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '她还有意识吗？能说话吗？',
      caller: {
        calm: ['不太清醒，能哼哼但说不出完整的话。', '呼吸有点浅但还算正常。'],
        tense: ['不太清醒！能哼哼但说不出话！', '呼吸有点浅！但还算正常！'],
        panic: ['不太清醒了！！能哼哼！！', '呼吸有点浅！！但还算正常！！', '你们快来！！'],
        lost: ['能哼哼……但说不出话……', '呼吸有点浅……', '她不会……不会吧……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，还有一点意识，呼吸也在，这我知道了。如果她能吞咽就给她喝糖水，我告诉你怎么做。',
        calm: '好……我试试喂糖水。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13777627777，就是这个号。'],
        tense: ['137……7762……7777！打这个就行！'],
        panic: ['137……这个手机！7777！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '137****7777' },
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
      id: 'mpds_diab_medication',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '用药情况',
      questionText: '今天有没有打胰岛素或吃药？',
      answer: '打了，她早上上班前打了胰岛素的，然后中午说没胃口没吃饭',
      answerVague: '打了胰岛素...中午没吃...',
      ramblingAnswer: '她早上来的时候说是打了胰岛素的，然后中午她说没胃口，就喝了杯咖啡，什么也没吃。下午两点多的时候我就看她不对劲了，脸色发白，开始冒冷汗，我问她话她也回答得含糊不清。我觉得是低血糖了。',
      panickedAnswer: '打了！胰岛素打了！中午没吃饭！就是低血糖！你们快来！',
      reveals: [],
      judgment: {
        question: '胰岛素注射后未进食提示什么？',
        options: [
          { label: '低血糖反应需立即补充糖分', fills: [{ field: 'conditionNote', value: '胰岛素注射后未进食，低血糖反应' }], isCorrect: true },
          { label: '高血糖酮症酸中毒', fills: [{ field: 'conditionNote', value: '高血糖酮症酸中毒' }], isCorrect: false },
          { label: '脑血管意外', fills: [{ field: 'conditionNote', value: '脑血管意外' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_diab_swallow',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '意识水平',
      questionText: '她现在能吞咽吗？',
      answer: '不太清楚...她好像还有一点意识',
      answerVague: '不太清楚...',
      panickedAnswer: '她眼神涣散！说话含糊！怎么办！',
      ramblingAnswer: '我刚才叫她名字，她眼睛能睁开但是眼神涣散，说话含含糊糊的，我给她倒了杯水她好像接不住。不过她能哼哼两声，应该还算有一点意识吧。',
      reveals: [],
    },
  ],

  guidance: {
    title: '低血糖急救指导',
    intro: '如果患者能安全吞咽，立即给她补充糖分。我来告诉您怎么做。',
    steps: [
      {
        id: 'db_sugar',
        instruction: '如果她能吞咽，给她喝糖水或吃糖果',
        prompt: '第一步：补充糖分',
        options: [
          '喝糖水或吃糖果',
          '打120急救电话',
          '让她睡觉休息',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，补充糖分是低血糖急救的关键',
          incorrect: '不对，低血糖患者需要立即补充糖分',
          callerCorrect: '我给她冲了杯糖水，她喝下去了！',
          callerIncorrect: '我没敢动她......',
        },
      },
      {
        id: 'db_side_lie',
        instruction: '如果她意识继续下降，让她侧躺',
        prompt: '第二步：侧卧保护',
        options: [
          '意识下降时侧躺保护气道',
          '扶着坐起来',
          '用冷水泼脸',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，意识下降时侧躺可以防止误吸',
          incorrect: '不对，意识下降时应侧躺而不是坐起来',
          callerCorrect: '我让她侧躺了，头也偏过去一点。',
          callerIncorrect: '我试着把她扶起来坐着了......',
        },
      },
      {
        id: 'db_observe',
        instruction: '观察意识是否恢复',
        prompt: '第三步：观察恢复',
        options: [
          '补糖后观察10-15分钟看意识恢复',
          '一直补糖直到清醒',
          '不用管',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确，补糖后需要观察恢复情况',
          incorrect: '不对，需要观察但不要过度补糖',
          callerCorrect: '她好像比刚才精神一点了，能认出我了。',
          callerIncorrect: '我一直喂她吃糖，她好像没太大变化......',
        },
      },
      {
        id: 'db_mg',
        instruction: '患者意识下降，请拖拽旋转身体使其呈侧卧，头偏向一侧防误吸。',
        prompt: '实操环节：侧卧体位摆放',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我把她侧过来了！头也偏过去了！',
          callerIncorrect: '我没把她扶好，她又滑回去了……',
        },
        miniGame: {
          kind: 'stepOrder',
          title: '侧卧体位摆放',
          instruction: '患者意识下降，请按正确顺序操作摆放成侧卧体位。',
          passThreshold: 0.5,
          steps: [
            '将患者靠近自己一侧的手臂向上弯曲呈直角',
            '将患者另一侧手臂横放胸前',
            '将患者远侧腿的膝盖弯曲',
            '抓住远侧肩膀和膝盖，向自己一侧缓缓翻转',
            '调整头部后仰，保持气道通畅',
          ],
          feedback: { good: '我把她侧过来了！头也偏过去了！', bad: '我没把她扶好，她又滑回去了……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'db_improve',
      trigger: 'after_question',
      triggerValue: 'step4_vitals',
      type: 'caller_speaks',
      dialogue: '她喝了糖水！好像能听见我说话了！脸色慢慢好起来了！她刚才说谢谢你们！',
    },
  ],

  outcomeNarrative: {
    good: '你一听症状就往低血糖上想，让他赶紧补糖。糖水下去五分钟人就清楚多了，车到时测出来 2.3。',
    bad: '家属没先试吞咽就喂，呛进了气道。后来查出吸入性肺炎，住了一周。',
    prank: '',
  },
}
