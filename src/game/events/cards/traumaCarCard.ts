// ============================================================
// MPDS 协议卡片 29 — 交通/运输事故
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const traumaCarCard: EmergencyScenario = {
  id: 'trauma_car',
  title: '严重车祸',
  callerId: 'wang_xiao',
  phoneNumber: '139****5678',
  baseStation: '海淀区中关村大街附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 29,
    title: '交通/运输事故',
    chiefComplaint: '骑电动车被汽车撞击，外伤出血、脊柱疑似损伤',
    determinantCode: '29-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '发生了什么？（事故机制）',
      '有多少伤员？',
      '伤员是否被困/卡住？',
      '有活动性出血吗？',
      '伤员意识是否清醒？',
    ],
  },

  openingLine: '你好，这边出车祸了，一个骑电动车的人被汽车撞了，流了好多血，人还清醒但是动不了。',

  variants: [
    {
      id: 'multi_vehicle_highway',
      callers: ['chen_ming', 'lin_mei'],
      openingLine: '快！高速上追尾了，三辆车撞在一起，我车上有两个人出不来，后面还有一辆车上倒着一个人没动静！',
      purpose: '你们要派几辆车？我在哪个方向、哪个出口说清楚点好还是你们能定位我？',
      condition: {
        chiefComplaint: '高速公路连环追尾，多人受伤，其中一人无反应',
        age: '40岁上下',
        gender: '男性',
        consciousness: '一个卡在驾驶座能说话，另一个在后排没反应',
        breathing: '后排那位胸口起伏很弱，看着不太对',
        patientCount: '3人以上（其中一人无反应）',
        additional: [
          '追尾的是三辆私家车，最后一辆变形比较严重',
          '现场在高速主路上，后面车流还在往前挤',
          '已经有人在后面摆了三角牌，但不远',
          '有一辆车开始冒白烟，不确定是不是要起火',
        ],
      },
      answers: {
        mpds_bleeding: {
          answer: '看得见的就是脸上和手臂擦破流血，不像是喷的那种，主要是人卡住了出不来',
          answerVague: '有血……脸上……卡住了……',
          ramblingAnswer: '明面上能看到的是脸和胳膊蹭破在流血，面积不小，但是看着不是往外喷的那种。主要问题是中间那辆车后排的人卡住了，门打不开，我们几个在外面拉了半天拉不动。他一开始还哼哼，现在不太出声了。还有一辆车前面在冒白烟，我有点怕。',
          panickedAnswer: '好多人卡在里面出不来！！有个不动了！！还有车在冒烟！！你们再不来要出大事了！！',
        },
      },
      specialEvents: [
        {
          id: 'trauma_car_smoke',
          trigger: 'after_dispatch',
          triggerValue: '',
          type: 'new_symptom',
          dialogue: '冒烟那辆车的味道更重了，我们不敢再靠过去拉了！后排那个人还是没动静……这算不算要爆炸啊？',
        },
      ],
      outcomeNarrative: {
        good: '你把出事方向、大概里程和伤员人数一次说清，还提醒身后车流注意避让。救援力量分批到场，先救出了能说话的两名伤员。',
        bad: '地址在高速上说得很含糊，救援车来回多跑了一段。现场车流没及时清出通道，后到的救援车堵在路上进不来。',
      },
      menu: { category: '创伤出血', desc: '高速连环追尾 · 多人被困', tag: '🎯' },
    },
  ],

  fourElements: {
    address: {
      vague: '海淀区中关村大街附近',
      partial: '中关村大街和知春路交叉口',
      full: '中关村大街和知春路交叉口，海淀黄庄地铁站A2出口往北50米',
    },
    contact: '139****5678',
    condition: {
      chiefComplaint: '路边有个骑电动车的人被汽车撞了，腿在流血，人还醒着但动不了了',
      age: '30岁左右',
      gender: '男性',
      consciousness: '人是清醒的，能跟我说话',
      breathing: '呼吸看着还算正常',
      patientCount: '1人',
      additional: [
        '右腿有明显外伤，出血量较大',
        '自述腰部疼痛',
        '戴着头盔，头部无明显外伤',
      ],
    },
    purpose: '需要救护车和急救',
  },

  // ============================================================
  // 手写对话脚本 — 王晓（路人）报告车祸伤
  // 来电者个性：冷静有条理、主动提供信息、能配合指令
  // 关系：路人（对伤者不了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体位置。',
      caller: {
        calm: ['海淀区中关村大街和知春路交叉口。'],
        tense: ['中关村大街和知春路交叉口！你们快来！'],
        panic: ['中关村大街！知春路！快来！'],
        lost: ['中关村大街……知春路……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '海淀区中关村大街和知春路交叉口' },
      outburst: '他还在流血！！你们到底来不来啊！！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你紧张，救护车已经在路上了。咱接着说，每个问题都帮到他。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '路口旁边有什么明显的标志吗？',
      caller: {
        calm: ['海淀黄庄地铁站A2出口往北50米。'],
        tense: ['地铁A2出口！往北50米！你们到了就能看到！'],
        panic: ['地铁A2出口……北边50米……'],
        lost: ['地铁口旁边……往北……'],
      },
      fillTerminal: { address: '海淀区中关村大街和知春路交叉口，海淀黄庄地铁站A2出口往北50米' },
      calmReply: {
        operatorCalm: '好，地铁A2出口，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['一个骑电动车的人被汽车撞了。', '右腿在流血，人还醒着但动不了。', '他说腰疼。'],
        tense: ['骑电动车的被汽车撞了！', '右腿流血！人还醒着但动不了！', '他说腰疼！'],
        panic: ['被撞了！！腿在流血！！', '动不了了！！说腰疼！！', '你们快来！！'],
        lost: ['被车撞了……', '腿在流血……动不了……', '说腰疼……'],
      },
      fillTerminal: { chiefComplaint: '车祸致右腿外伤出血，腰痛，疑似脊柱损伤', patientGender: '男性' },
      outburst: '他血止不住！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。车祸，右腿流血，腰疼——这些我记下了。别移动他，可能有脊柱伤，按我说的做。',
        calm: '好……我不动他。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他大概多大岁数？',
      caller: {
        calm: ['30岁左右。'],
        tense: ['30岁左右！年轻人！'],
        panic: ['30岁！！年轻人！！'],
        lost: ['30岁……应该是……'],
      },
      fillTerminal: { patientAge: '约30岁' },
      calmReply: {
        operatorCalm: '好，30岁左右，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还清醒吗？呼吸怎么样？',
      caller: {
        calm: ['清醒，能跟我说话。', '呼吸看着还算正常。'],
        tense: ['清醒！能说话！', '呼吸还算正常！但腿在流血！'],
        panic: ['清醒！！能说话！！', '呼吸正常！！但血好多！！', '你们快来！！'],
        lost: ['还醒着……能说话……', '呼吸正常……但腿在流血……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，还清醒，这我知道了。用布按压伤口，别移动他，我一步步告诉你怎么做。',
        calm: '好……我按住了。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13977625678，就是这个号。'],
        tense: ['139……7762……5678！打这个就行！'],
        panic: ['139……这个手机！5678！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '139****5678' },
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
      id: 'mpds_bleeding',
      category: 'bleeding',
      tier: 'critical',
      timeCost: 3,
      stressEffect: -8,
      label: '出血严重吗？',
      questionText: '出血量大吗？是涌出来的还是一点点渗出来的？',
      answer: '挺多的，裤腿全湿了……但不是喷出来的那种。',
      answerVague: '好多血...裤子上都是...',
      ramblingAnswer: '挺多的...不是那种喷的，就是一直往外渗，他那个裤腿全湿透了，深色的裤子都被血染得发亮。我刚才试着用纸巾按了一下，根本止不住...不过不是嗞出来的那种，就感觉一直在流。他好像不太疼的样子，但出血量我觉得不少。',
      panickedAnswer: '好多血！！！裤子上地上都是！一直在流一直在流！你快说我要怎么止血啊！！！他不会死吧？！',
      reveals: ['additional', 'consciousness'],
      judgment: {
        question: '根据来电者描述「裤腿全湿、一直渗、不是喷出来的」，出血特征最可能是？',
        options: [
          { label: '动脉喷射性出血', sublabel: '危险！需即刻止血', fills: [{ field: 'conditionNote', value: '动脉喷射性出血' }], isCorrect: false },
          { label: '大面积静脉性渗血', sublabel: '量大但非喷射', fills: [{ field: 'conditionNote', value: '右腿大面积静脉性出血' }], isCorrect: true },
          { label: '少量毛细血管出血', sublabel: '不紧急', fills: [{ field: 'conditionNote', value: '少量外出血' }], isCorrect: false },
          { label: '内出血（体表无明显出血）', fills: [{ field: 'conditionNote', value: '疑似内出血' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '外伤出血控制',
    intro: '救护车正在路上。在等待期间，请帮助伤者控制出血。您能找到干净的布或者衣服吗？',
    steps: [
      {
        id: 'bleed_pressure',
        instruction: '请找到伤口近心端的动脉位置，用干净的布或衣物按压止血',
        prompt: '第一步：止血',
        options: [
          '用干净布直接按压伤口止血',
          '用酒精冲洗伤口',
          '用绳子扎紧伤口上方',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！直接按压是最有效的止血方法。',
          incorrect: '不对。酒精冲洗会刺激伤口加剧疼痛，扎止血带需要专业知识，直接按压是最安全有效的方法。',
          callerCorrect: '我用衣服死死压住了！血好像没刚才渗得那么快了……这是个好兆头吧？',
          callerIncorrect: '我拿酒精给他冲了一下……他疼得嗷嗷叫！是不是我做错了？！出血还是没止住！',
        },
      },
      {
        id: 'bleed_elevate',
        instruction: '如果可能的话，把伤者的腿稍微抬高一点，但要小心不要移动伤者。',
        prompt: '第二步：抬高伤处',
        options: [
          '在不移动身体的前提下抬高腿部',
          '把伤者扶起来坐着',
          '不用管，等救护车来就行',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！抬高伤处有助于减少出血，但千万不要移动疑似脊柱损伤的患者。',
          incorrect: '不对。切忌移动伤者（可能脊柱受伤），只需在不移动的前提下抬高伤处。',
          callerCorrect: '我小心翼翼地给他腿垫了一下，他说感觉比刚才好点了……还跟我说谢谢……',
          callerIncorrect: '他说腰疼得不行，我不敢动他了……但是他腿还在流血，我该怎么办？',
        },
      },
      {
        id: 'bleed_monitor',
        instruction: '请持续观察伤者的意识状态和呼吸，如果出现意识模糊或呼吸异常，立即告诉我。',
        prompt: '第三步：持续观察',
        options: [
          '持续观察意识和呼吸变化',
          '让伤者自己待着',
          '给伤者喝水',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！持续观察是及时发现病情变化的关键。',
          incorrect: '不对。外伤患者可能随时恶化，需要持续观察。另外不要给伤者饮水（可能需手术）。',
          callerCorrect: '我一直盯着他呢……他现在还醒着，在跟我说话。他说腰还是疼，但人还算清楚。',
          callerIncorrect: '他好像想睡觉了……眼睛快闭上了……让他睡一下可以吧？还是说……不能睡？',
        },
      },
      {
        id: 'bleed_position_game',
        instruction: '伤者右腿外伤大量出血，应该在哪个位置按压止血？',
        prompt: '实操环节：选择止血位置',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '正确！腿部出血应在股动脉近心端按压止血。',
          incorrect: '不对。腿部动脉出血需要在大腿根部近心端股动脉处按压阻断血流。',
          callerCorrect: '我在大腿根部找到了动脉按住了！布料被血浸了但我没松手！',
          callerIncorrect: '我直接按在伤口上但血还是流...',
        },
        miniGame: {
          kind: 'locationSelect',
          title: '选择止血位置',
          instruction: '伤者右腿外伤大量出血，应该在哪个位置按压止血？',
          passThreshold: 0.5,
          bodyPart: 'leg',
          woundDesc: '右腿外伤，大量出血',
          options: [
            '大腿根部（股动脉近心端）',
            '腿部伤口处',
            '脚踝',
          ],
          correctIndex: 0,
          feedback: { good: '我在大腿根部找到了动脉按住了！布料被血浸了但我没松手！', bad: '我直接按在伤口上但血还是流...' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'trauma_update',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '等等……伤者说他的腰越来越疼了，而且右腿好像没感觉了……',
    },
  ],

  outcomeNarrative: {
    good: '车祸伤员得到及时派车和现场止血指导，救护车11分钟后到达。伤员右腿骨折伴腰椎损伤，因现场处置得当，未造成二次伤害。',
    bad: '派车延迟且止血指导错误，伤员出血量较大。救护车到达时伤员已出现早期休克症状……',
    prank: '',
  },
}
