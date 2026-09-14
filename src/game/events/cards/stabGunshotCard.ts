// ============================================================
// MPDS 协议卡片 27 — 刺伤/枪伤/穿透伤
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const stabGunshotCard: EmergencyScenario = {
  id: 'stab_gunshot',
  title: '刀刺伤',
  callerId: 'jiang_wen',
  phoneNumber: '130****5678',
  baseStation: '海淀区五道口附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 27,
    title: '刺伤/枪伤/穿透伤',
    chiefComplaint: '青年男性在街头斗殴中被刀刺伤胸部伤口处有气泡血',
    determinantCode: '27-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '是什么武器刺伤的',
      '刺伤在什么部位',
      '伤口有多深有没有异物',
      '出血情况如何',
      '患者意识是否清楚',
    ],
  },

  openingLine: '喂这里有人打架被捅了一刀！胸口在冒血！人还有意识但是很害怕！我已经报警了你们快来！',

  fourElements: {
    address: {
      vague: '海淀区五道口附近',
      partial: '五道口成府路与王庄路交叉口',
      full: '成府路与王庄路交叉口西北角书吧门口',
    },
    contact: '130****5678',
    condition: {
      chiefComplaint: '两伙人打架其中一个人被刀捅了左胸',
      age: '22岁',
      gender: '男性',
      consciousness: '还清醒但是很害怕一直在喘粗气',
      breathing: '呼吸很急促说喘不上气',
      patientCount: '1人',
      additional: [
        '左胸被捅了一刀',
        '刀已经被拔出来了掉在地上',
        '伤口在冒血还有气泡',
        '打人的也跑了',
      ],
    },
    purpose: '他胸口中刀了我能做什么',
  },

  // ============================================================
  // 手写对话脚本 — 蒋雯（路人）报告街头刀刺伤
  // 来电者个性：紧张但配合、压低声音、不断确认伤者状态
  // 关系：路人（对伤者不了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体位置。',
      caller: {
        calm: ['海淀区五道口成府路与王庄路交叉口西北角书吧门口。'],
        tense: ['五道口！成府路和王庄路交叉口！书吧门口！你们快来！'],
        panic: ['成府路和王庄路！书吧门口！快来！'],
        lost: ['五道口……成府路……书吧……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '海淀区五道口成府路与王庄路交叉口西北角书吧门口' },
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
      operator: '旁边有什么明显的店吗？',
      caller: {
        calm: ['书吧门口，旁边有个红色的奶茶店。'],
        tense: ['书吧门口！旁边有奶茶店！红色的！'],
        panic: ['书吧……奶茶店……门口！'],
        lost: ['有个店……书吧……'],
      },
      fillTerminal: { address: '海淀区五道口成府路与王庄路交叉口西北角书吧门口，旁边有红色奶茶店' },
      calmReply: {
        operatorCalm: '好，书吧旁边奶茶店，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['两伙人打架，一个人被刀捅了左胸。', '刀已经拔出来了，伤口在冒血还有气泡。', '打人的跑了。'],
        tense: ['被人捅了！左胸！', '刀拔出来了！伤口冒血还有气泡！', '打人的跑了！'],
        panic: ['左胸被捅了！！冒血！！', '有气泡！！跟血一起冒！！', '你们快来！！'],
        lost: ['被刀捅了……左胸……', '伤口冒血……有气泡……', '打人的跑了……'],
      },
      fillTerminal: { chiefComplaint: '左胸刀刺伤，开放性气胸，活动性出血', patientGender: '男性' },
      outburst: '他喘不上气了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。左胸被捅，伤口有气泡——这是开放性气胸，我记下了。别塞东西进伤口，按我说的做。',
        calm: '好……我不塞。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他大概多大岁数？',
      caller: {
        calm: ['22岁左右，年轻人。'],
        tense: ['22岁左右！年轻人！'],
        panic: ['22岁！！年轻人！！'],
        lost: ['20多岁……应该是……'],
      },
      fillTerminal: { patientAge: '约22岁' },
      calmReply: {
        operatorCalm: '好，22岁左右，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还清醒吗？呼吸怎么样？',
      caller: {
        calm: ['还清醒，但很害怕，一直在喘粗气。', '呼吸很急促，说喘不上气。'],
        tense: ['还清醒！但很害怕！', '呼吸很急促！说喘不上气！'],
        panic: ['清醒！！但喘不上气！！', '呼吸很急！！你们快来！！'],
        lost: ['还醒着……但很害怕……', '呼吸很急……喘不上气……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，还清醒，这我知道了。用保鲜膜盖住伤口贴三边，让他半坐着偏向伤侧，我一步步告诉你怎么做。',
        calm: '好……我找保鲜膜。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13077625678，就是这个号。'],
        tense: ['130……7762……5678！打这个就行！'],
        panic: ['130……这个手机！5678！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '130****5678' },
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
      id: 'mpds_stab_wound',
      category: 'bleeding',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '伤口情况',
      questionText: '刀还在不在伤口上？伤口在冒气泡吗？',
      answer: '刀被拔出来了掉在地上伤口有气泡冒出来',
      answerVague: '刀...拔了...有泡泡...',
      ramblingAnswer: '我到的时候刀已经掉在地上了不知道谁拔的。伤口在胸口左侧大概第三根肋骨的位置，血一冒一冒的而且有气泡跟血一起出来，呲呲的那种声音。他脸色发白嘴唇有点发紫说胸口很疼喘不上气。',
      panickedAnswer: '刀拔出来了！伤口冒泡！跟血一起冒泡泡！他是不是肺被捅穿了！',
      reveals: ['additional'],
      judgment: {
        question: '胸部穿透伤伴气泡提示什么？',
        options: [
          { label: '开放性气胸 需立即封闭伤口', fills: [{ field: 'conditionNote', value: '开放性气胸，需立即封闭伤口' }], isCorrect: true },
          { label: '张力性气胸 需穿刺减压', fills: [{ field: 'conditionNote', value: '张力性气胸' }], isCorrect: false },
          { label: '单纯软组织损伤', fills: [{ field: 'conditionNote', value: '软组织损伤' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_stab_conscious',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -3,
      label: '意识',
      questionText: '意识怎样？有没有恶化？',
      answer: '刚才还能说话现在越来越没力气的样子',
      answerVague: '没力气...说话...',
      ramblingAnswer: '刚开始的时候他还能跟我说他被捅了让我帮忙，现在他话越来越少了眼睛也快闭上了。我说你别睡啊他嗯了一声但是声音特别小。我感觉他快不行了你们快来吧。',
      panickedAnswer: '他要不行了！眼睛要闭上了！你们快到了没有！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '开放性气胸急救',
    intro: '伤者胸部被刺穿空气进入胸腔非常危险。请立即按我说的做。',
    steps: [
      {
        id: 'stab_seal',
        instruction: '用密封的塑料片或保鲜膜盖住伤口，边缘用胶带贴住三边。',
        prompt: '第一步：封闭伤口',
        options: [
          '用密封材料盖住伤口贴三边',
          '用纱布塞进伤口',
          '用毛巾压住',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。三边封闭形成活瓣，允许胸腔内气体排出但阻止空气进入。',
          incorrect: '不对。纱布塞入伤口会让异物进入胸腔，且无法密封。应使用不透气材料三边封闭。',
          callerCorrect: '我找了保鲜膜盖上了用胶带贴了三边！伤口不漏气了！',
          callerIncorrect: '我用纱布塞进去了但是血还在冒他更疼了！',
        },
      },
      {
        id: 'stab_position',
        instruction: '让伤者半坐卧位，身体倾向受伤一侧。',
        prompt: '第二步：体位',
        options: [
          '半坐卧位倾向伤侧',
          '平躺',
          '站着',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。半坐卧位倾向伤侧有助于健侧肺部扩张。',
          incorrect: '不对。应让伤者半坐卧位倾向伤侧，利于呼吸。',
          callerCorrect: '我扶他坐起来靠着我，往受伤那边靠着，他说这样好喘气一点。',
          callerIncorrect: '他躺平了说更喘不上气了。',
        },
      },
      {
        id: 'stab_observe',
        instruction: '观察呼吸，如果呼吸停止立即CPR。',
        prompt: '第三步：观察',
        options: [
          '观察呼吸意识',
          '喂水',
          '让他深呼吸',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确。持续观察呼吸和意识状态，出现变化及时报告。',
          incorrect: '不对。穿透伤不能喂水也不能深呼吸，应持续观察。',
          callerCorrect: '我一直看着他，他呼吸还是很急但至少没有更差，他还清醒着。',
          callerIncorrect: '我让他深呼吸了几下他说更疼了不敢喘气了。',
        },
      },
      {
        id: 'stab_position_game',
        instruction: '伤者胸部刀刺伤出血，请选择正确的按压止血位置。',
        prompt: '实操环节：选择止血位置',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '正确！胸部出血应在锁骨上方锁骨下动脉近心端按压阻断血流。',
          incorrect: '不对。胸部动脉出血需要在锁骨上方近心端按压锁骨下动脉。',
          callerCorrect: '我绕开刀在锁骨上方找到了动脉按住了！血没再喷了！',
          callerIncorrect: '我按在伤口上但刀还在...血还是往外涌...',
        },
        miniGame: {
          kind: 'locationSelect',
          title: '胸部止血位置',
          instruction: '伤者胸部被刀刺伤出血，应该在哪个位置按压止血？',
          passThreshold: 0.5,
          bodyPart: 'chest',
          woundDesc: '胸部刀刺伤，活动性出血',
          options: [
            '锁骨上方（锁骨下动脉近心端）',
            '胸口伤口处直接按压',
            '腹部按压',
          ],
          correctIndex: 0,
          feedback: { good: '我绕开刀在锁骨上方找到了动脉按住了！血没再喷了！', bad: '我按在伤口上但刀还在...血还是往外涌...' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'stab_worsen',
      trigger: 'time_elapsed',
      triggerValue: '10',
      type: 'new_symptom',
      dialogue: '他喘得更厉害了！说胸口越来越闷！嘴唇颜色发紫了！你们什么时候到！',
    },
  ],

  outcomeNarrative: {
    good: '你让他别去掏伤口，把伤口封住、姿势也摆对。车六分钟到，诊断是开放性气胸，引流之后恢复良好。',
    bad: '家属拿纱布往伤口里塞，伤口又没封上。后来成了张力性气胸，送医时呼吸循环已经很差。',
    prank: '',
  },
}
