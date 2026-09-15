// ============================================================
// MPDS 协议 2 — 过敏反应/蜇伤
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const anaphylaxisCard: EmergencyScenario = {
  id: 'anaphylaxis',
  title: '过敏性休克',
  callerId: 'wu_lili',
  phoneNumber: '158****4444',
  baseStation: '丰台区马家堡附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 2,
    title: '过敏反应/蜇伤',
    chiefComplaint: '中年男性被蜜蜂蜇伤后突发全身皮疹、呼吸困难、意识模糊',
    determinantCode: '2-D-2',
    hotCold: 'HOT',
    keyQuestions: [
      '接触了什么过敏原？',
      '症状从什么时候开始的？',
      '有没有呼吸困难和喉头水肿？',
      '有没有皮疹或荨麻疹？',
      '有没有过敏史？',
    ],
  },

  openingLine: '喂喂喂120吗！我老公被马蜂蜇了！脸肿得不像样了！喘不上气了！眼睛都快睁不开了！！！',

  fourElements: {
    address: {
      vague: '丰台区马家堡附近',
      partial: '马家堡嘉园二里小区',
      full: '嘉园二里小区18号楼1单元302室，小区东门有个水果店',
    },
    contact: '158****4444',
    condition: {
      chiefComplaint: '我老公在阳台上被马蜂蜇了，不到十分钟全身起疙瘩脸肿得变形了',
      age: '42岁',
      gender: '男性',
      consciousness: '还醒着，但眼神发直，不太对劲',
      breathing: '呼吸很困难，嗓子像被堵住了，喘得像拉风箱',
      patientCount: '1人',
      additional: [
        '刚才在阳台晾衣服被马蜂蜇了脖子',
        '大概不到十分钟前',
        '全身起红色风团',
        '以前被蜇过但没这么严重',
      ],
    },
    purpose: '他是不是不行了！脸都紫了！怎么办啊！',
  },

  // ============================================================
  // 手写对话脚本 — 吴丽丽（妻子）报告丈夫过敏性休克
  // 来电者个性：尖叫哭泣、语无伦次、需要反复安抚
  // 关系：妻子（对患者了解）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再报一遍，小区名和楼号。',
      caller: {
        calm: ['丰台区马家堡嘉园二里小区18号楼1单元302室。'],
        tense: ['马家堡！嘉园二里！18号楼1单元302！你们快来！'],
        panic: ['嘉园二里！18号楼！302！求求你们！'],
        lost: ['马家堡……嘉园二里……快来……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '丰台区马家堡嘉园二里小区18号楼1单元302室' },
      outburst: '你们到底来不来啊！我老公快不行了！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。下面每个问题都帮他争取时间。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    // --- 步骤1b：标志建筑 ---
    ask_landmark: {
      operator: '小区东门还是西门？旁边有什么店？',
      caller: {
        calm: ['东门，门口有个水果店。'],
        tense: ['东门！有个水果店！红色的招牌！'],
        panic: ['东门……水果店……你们到了就能看到！'],
        lost: ['东门……好像有个店……'],
      },
      fillTerminal: { address: '丰台区马家堡嘉园二里小区18号楼1单元302室，小区东门有水果店' },
      calmReply: {
        operatorCalm: '好，东门水果店，记下了。咱继续。',
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
        calm: ['我老公在阳台上被马蜂蜇了脖子。', '不到十分钟，全身起了一片一片的疙瘩，脸肿了。'],
        tense: ['他被马蜂蜇了！在阳台上！', '脸肿得不像样了！全身都是疙瘩！', '眼睛都睁不开了！'],
        panic: ['马蜂蜇的！！脸肿了！！全身疙瘩！！', '他眼睛睁不开了！！喘不上气！！', '你们快来啊！！'],
        lost: ['被蜂蜇了……脸全肿了……', '他快不行了……', '怎么办啊……'],
      },
      fillTerminal: { chiefComplaint: '马蜂蜇伤后全身过敏反应，面部肿胀，呼吸困难', patientGender: '男性' },
      outburst: '他不行了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。马蜂蜇伤，全身起疹，脸肿，喘不上气——这是严重过敏，我全记下了。你现在是我唯一的帮手，按我说的做，他有机会。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    // --- 步骤3：患者年龄 ---
    step3_age: {
      operator: '他多大岁数？',
      caller: {
        calm: ['42岁。'],
        tense: ['42！他今年42！'],
        panic: ['42！！42岁！！'],
        lost: ['42……应该是42……'],
      },
      fillTerminal: { patientAge: '42岁' },
      calmReply: {
        operatorCalm: '好，42岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    // --- 步骤4：意识与呼吸 ---
    step4_vitals: {
      operator: '他还有意识吗？能说话吗？喘气怎么样？',
      caller: {
        calm: ['还醒着，但眼神发直。', '喘气很费劲，嗓子像被堵住了。'],
        tense: ['还醒着！但眼神不对！', '嗓子像被堵住了！喘得像拉风箱！'],
        panic: ['眼神发直！！喘不上气！！', '嗓子堵住了！！声音都变了！！', '你们快来！！'],
        lost: ['眼神发直……叫不太应了……', '喘不上气……嗓子堵了……', '他不会……不会吧……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      outburst: '他喘不上气了！！脸都紫了！！你们快来啊！！',
      calmReply: {
        operatorCalm: '听我说。还醒着但呼吸困难——这我知道了。让他半坐着别躺平，我一步步告诉你怎么做。',
        calm: '好……我让他坐着。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    // --- 联系电话 ---
    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再报一遍，一个数字一个数字说。',
      caller: {
        calm: ['15877624444，就是这个号。'],
        tense: ['158……7762……4444！打这个就行！'],
        panic: ['158……这个手机！4444！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '158****4444' },
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
      id: 'mpds_ana_airway',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '呼吸道症状',
      questionText: '有没有喉咙发紧呼吸困难的感觉？',
      answer: '有！他指着脖子说喘不上气！声音都变了！',
      answerVague: '有...喘不上...',
      ramblingAnswer: '有！他现在喘得特别厉害！呼吸声就跟拉风箱一样，嘶嘶的那种声音！他说感觉有人掐着他脖子！而且他说话的声音都变了，变得很沙哑。脸从刚才开始越来越肿，特别是嘴唇和眼皮，肿得他眼睛都快睁不开了！',
      panickedAnswer: '有有有！！他说喘不上气！声音都变了！！怎么办啊！！',
      reveals: ['consciousness', 'breathing'],
      judgment: {
        question: '喉头水肿是过敏性休克最危险的体征',
        options: [
          { label: '喉头水肿 需要紧急处理', fills: [{ field: 'conditionNote', value: '喉头水肿，气道受阻风险极高' }], isCorrect: true },
          { label: '普通呼吸道感染', fills: [{ field: 'conditionNote', value: '可能只是普通感冒' }], isCorrect: false },
          { label: '焦虑引起的过度换气', fills: [{ field: 'conditionNote', value: '可能是过度换气' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_ana_history',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '有无过敏史和药物',
      questionText: '有没有过敏史？家里有肾上腺素笔吗？',
      answer: '以前被蜇过就红肿了一下，没有这个药',
      answerVague: '没...没有...',
      ramblingAnswer: '他以前也被马蜂蜇过，就肿了个包过两天就好了，从来没这样过。家里没有那个什么肾上腺素笔，从来没买过，也不知道去哪里买。',
      panickedAnswer: '没有！！什么都没有！！以前被蜇过没事！！谁知道这次会这么严重啊！！',
      reveals: ['additional'],
      judgment: {
        question: '既往有蜇伤史但此次反应加重说明什么？',
        options: [
          { label: '过敏反应可随每次暴露而加重', fills: [{ field: 'conditionNote', value: '既往有蜇伤史，本次反应显著加重' }], isCorrect: true },
          { label: '说明不是过敏', fills: [{ field: 'conditionNote', value: '认为不是过敏' }], isCorrect: false },
          { label: '需要等下次再观察', fills: [{ field: 'conditionNote', value: '等待下次观察' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '过敏性休克急救指导',
    intro: '这是严重的过敏反应，救护车已经在路上了。请按我说的做。',
    steps: [
      {
        id: 'ana_position',
        instruction: '让患者半坐卧位，不要躺平',
        prompt: '第一步：调整体位',
        options: [
          '半坐卧位保持呼吸通畅',
          '平躺垫高脚',
          '站着走动',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！半坐卧位有助于保持气道通畅。',
          incorrect: '不对。半坐卧位才能保持呼吸通畅，平躺会加重呼吸困难。',
          callerCorrect: '好的！我让他靠着沙发坐起来了！他现在喘得还是很厉害，但至少能喘上气了！',
          callerIncorrect: '我让他躺下了...他说躺下更喘不上气了...我又扶他坐起来了！怎么办？！',
        },
      },
      {
        id: 'ana_stinger',
        instruction: '如果蜂刺还在，用卡片刮掉不要捏',
        prompt: '第二步：去除过敏原',
        options: [
          '用卡片刮掉蜂刺',
          '用手指捏出来',
          '涂牙膏',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！用卡片刮掉不会挤压毒液囊。',
          incorrect: '不对。用手指捏会挤压毒液囊导致更多毒液注入。用卡片侧面刮掉。',
          callerCorrect: '看到了！有个小刺！我用门禁卡刮掉了！',
          callerIncorrect: '我用手指捏了一下...好像还有东西在里面...对不起我是不是做错了？',
        },
      },
      {
        id: 'ana_observe',
        instruction: '密切观察意识，一旦失去意识立即报告',
        prompt: '第三步：观察病情变化',
        options: [
          '观察意识呼吸准备CPR',
          '让他自己待着',
          '给他喝水',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！密切观察才能及时发现病情恶化。',
          incorrect: '不对。过敏患者病情变化很快，必须密切观察意识状态。',
          callerCorrect: '他一直睁着眼睛...但是眼神发直...我一直在跟他说话！他还能回答我！',
          callerIncorrect: '他说想喝水...我给他倒了一杯...他喝了两口好像更难受了...',
        },
      },
      {
        id: 'anaphylaxis_mg',
        instruction: '找到大腿外侧中部肌注位置，将施力点对准后锁定，模拟注射确认。',
        prompt: '实操环节：肾上腺素注射定位',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我扎了大腿外侧了！针打进去了！',
          callerIncorrect: '我扎的位置不太对，没敢推药……',
        },
        miniGame: {
          kind: 'quickChoice',
          title: '肾上腺素注射定位',
          instruction: '选择正确的肾上腺素注射部位。',
          passThreshold: 0.5,
          question: '肾上腺素应在哪个部位肌肉注射？',
          options: [
            '大腿外侧中部',
            '上臂三角肌',
            '臀部外上象限',
            '腹部皮下',
          ],
          correctIndex: 0,
          feedback: { good: '我扎了大腿外侧了！针打进去了！', bad: '我扎的位置不太对，没敢推药……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'ana_deterioration',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他说胸口更闷了！喘不上气！嘴唇颜色发紫了！你们到哪了？！',
    },
  ],

  outcomeNarrative: {
    good: '你让他别起身，就一直守着半坐的姿势。肾上腺素打下去没几分钟，喘就顺了，留院观察一天才回。',
    bad: '电话里没说清能不能平躺，家属把人放平了。喉头肿得更快，急救到场时已经严重缺氧，插管才把气道打开。',
    prank: '',
  },
}
