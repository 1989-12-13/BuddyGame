// ============================================================
// MPDS 协议卡片 28 — 卒中（脑血管意外）
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const strokeCard: EmergencyScenario = {
  id: 'stroke',
  title: '疑似脑卒中',
  callerId: 'zhang_xiulan',
  phoneNumber: '136****9012',
  baseStation: '西城区金融街附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 28,
    title: '卒中（脑血管意外）',
    chiefComplaint: '老年男性突然口角歪斜、言语不清、单侧肢体无力，发病<4.5h',
    determinantCode: '28-C-1',
    hotCold: 'HOT',
    keyQuestions: [
      '症状何时开始？（精确到分钟）',
      '能否微笑？（面部对称性）',
      '能否双手平举？（肢体无力）',
      '说话是否清晰？（语言障碍）',
      '有无高血压/心脏病史？',
    ],
  },

  openingLine: '喂？是120吗？我……我们老头子刚才吃饭的时候突然嘴歪了，话也说不清楚了，右手抬不起来了……这是咋回事啊？',

  fourElements: {
    address: {
      vague: '西城区金融街附近',
      partial: '金融街丰汇园小区',
      full: '丰汇园小区7号楼3单元201室，小区门口有个工商银行',
    },
    contact: '136****9012',
    condition: {
      chiefComplaint: '老头子吃饭的时候突然嘴歪了、话也说不清楚、右手抬不起来了',
      age: '72岁',
      gender: '男性',
      consciousness: '醒着的，但说话含糊不清',
      breathing: '呼吸看着还正常',
      patientCount: '1人',
      additional: [
        '有高血压病史',
        '症状大约在20分钟前开始',
        '之前没有类似情况',
      ],
    },
    purpose: '不会是要中风了吧！你们快来！',
  },

  mpdsQuestions: [
    {
      id: 'mpds_stroke_time',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 3,
      stressEffect: -8,
      label: '什么时候开始的？',
      questionText: '这些症状是什么时候开始出现的？请您尽量回忆准确时间。',
      answer: '大概20分钟前，吃完饭没一会儿就开始了……',
      answerVague: '没多久...吃完饭...',
      ramblingAnswer: '嗯...什么时候呢...就是刚才吃完饭，碗还没收呢，他就突然说话不对劲了。大概是...现在几点了？反正我们六点半开始吃饭的，吃了一半他就说头晕，然后嘴就这样了。所以应该是二十分钟左右吧...具体几分钟我也说不太准，我光顾着着急了。',
      panickedAnswer: '就刚才！！十分钟？二十分钟？我不知道！！我慌了！刚才还好好的突然就这样了！！',
      reveals: ['additional'],
      judgment: {
        question: '发病时间的描述很模糊——你的判断是？',
        options: [
          { label: '精确20分钟前', fills: [{ field: 'conditionNote', value: '发病约20分钟前' }], isCorrect: false },
          { label: '约20-30分钟前（估计值）', fills: [{ field: 'conditionNote', value: '发病约20-30分钟前（在溶栓时间窗内）' }], isCorrect: true },
          { label: '超过1小时', fills: [{ field: 'conditionNote', value: '发病时间不确定，可能超过1小时' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_stroke_face',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -6,
      label: '能笑一下吗？',
      questionText: '请您让老先生笑一下，看看嘴角是不是歪的？',
      answer: '他笑了……是的，右边嘴角往下耷拉着。',
      answerVague: '嘴...嘴是歪的...',
      ramblingAnswer: '笑了...他试着笑了一下，右边嘴角往下耷拉着，左边好像还正常。他说话的时候嘴巴也往一边歪，我一开始还以为是假牙掉了呢...右边脸整个看起来就跟...就跟不太对劲似的，表情不对称了。',
      panickedAnswer: '歪了歪了！！右边！右边嘴角掉下来了！一笑就斜的！！这是不是中风了？！我电视上看过的！！',
      reveals: ['chiefComplaint'],
      judgment: {
        question: '老人「右边嘴角耷拉、表情不对称」，你的判断是？',
        options: [
          { label: '右侧面瘫（疑似中枢性）', fills: [{ field: 'chiefComplaint', value: '右侧面瘫，疑似脑卒中' }], isCorrect: true },
          { label: '只是假牙问题或表情不自然', fills: [{ field: 'chiefComplaint', value: '面瘫待确认' }], isCorrect: false },
          { label: '双侧均不正常', fills: [{ field: 'chiefComplaint', value: '双侧面部不对称' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_stroke_arm',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -4,
      label: '能举手臂吗？',
      questionText: '让老先生闭上眼睛，双手平举，看看能不能做到？',
      answer: '右手举不起来，左手还可以……',
      answerVague: '右手不行...举不起来...',
      ramblingAnswer: '我让他举手...右手抬了大概一半就掉下来了，左手倒是还能举着。他自己也很惊讶，说"我的手怎么不听使唤了"...右手整个就...像不是他的了一样，他看自己右手的那个表情特别害怕。',
      panickedAnswer: '右手不行！！完全抬不起来！！举一半就掉！左手好像还可以！',
      reveals: ['additional'],
      judgment: {
        question: '右手举一半掉落——此体征提示什么？',
        options: [
          { label: '右侧肢体偏瘫（符合卒中表现）', fills: [{ field: 'conditionNote', value: '右侧肢体偏瘫，FAST阳性' }], isCorrect: true },
          { label: '只是没力气，可能饿了', fills: [{ field: 'conditionNote', value: '肢体无力待观察' }], isCorrect: false },
          { label: '双侧均无力', fills: [{ field: 'conditionNote', value: '双侧肢体无力' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '脑卒中现场处置',
    intro: '救护车已在路上。在到达前，请保持患者安静，不要喂食喂水，并帮患者摆好体位防止误吸。',
    steps: [
      {
        id: 'st_position_choice',
        instruction: '把患者摆成侧卧的复苏体位，头偏向一侧，防止呕吐物堵塞气道。',
        prompt: '第一步：摆放复苏体位',
        options: [
          '侧卧 头偏向一侧',
          '平躺仰头',
          '扶坐起来',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！侧卧头偏一侧能防止误吸，保护气道。',
          incorrect: '不对。脑卒中患者应保持侧卧、头偏向一侧，避免呕吐物呛入气道。',
          callerCorrect: '我让他侧过身了，头也偏过去了一点。这样对吗？',
          callerIncorrect: '我把他扶起来坐着了，他好像更难受了。',
        },
      },
      {
        id: 'st_position_game',
        instruction: '把患者身体摆成侧卧复苏体位。',
        prompt: '实操环节：摆位',
        options: ['完成摆位'],
        correctIndex: 0,
        feedback: {
          correct: '摆位到位。',
          incorrect: '摆位不达标。',
          callerCorrect: '我把他侧过来了，头也偏着，看上去呼吸顺多了。',
          callerIncorrect: '我摆的位置不太对，他好像不太舒服。',
        },
        miniGame: {
          kind: 'positionDrag',
          title: '复苏体位摆位',
          instruction: '拖动或按左右方向键旋转身体成侧卧约90度，头偏向一侧防止呕吐物误吸，对齐后确认。',
          passThreshold: 0.5,
          targetAngle: 90,
          angleTolerance: 10,
          bodyLabel: '侧卧 头偏一侧',
          useDetailedFigure: true,
          feedback: { good: '我把他侧过来了，头也偏着，看上去呼吸顺多了。', bad: '我摆的位置不太对，他好像不太舒服。' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'stroke_worse',
      trigger: 'time_elapsed',
      triggerValue: '15',
      type: 'new_symptom',
      dialogue: '哎呀！老头子现在好像更严重了，右边胳膊彻底动不了了！你们到哪了？',
    },
  ],

  outcomeNarrative: {
    good: '接线员迅速识别脑卒中症状，1分钟内派车。患者27分钟到达医院，在溶栓时间窗内得到治疗，恢复良好。',
    bad: '派车延迟，到达医院时已超过溶栓时间窗。患者留下了永久性右侧肢体偏瘫……',
    prank: '',
  },
}
