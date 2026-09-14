// ============================================================
// MPDS 协议卡片 16 — 眼部问题/损伤
// 分诊级别: 绿色（化学入眼为急症，正确分诊为黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const eyeInjuryCard: EmergencyScenario = {
  id: 'eye_injury',
  title: '化学物入眼',
  callerId: 'luo_wei',
  phoneNumber: '139****7777',
  baseStation: '海淀区上地信息产业基地',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 16,
    title: '眼部问题/损伤',
    chiefComplaint: '实验室工作人员被化学试剂溅入右眼疼痛剧烈无法睁眼',
    determinantCode: '16-C-1',
    hotCold: 'HOT',
    keyQuestions: [
      '什么东西进了眼睛',
      '眼睛还能不能睁开',
      '有没有用清水冲洗',
      '视力有没有受影响',
      '有没有戴隐形眼镜',
    ],
  },

  openingLine: '120吗！我在实验室做实验被试剂溅到眼睛了！右眼疼得睁不开一直流眼泪！我用洗眼器冲了一下但还是很疼！',

  fourElements: {
    address: {
      vague: '海淀区上地信息产业基地',
      partial: '上地信息路甲28号科实大厦',
      full: '科实大厦B座5层化学实验室，上地地铁站A口出向北300米',
    },
    contact: '139****7777',
    condition: {
      chiefComplaint: '配置溶液的时候一滴液体溅到右眼里了',
      age: '27岁',
      gender: '男性',
      consciousness: '清醒但疼得不行',
      breathing: '正常',
      patientCount: '1人',
      additional: [
        '是盐酸溶液大概1M浓度',
        '已经用洗眼器冲洗了约5分钟',
        '右眼通红一直流眼泪',
        '视力暂时没感觉下降但是看不清因为一直在流泪',
        '没有戴隐形眼镜',
      ],
    },
    purpose: '会不会瞎有没有什么药',
  },

  // ============================================================
  // 手写对话脚本 — 罗伟（工友）报告化学物入眼
  // 来电者个性：声音急促慌乱、不断追问会不会瞎
  // 关系：工友（对现场了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，楼层和位置。',
      caller: {
        calm: ['海淀区上地信息路甲28号科实大厦B座5层化学实验室。'],
        tense: ['上地！科实大厦！B座！5层！实验室！你们快来！'],
        panic: ['科实大厦！B座！5层！快来！'],
        lost: ['上地……科实大厦……5层……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '海淀区上地信息路甲28号科实大厦B座5层化学实验室' },
      outburst: '你们到底来不来啊！他眼睛会不会瞎啊！',
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
      operator: '大厦旁边有什么明显的标志吗？',
      caller: {
        calm: ['上地地铁站A口出向北300米。'],
        tense: ['地铁A口！向北300米！你们到了就能看到！'],
        panic: ['地铁A口……北边300米……'],
        lost: ['地铁口旁边……向北……'],
      },
      fillTerminal: { address: '海淀区上地信息路甲28号科实大厦B座5层化学实验室，上地地铁站A口出向北300米' },
      calmReply: {
        operatorCalm: '好，地铁A口，记下了。咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['做实验时盐酸溅到右眼了。', '疼得睁不开，一直流眼泪。', '已经用洗眼器冲了五分钟了。'],
        tense: ['盐酸溅到眼睛了！右眼！', '疼得睁不开！一直流眼泪！', '已经冲了五分钟了！'],
        panic: ['盐酸入眼了！！右眼！！', '疼得睁不开！！一直在冲水！！', '会不会瞎啊！！'],
        lost: ['盐酸溅到了……右眼……', '一直在冲水……但还是很疼……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '盐酸溅入右眼，疼痛剧烈，已冲洗5分钟', patientGender: '男性' },
      outburst: '他眼睛会不会瞎啊！！你们快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。盐酸入眼，已经在冲水——这些我记下了。你做得很对，继续冲别停，按我说的做。',
        calm: '好……继续冲。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他多大岁数？',
      caller: {
        calm: ['27岁。'],
        tense: ['27！他27！'],
        panic: ['27！！27岁！！'],
        lost: ['27……应该是27……'],
      },
      fillTerminal: { patientAge: '27岁' },
      calmReply: {
        operatorCalm: '好，27岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还清醒吗？呼吸怎么样？',
      caller: {
        calm: ['清醒，但疼得不行。', '呼吸正常。'],
        tense: ['清醒！但疼得厉害！', '呼吸正常！'],
        panic: ['清醒！！疼！！呼吸正常！！', '你们快来！！'],
        lost: ['还醒着……疼得厉害……', '呼吸正常……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，人清醒，呼吸正常，这我知道了。继续冲水，至少冲15分钟，别停。',
        calm: '好……继续冲。',
        tense: '行……知道了。',
        panic: '嗯……快……',
        lost: '……好。',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13977627777，就是这个号。'],
        tense: ['139……7762……7777！打这个就行！'],
        panic: ['139……这个手机！7777！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '139****7777' },
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
      id: 'mpds_eye_chemical',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '化学品',
      questionText: '是什么化学品入眼了？',
      answer: '盐酸！大概1M浓度的！',
      answerVague: '盐酸...浓度不高...',
      ramblingAnswer: '我们做酸碱滴定的时候我不小心把滴定管里的盐酸甩出来了，一滴溅到右眼里。浓度大概1摩尔不算很浓但是进眼睛还是很疼。我现在一直用洗眼器冲着呢。',
      panickedAnswer: '盐酸！1M的！怎么办啊会不会瞎！',
      reveals: ['additional'],
      judgment: {
        question: '盐酸入眼属于什么损伤？',
        options: [
          { label: '盐酸化学性眼损伤 持续冲洗至少15分钟', fills: [{ field: 'conditionNote', value: '盐酸化学性眼损伤，需持续冲洗' }], isCorrect: true },
          { label: '普通异物入眼 不需要持续冲洗', fills: [{ field: 'conditionNote', value: '误判为普通异物' }], isCorrect: false },
          { label: '酸碱中和即可 不需要冲洗', fills: [{ field: 'conditionNote', value: '错误处理方式' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_eye_flush',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -3,
      label: '持续冲洗',
      questionText: '冲洗多久了？有没有停？',
      answer: '冲了大概五分钟了还在冲',
      answerVague: '五分钟...没停...',
      ramblingAnswer: '冲了快五分钟了，一直在冲没停过。但是还是很疼啊，冲完之后感觉好一点点但还是一直疼。',
      panickedAnswer: '冲了！冲了五分钟了！但是还是很疼啊！是不是没用啊？！',
      reveals: ['additional'],
    },
  ],

  guidance: {
    title: '化学性眼损伤冲洗',
    intro: '继续冲洗不要停。化学入眼至少需要冲洗15到20分钟。',
    steps: [
      {
        id: 'eye_flush',
        instruction: '用大量流动清水冲洗至少15分钟不要停',
        prompt: '第一步：持续冲洗',
        options: [
          '继续冲洗至少15分钟',
          '冲洗5分钟就够了',
          '滴眼药水',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！化学入眼必须持续冲洗至少15分钟。',
          incorrect: '不对。化学入眼至少需要冲洗15到20分钟，冲洗不充分会造成持续损伤。',
          callerCorrect: '好的我继续冲！让同事帮我拿了个大瓶矿泉水一直在冲！',
          callerIncorrect: '我停了...冲了五分钟手都酸了...现在眼睛又开始疼了！怎么办！',
        },
      },
      {
        id: 'eye_technique',
        instruction: '翻开眼皮让水流到眼球各个角落',
        prompt: '第二步：冲洗技巧',
        options: [
          '翻开上下眼皮充分冲洗',
          '闭着眼冲',
          '用手揉眼睛',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！翻开眼皮才能冲洗到整个眼球表面。',
          incorrect: '不对。闭眼冲洗效果不佳，揉眼睛会造成二次损伤。应翻开眼皮充分冲洗。',
          callerCorrect: '我翻着眼皮冲了！感觉水流到眼球各个地方了！好多了！',
          callerIncorrect: '我闭着眼冲的...还是疼啊！是不是冲的方法不对？',
        },
      },
      {
        id: 'eye_hospital',
        instruction: '冲洗后仍然疼痛需要去医院检查',
        prompt: '第三步：就医',
        options: [
          '冲洗后去医院眼科',
          '不疼了就不用去了',
          '涂红霉素眼膏',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！化学入眼必须去医院做专业检查。',
          incorrect: '不对。即使症状缓解也必须去医院检查，角膜可能有隐性损伤。',
          callerCorrect: '冲完就去！旁边就有上地医院，我让同事陪我去！',
          callerIncorrect: '不去了...应该没事了吧...（几天后角膜溃疡来投诉了）',
        },
      },
      {
        id: 'eye_mg',
        instruction: '找到眼部冲洗位置，将施力点对准内眼角侧持续冲洗。',
        prompt: '实操环节：眼部冲洗定位',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我对着他眼睛冲了！水进去了！',
          callerIncorrect: '我没对准，水都流到脸上了……',
        },
        miniGame: {
          kind: 'quickChoice',
          title: '眼部冲洗方法',
          instruction: '选择正确的化学入眼冲洗方法。',
          passThreshold: 0.5,
          question: '化学物入眼后正确的冲洗方法是？',
          options: [
            '翻开眼皮持续冲洗至少15分钟',
            '闭着眼睛冲洗',
            '滴眼药水即可',
            '用手揉眼睛',
          ],
          correctIndex: 0,
          feedback: { good: '我对着他眼睛冲了！水进去了！', bad: '我没对准，水都流到脸上了……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'eye_pain_relief',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'caller_speaks',
      dialogue: '冲了快十分钟了，好像没那么疼了，眼睛能睁开一点了但还是有点模糊',
    },
  ],

  outcomeNarrative: {
    good: '你让他一直冲，冲满十五分钟。角膜上皮只是轻微损伤，两天就恢复了。',
    bad: '冲得不彻底，化学物一直在腐蚀。后来诊断成角膜化学性烧伤，要长期用药。',
    prank: '',
  },
}
