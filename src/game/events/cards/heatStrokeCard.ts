// ============================================================
// MPDS 协议卡片 20 — 中暑/热损伤
// 分诊级别: 红色（危重）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const heatStrokeCard: EmergencyScenario = {
  id: 'heat_stroke',
  title: '热射病',
  callerId: 'fan_tao',
  phoneNumber: '151****9999',
  baseStation: '朝阳区奥林匹克森林公园附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 20,
    title: '中暑/热损伤',
    chiefComplaint: '中年男性户外跑步后突然晕倒体温极高皮肤干热意识模糊',
    determinantCode: '20-D-2',
    hotCold: 'HOT',
    keyQuestions: [
      '患者在室外活动了多久',
      '有没有喝足够的水',
      '皮肤是干的还是湿的',
      '有没有意识',
      '体温怎么样',
    ],
  },

  openingLine: '120吗我们一个同事在公园跑步突然倒下了身上烫得吓人不喘气了',

  fourElements: {
    address: {
      vague: '朝阳区奥林匹克森林公园附近',
      partial: '奥林匹克森林公园南门入口',
      full: '奥林匹克森林公园南门进门右手边跑道旁，地铁森林公园南门站B口',
    },
    contact: '151****9999',
    condition: {
      chiefComplaint: '同事中午在公园跑步突然倒地昏迷皮肤滚烫',
      age: '40岁',
      gender: '男性',
      consciousness: '叫不醒完全没反应',
      breathing: '呼吸非常急促好像在喘',
      patientCount: '1人',
      additional: [
        '中午十二点出来跑步的',
        '今天气温38度湿度很大',
        '身上皮肤干干的没有汗',
        '身上烫得跟发烧一样可能有40度',
        '没喝水就跑出来了',
      ],
    },
    purpose: '他是不是中暑了要不要给他喝水',
  },

  mpdsQuestions: [
    {
      id: 'mpds_heat_skin',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '皮肤状态',
      questionText: '皮肤是干的还是湿的？有汗吗？',
      answer: '干的！一点汗都没有！但是身上很烫！',
      answerVague: '干的...没汗...烫...',
      ramblingAnswer: '我摸了一下他身上干干的完全没有汗，但是皮肤滚烫的感觉有四十度以上。脸通红通红的。我给他灌水也灌不进去嘴巴闭得很紧。周围有人说是中暑但我看这不太对劲。',
      panickedAnswer: '干的！！没汗！！烫得跟火炉一样！！是不是要烧死了！！',
      reveals: ['additional'],
      judgment: {
        question: '皮肤干热无汗，高热，意识丧失，考虑什么？',
        options: [
          { label: '热射病 体温调节中枢衰竭 致命性', fills: [{ field: 'conditionNote', value: '热射病，体温调节中枢衰竭' }], isCorrect: true },
          { label: '普通中暑 喝水休息就好', fills: [{ field: 'conditionNote', value: '误判为普通中暑' }], isCorrect: false },
          { label: '热痉挛 补充盐分即可', fills: [{ field: 'conditionNote', value: '误判为热痉挛' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_heat_care',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '现场处理',
      questionText: '有没有给他降温？周围的人有做措施吗？',
      answer: '把他挪到树荫底下了',
      answerVague: '挪到树荫下了...',
      ramblingAnswer: '我们几个人一起把他抬到树荫底下了，但是不知道接下来该怎么办。有人想给他喂水但是灌不进去嘴闭太紧了。他脸色特别红身上特别烫。',
      panickedAnswer: '抬到树荫下了！！但是没用啊他还是昏迷！！怎么办！！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '热射病紧急降温',
    intro: '这是致命性的热射病需要立即降温。救护车已经在路上请马上开始。',
    steps: [
      {
        id: 'heat_cool',
        instruction: '把患者移到阴凉处脱掉上衣用凉水泼洒全身扇风',
        prompt: '第一步：降温',
        options: [
          '凉水泼洒全身扇风降温',
          '喂热水',
          '用厚被子裹住',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！凉水泼洒加扇风是最高效的降温方式。',
          incorrect: '不对。热射病需要快速降温，喂热水或盖被子会加重病情。',
          callerCorrect: '脱了他上衣！用矿泉水往他身上泼！几个人在扇风！',
          callerIncorrect: '我给他盖了件外套...是不是错了？他身上更烫了！',
        },
      },
      {
        id: 'heat_ice',
        instruction: '如果有冰袋放在腋下脖子和腹股沟',
        prompt: '第二步：冰敷',
        options: [
          '冰袋敷腋下脖子腹股沟',
          '冰袋敷额头',
          '不用冰袋',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！腋下脖子腹股沟有大血管经过降温效果最好。',
          incorrect: '不对。敷额头效果有限，应敷在大血管经过的部位。',
          callerCorrect: '找到了冰袋！敷在腋下了！脖子也敷了！',
          callerIncorrect: '就敷了额头...其他地方没敷...',
        },
      },
      {
        id: 'heat_position',
        instruction: '如果患者呕吐或有分泌物侧躺',
        prompt: '第三步：侧卧',
        options: [
          '意识不清时侧躺',
          '平躺',
          '坐着',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！意识不清者侧躺可以防止误吸。',
          incorrect: '不对。意识不清时平躺可能导致呕吐物误吸入肺。',
          callerCorrect: '把他侧过来了！头歪着！嘴角有口水流出来了！',
          callerIncorrect: '让他平躺着...刚才吐了一点好像呛到了！咳得厉害！',
        },
      },
      {
        id: 'heat_mg',
        instruction: '找到患者额头、颈部、腋下的大血管位置进行冰敷降温。',
        prompt: '实操环节：冰敷位置定位',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我把冰毛巾敷在他额头和脖子上了！',
          callerIncorrect: '我没敷对位置，他还在说热……',
        },
        miniGame: {
          kind: 'quickChoice',
          title: '冰敷位置定位',
          instruction: '选择正确的冰敷降温位置。',
          passThreshold: 0.5,
          question: '热射病降温，冰袋应放在哪些大血管经过的部位？',
          options: [
            '腋下、颈部、腹股沟',
            '额头和手心',
            '胸部和后背',
            '只敷额头即可',
          ],
          correctIndex: 0,
          feedback: { good: '我把冰毛巾敷在他额头和脖子上了！', bad: '我没敷对位置，他还在说热……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'heat_seizure',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他开始抽搐了！眼睛往上翻！是不是不行了！',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导紧急降温措施，救护车到达时患者体温已降至39度以下，送医后诊断为热射病经抢救后脱离生命危险',
    bad: '现场人员给患者喂水导致误吸，且未能及时降温，患者送医时多器官功能衰竭进入ICU抢救',
    prank: '',
  },
}
