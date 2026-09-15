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

  // ============================================================
  // 手写对话脚本 — 范涛（同事）报告同事热射病
  // 来电者个性：着急但能配合、不断描述患者状态变化
  // 关系：同事（对现场了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体位置。',
      caller: {
        calm: ['朝阳区奥林匹克森林公园南门入口，右手边跑道旁。'],
        tense: ['奥林匹克森林公园！南门！跑道旁！你们快来！'],
        panic: ['森林公园南门！跑道！快来！'],
        lost: ['森林公园……南门……跑道……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '朝阳区奥林匹克森林公园南门入口右手边跑道旁' },
      outburst: '他烫得跟火炉一样！！你们到底来不来啊！！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。咱接着说，每个问题都帮到他。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '南门旁边有什么明显的标志吗？',
      caller: {
        calm: ['地铁森林公园南门站B口。'],
        tense: ['地铁B口！森林公园南门站！你们到了就能看到！'],
        panic: ['地铁B口……南门站……'],
        lost: ['地铁口旁边……南门……'],
      },
      fillTerminal: { address: '朝阳区奥林匹克森林公园南门入口右手边跑道旁，地铁森林公园南门站B口' },
      calmReply: {
        operatorCalm: '好，地铁B口，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['同事中午在公园跑步突然倒下了。', '身上滚烫，皮肤干干的没有汗。', '叫不醒了。'],
        tense: ['同事跑步倒下了！身上滚烫！', '皮肤干干的！没有汗！', '叫不醒了！'],
        panic: ['倒下了！！滚烫！！', '没有汗！！叫不醒了！！', '你们快来！！'],
        lost: ['跑步倒下了……', '身上烫……没有汗……', '叫不醒了……'],
      },
      fillTerminal: { chiefComplaint: '户外跑步后倒地昏迷，皮肤干热无汗，高热', patientGender: '男性' },
      outburst: '他不行了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。跑步后倒地，身上干热无汗——这是热射病，我记下了。把他挪到阴凉处，按我说的做。',
        calm: '好……已经挪到树荫下了。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他多大岁数？',
      caller: {
        calm: ['40岁。'],
        tense: ['40！他40！'],
        panic: ['40！！40岁！！'],
        lost: ['40……应该是40……'],
      },
      fillTerminal: { patientAge: '40岁' },
      calmReply: {
        operatorCalm: '好，40岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还有意识吗？还在喘气吗？',
      caller: {
        calm: ['叫不醒，完全没反应。', '呼吸非常急促，在喘。'],
        tense: ['叫不醒！完全没反应！', '呼吸很急！在喘！'],
        panic: ['叫不醒了！！没反应！！', '呼吸很急！！在喘！！', '你们快来！！'],
        lost: ['叫不醒了……', '呼吸很急……在喘……', '他不会……不会吧……'],
      },
      fillTerminal: { conscious: false, breathing: true },
      outburst: '他开始抽搐了！！眼睛往上翻！！你们快来啊！！',
      calmReply: {
        operatorCalm: '听我说。叫不醒但在喘——这我知道了。脱掉上衣，往身上泼凉水，扇风。我一步步告诉你怎么做。',
        calm: '好……我脱了他上衣。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['15177629999，就是这个号。'],
        tense: ['151……7762……9999！打这个就行！'],
        panic: ['151……这个手机！9999！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '151****9999' },
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
    good: '你抓住降温这一步先做。车到时体温已经降到 39 以下，热射病抢救之后脱离了危险。',
    bad: '现场给患者喂水，呛了一下，降温也没跟上。送医时已经多器官衰竭，直接进了 ICU。',
    prank: '',
  },
}
