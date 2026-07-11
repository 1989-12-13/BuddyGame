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
    hotCold: 'HOT',
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
      triggerValue: '',
      type: 'caller_speaks',
      dialogue: '她喝了糖水！好像能听见我说话了！脸色慢慢好起来了！她刚才说谢谢你们！',
    },
  ],

  outcomeNarrative: {
    good: '调度员快速判断低血糖并指导补糖，患者喝下糖水后5分钟意识明显恢复，救护车到后确认血糖2.3mmol/L，补糖后恢复正常',
    bad: '家属未确认吞咽能力就喂食导致呛咳误吸，患者出现吸入性肺炎，住院治疗一周',
    prank: '',
  },
}
