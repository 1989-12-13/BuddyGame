// ============================================================
// MPDS 协议卡片 4 — 袭击/性侵犯
// 分诊级别: 黄色
// ============================================================

import type { EmergencyScenario } from '../../types'

export const assaultCard: EmergencyScenario = {
  id: 'assault',
  title: '暴力袭击',
  callerId: 'he_lin',
  phoneNumber: '136****3333',
  baseStation: '东城区南锣鼓巷附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 4,
    title: '袭击/性侵犯',
    chiefComplaint: '青年男性在街头被人打伤头部脸部流血意识模糊',
    determinantCode: '4-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '发生了什么事',
      '有多少嫌疑人',
      '伤者有什么伤',
      '伤者意识是否清楚',
      '嫌疑人在不在现场',
    ],
  },

  openingLine: '喂是120吗，我在南锣鼓巷这边看到一个人被打了躺在地上满脸是血，打人的已经跑了',

  fourElements: {
    address: {
      vague: '东城区南锣鼓巷附近',
      partial: '南锣鼓巷主街中段',
      full: '南锣鼓巷主街中段靠近帽儿胡同路口，事发在一家奶茶店门口',
    },
    contact: '136****3333',
    condition: {
      chiefComplaint: '路过看到一个人被几个人拳打脚踢打倒在地上了',
      age: '25岁左右',
      gender: '男性',
      consciousness: '有点迷糊，问他话哼哼唧唧的不太清楚',
      breathing: '呼吸急促',
      patientCount: '1人',
      additional: [
        '脸上和鼻子在流血',
        '头上有肿包',
        '打人的已经往北跑了',
        '已经有人报警了',
      ],
    },
    purpose: '请快点派救护车他看起来伤得不轻',
  },

  // ============================================================
  // 手写对话脚本 — 何林（路人）报告街头暴力袭击伤者
  // 来电者个性：语气犹豫、不太确定现场情况、有点不知所措
  // 关系：路人（对伤者不了解）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体到路和路口。',
      caller: {
        calm: ['东城区南锣鼓巷主街中段，帽儿胡同路口附近。'],
        tense: ['南锣鼓巷！主街中段！帽儿胡同路口！你们快来！'],
        panic: ['南锣鼓巷！中段！帽儿胡同！快来！'],
        lost: ['南锣鼓巷……中段……快来……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '东城区南锣鼓巷主街中段靠近帽儿胡同路口' },
      outburst: '你们到底来不来啊！他还躺在地上流血！',
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
      operator: '旁边有什么店或者牌子吗？',
      caller: {
        calm: ['一家奶茶店门口。'],
        tense: ['奶茶店！就在他旁边！你们到了就能看到！'],
        panic: ['奶茶店……门口……就在路边！'],
        lost: ['好像有个店……我不确定……'],
      },
      fillTerminal: { address: '东城区南锣鼓巷主街中段帽儿胡同路口，奶茶店门口' },
      calmReply: {
        operatorCalm: '好，奶茶店门口，记下了。你做得对，现在咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    // --- 步骤2：事件经过 ---
    step2_event: {
      operator: '好，告诉我怎么回事。',
      caller: {
        calm: ['我路过看到一个人被几个人打了。', '拳打脚踢打倒在地了，打人的往北跑了。', '脸上和鼻子在流血。'],
        tense: ['几个人在打他！拳打脚踢！', '打倒在地了！打人的往北跑了！', '他满脸是血！'],
        panic: ['被打了！！好几个人！！', '满脸血！！打人的跑了！！', '你们快来！！'],
        lost: ['好几个人打他……', '他倒在地上了……', '我不敢靠近……'],
      },
      fillTerminal: { chiefComplaint: '头部外伤后意识模糊，面部出血', patientGender: '男性' },
      outburst: '他不动了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。被人打了，脸上流血，人迷糊——这些我记下了。你别移动他，按我说的做。',
        calm: '好……我不动他。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    // --- 步骤3：患者年龄 ---
    step3_age: {
      operator: '他大概多大岁数？',
      caller: {
        calm: ['25岁左右，年轻人。'],
        tense: ['25岁左右！看着年轻！'],
        panic: ['20多！年轻人！'],
        lost: ['20多岁……应该是……'],
      },
      fillTerminal: { patientAge: '25岁左右' },
      calmReply: {
        operatorCalm: '好，25岁左右，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    // --- 步骤4：意识与呼吸 ---
    step4_vitals: {
      operator: '他还有意识吗？能说话吗？',
      caller: {
        calm: ['有点迷糊，问他话哼哼唧唧的。', '眼睛半睁半闭，呼吸急促。'],
        tense: ['迷糊！叫不太应！', '眼睛半睁半闭！呼吸很急！', '后脑勺还肿了个包！'],
        panic: ['叫不太应了！！眼睛半睁半闭！！', '后脑勺在肿！！呼吸很急！！', '你们快来！！'],
        lost: ['叫不太应了……眼睛闭上了……', '他不会……不会吧……', '后脑勺在肿……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      outburst: '他没反应了！！刚才还能哼哼现在不动了！！快来啊！！',
      calmReply: {
        operatorCalm: '听我说。人迷糊、叫不太应——这我知道了。别移动他，可能有颈椎伤。我一步步告诉你怎么做。',
        calm: '好……我不动他。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    // --- 联系电话 ---
    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13677623333，就是这个号。'],
        tense: ['136……7762……3333！打这个就行！'],
        panic: ['136……这个手机！3333！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '136****3333' },
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
      id: 'mpds_assault_consciousness',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '意识',
      questionText: '伤者现在能说话能睁眼吗',
      answer: '能哼哼两声但是说不出完整的话，眼睛半睁半闭的',
      answerVague: '不太清楚...迷迷糊糊的...',
      ramblingAnswer: '我刚才蹲下来问他你怎么样听得到我说话吗，他眼睛睁开了一下又闭上了，嘴里含含糊糊的不知道在说什么。我拍他肩膀他也没什么反应。他后脑勺撞到台阶上了有一个包在肿起来。',
      panickedAnswer: '叫不醒！我喊了几声他眼睛张开一下又闭上了！后脑勺在肿！',
      reveals: ['consciousness'],
      judgment: {
        question: '头部外伤后意识模糊提示什么？',
        options: [
          { label: '意识水平下降 需高度警惕颅脑损伤', fills: [{ field: 'conditionNote', value: '头部外伤后意识水平下降，高度警惕颅脑损伤' }], isCorrect: true },
          { label: '可能是惊吓过度导致暂时性反应', fills: [{ field: 'conditionNote', value: '可能是惊吓反应' }], isCorrect: false },
          { label: '只是喝醉了或睡着了', fills: [{ field: 'conditionNote', value: '可能醉酒' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_assault_bleeding',
      category: 'bleeding',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '出血情况',
      questionText: '出血严不严重头部有没有凹陷',
      answer: '鼻子在流血但是不喷，头上有包但是好像没凹下去',
      answerVague: '鼻子流血...头上有包...',
      ramblingAnswer: '鼻子在往外流血，我用纸给他按住了一点，但是没有那种喷出来的感觉。头上肿了一个包在后脑勺靠左的位置，我轻轻碰了一下是硬的，感觉没有凹下去。',
      panickedAnswer: '鼻子一直在流血！头上肿了个大包！会不会颅内出血啊！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '暴力伤后急救指导',
    intro: '请不要移动伤者可能有颈椎损伤。我来指导您在救护车到达前应该怎么做。',
    steps: [
      {
        id: 'assault_spine',
        instruction: '不要移动伤者用手固定头部两侧',
        prompt: '第一步：固定颈椎',
        options: [
          '固定头部不要移动',
          '扶起来坐着',
          '让伤者转头看看',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！不要移动伤者，固定头部可以避免颈椎二次损伤。',
          incorrect: '不对。暴力袭击后可能有颈椎损伤，移动或转头会造成严重后果。',
          callerCorrect: '好的我不动他，我用手扶着他的头两边。他好像又闭眼了！',
          callerIncorrect: '我把他扶起来了...他头歪了一下...好像更难受了！',
        },
      },
      {
        id: 'assault_hemostasis',
        instruction: '找到伤口近心端的动脉（颞动脉/面动脉处），用布料持续用力按压止血',
        prompt: '第二步：近心端止血',
        options: [
          '按压近心端动脉止血',
          '仰头止血',
          '塞纸巾到鼻孔',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！按压近心端动脉是有效止血的关键。',
          incorrect: '不对。仰头会让血液倒流进入咽喉，塞纸巾可能滑入鼻腔。',
          callerCorrect: '我在他的脸颊和太阳穴附近找到了动脉的位置压住了！血好像不流了！',
          callerIncorrect: '我让他仰着头，他在咳嗽好像被血呛到了！',
        },
      },
      {
        id: 'assault_monitor',
        instruction: '观察意识变化如果完全昏迷立即报告',
        prompt: '第三步：持续观察',
        options: [
          '持续观察意识呼吸',
          '不用打扰他',
          '用冷水泼脸',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！持续观察意识状态变化至关重要。',
          incorrect: '不对。意识变化是判断伤情进展的关键指标，需要持续观察。',
          callerCorrect: '我一直看着他，他还在哼哼，眼睛闭着但睫毛在动。',
          callerIncorrect: '我没敢看他...太吓人了...我走远了一点等救护车。',
        },
      },
      {
        id: 'assault_position_game',
        instruction: '伤者面部出血，请选择正确的按压止血位置。',
        prompt: '实操环节：选择止血位置',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '正确！面部出血应在近心端的颞动脉/面动脉处按压。',
          incorrect: '不对。面部动脉出血应从头部侧面颞动脉近心端按压阻断血流。',
          callerCorrect: '我在他太阳穴附近找到了动脉的位置压住了！血止住了！',
          callerIncorrect: '我按在伤口上但血还是在流...',
        },
        miniGame: {
          kind: 'locationSelect',
          title: '头部止血位置',
          instruction: '伤者面部出血，应该在哪个位置按压止血？',
          passThreshold: 0.5,
          bodyPart: 'head',
          woundDesc: '面部伤口，活动性出血',
          options: [
            '头部侧面（颞动脉近心端）',
            '面部伤口处直接按压',
            '脖子两侧',
          ],
          correctIndex: 0,
          feedback: { good: '我在他太阳穴附近找到了动脉的位置压住了！血止住了！', bad: '我按在伤口上但血还是在流...' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'assault_unconscious',
      trigger: 'time_elapsed',
      triggerValue: '15',
      type: 'new_symptom',
      dialogue: '他好像没反应了刚才还能哼哼现在完全不动了！是不是昏过去了！',
    },
  ],

  outcomeNarrative: {
    good: '你没让旁人扶他坐起来，也压住了出血的地方。诊断是轻度脑震荡加鼻骨骨折，观察两天出院。',
    bad: '路人把伤者扶起来坐了一阵，脖子受了二次伤。后来查出颈椎挫伤压着神经，康复要做很久。',
    prank: '',
  },
}
