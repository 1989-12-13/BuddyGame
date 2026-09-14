// ============================================================
// MPDS 协议卡片 6 — 呼吸困难
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const asthmaCard: EmergencyScenario = {
  id: 'asthma',
  title: '哮喘发作',
  callerId: 'huang_qiang',
  phoneNumber: '139****1111',
  baseStation: '大兴区黄村附近',
  isPrank: false,
  correctTriage: 'yellow',

  mpdsCard: {
    number: 6,
    title: '呼吸困难',
    chiefComplaint: '儿童突发哮喘发作，端坐呼吸、喘鸣音、无法完整说话',
    determinantCode: '6-D-2',
    hotCold: 'HOT',
    keyQuestions: [
      '呼吸困难从什么时候开始的？',
      '患者能否完整说一句话？',
      '有没有哮鸣音（呼吸时的哨音）？',
      '有没有哮喘病史？有没有药物？',
      '有没有嘴唇发紫？',
    ],
  },

  openingLine: '120吗！我孩子哮喘犯了！从刚才开始喘得不行了！脸都白了！说不出话！你们快来！',

  fourElements: {
    address: {
      vague: '大兴区黄村附近',
      partial: '黄村镇兴业大街',
      full: '兴业大街76号金地仰山小区3号楼1单元201室，小区门口有个大药房',
    },
    contact: '139****1111',
    condition: {
      chiefComplaint: '孩子下午出去跑了一圈回来就开始咳嗽喘，现在越来越重了',
      age: '8岁',
      gender: '男性',
      consciousness: '清醒，但非常害怕',
      breathing: '喘得厉害，呼吸有嘶嘶声，说话只能两三个字',
      patientCount: '1人',
      additional: [
        '从小就有哮喘',
        '今天出门和同学踢球了',
        '平时用沙丁胺醇喷雾',
        '刚才吸了两次好像不管用',
      ],
    },
    purpose: '他吸了药也没用！还是喘得不行！是不是要去医院？！',
  },

  // ============================================================
  // 手写对话脚本 — 黄强（父亲）报告儿子哮喘发作
  // 来电者个性：声音发颤但努力配合、不断追问救护车还有多久
  // 关系：父亲（对孩子了解）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['大兴区黄村兴业大街76号金地仰山小区3号楼1单元201室。'],
        tense: ['黄村！兴业大街！金地仰山小区！3号楼1单元201！'],
        panic: ['金地仰山！3号楼！201！你们快来！'],
        lost: ['黄村……金地仰山……201……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '大兴区黄村兴业大街76号金地仰山小区3号楼1单元201室' },
      outburst: '你们到底还有多久到啊！孩子喘不上气了！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。咱接着说，每个问题都帮到孩子。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    // --- 步骤1b：标志建筑 ---
    ask_landmark: {
      operator: '小区门口有什么明显的店吗？',
      caller: {
        calm: ['小区门口有个大药房。'],
        tense: ['大药房！门口就是！你们到了就能看到！'],
        panic: ['药房……门口……大药房！'],
        lost: ['好像有个药房……门口……'],
      },
      fillTerminal: { address: '大兴区黄村兴业大街76号金地仰山小区3号楼1单元201室，小区门口有大药房' },
      calmReply: {
        operatorCalm: '好，大药房，记下了。你做得很好，咱继续。',
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
        calm: ['孩子下午出去跑了一圈，回来就开始咳嗽喘。', '越来越重了，现在说不出话。', '以前有哮喘，喷了两次药没用。'],
        tense: ['孩子出去跑了一圈回来就喘了！', '越来越厉害！说不出话了！', '喷了两次药没用！'],
        panic: ['喘得不行了！！说不出话！！', '脸都白了！！喷了药没用！！', '你们快来！！'],
        lost: ['跑了一圈回来就喘了……', '喷了药也没用……', '他会不会憋死……'],
      },
      fillTerminal: { chiefComplaint: '儿童哮喘发作，端坐呼吸，喷雾无效', patientGender: '男性' },
      outburst: '他喘不上气了！！脸都白了！！你们快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。孩子哮喘发作，喷了药没用，说不出话——这些我记下了。你按我说的做，他能缓过来。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    // --- 步骤3：患者年龄 ---
    step3_age: {
      operator: '孩子多大？',
      caller: {
        calm: ['8岁。'],
        tense: ['8岁！今年8岁！'],
        panic: ['8岁！！8岁！！'],
        lost: ['8岁……对，8岁。'],
      },
      fillTerminal: { patientAge: '8岁' },
      calmReply: {
        operatorCalm: '好，8岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    // --- 步骤4：意识与呼吸 ---
    step4_vitals: {
      operator: '孩子还有意识吗？喘气怎么样？',
      caller: {
        calm: ['清醒，但很害怕。', '喘得厉害，呼吸有嘶嘶声。', '说话只能两三个字。'],
        tense: ['清醒！但很害怕！', '喘得厉害！有嘶嘶声！', '说话只能蹦两三个字！'],
        panic: ['清醒！！但很害怕！！', '喘得不行了！！有嘶嘶声！！', '说不出话了！！你们快来！！'],
        lost: ['还醒着……但很害怕……', '喘得厉害……嘶嘶声……', '他说妈妈我害怕……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      outburst: '他嘴唇发灰了！！指甲也变了！！你们到哪了！！',
      calmReply: {
        operatorCalm: '听我说。还清醒但喘得厉害——这我知道了。让他坐着别躺下，我一步步告诉你怎么做。',
        calm: '好……我让他坐着。',
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
        calm: ['13977621111，就是这个号。'],
        tense: ['139……7762……1111！打这个就行！'],
        panic: ['139……这个手机！1111！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '139****1111' },
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
      id: 'mpds_asthma_medication',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '用药情况',
      questionText: '有没有用哮喘喷雾？用了几次？',
      answer: '用了沙丁胺醇，喷了两次，但是没效果',
      answerVague: '喷了...没效果...',
      ramblingAnswer: '他平时犯病的时候喷两下就好了，但是今天喷了两次一点用都没有。而且他以前犯病没这么重过，现在嘴唇都开始有点发白了，坐着不能动，一躺下就喘得更厉害。他跟我说妈妈我害怕我喘不上气了。',
      panickedAnswer: '喷了两次沙丁胺醇！一点用都没有！他嘴唇都白了！他说喘不上气！你们快来！！',
      reveals: ['additional'],
      judgment: {
        question: '喷雾无效加静息时呼吸困难——这提示什么？',
        options: [
          { label: '重度哮喘发作需紧急送医', fills: [{ field: 'conditionNote', value: '重度哮喘发作，喷雾无效' }], isCorrect: true },
          { label: '轻度哮喘 继续观察即可', fills: [{ field: 'conditionNote', value: '误判为轻度哮喘' }], isCorrect: false },
          { label: '哮喘已自愈 不需处理', fills: [{ field: 'conditionNote', value: '错误判断' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_asthma_position',
      category: 'mechanism',
      tier: 'important',
      timeCost: 1,
      stressEffect: -3,
      label: '体位',
      questionText: '他现在能躺下吗？',
      answer: '不能，只能坐着，一躺就说憋得慌',
      answerVague: '不能躺...坐着...',
      ramblingAnswer: '完全不能躺，我刚才试了一下，让他躺下他立刻就坐起来了，说憋得不行。他现在就是弓着背坐在床边，两手撑着膝盖，呼哧呼哧喘气。看着特别难受。',
      panickedAnswer: '不能！他一躺就说喘不上气！就非要坐着！怎么回事啊他会不会憋死？！',
      reveals: ['consciousness'],
    },
  ],

  guidance: {
    title: '哮喘发作急救指导',
    intro: '救护车马上就到。在等待期间帮孩子保持舒服的姿势。',
    steps: [
      {
        id: 'as_position',
        instruction: '让孩子坐直身体前倾，不要躺下。',
        prompt: '第一步：正确体位',
        options: [
          '坐直身体前倾',
          '平躺休息',
          '站着走动',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！坐直身体前倾可以帮助打开气道，让呼吸更顺畅。',
          incorrect: '不对。平躺会加重呼吸困难，应保持坐直前倾的体位。',
          callerCorrect: '他坐好了！弓着背坐在床边！好像比刚才好一点点……但还是在喘！',
          callerIncorrect: '我让他躺下了……他喘得更厉害了！一直在挣扎要坐起来！怎么办！',
        },
      },
      {
        id: 'as_medication',
        instruction: '可以每隔20分钟再喷一次沙丁胺醇，最多3次。',
        prompt: '第二步：正确用药',
        options: [
          '隔20分钟再喷最多3次',
          '一直连续喷',
          '不要再用了',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！沙丁胺醇按需使用，间隔20分钟重复，最多3次是安全的。',
          incorrect: '不对。连续过量使用可能导致药物副作用，但完全不用又会延误治疗。应间隔20分钟重复使用。',
          callerCorrect: '好！我设了个20分钟的闹钟！等时间到了我再给他喷一次！他现在还是一直喘，我害怕……',
          callerIncorrect: '我刚才让他连续喷了好几次……他现在手都在抖……是不是喷太多了？！',
        },
      },
      {
        id: 'as_calm',
        instruction: '安抚孩子让他慢慢呼吸不要紧张。',
        prompt: '第三步：安抚情绪',
        options: [
          '安抚情绪引导慢呼吸',
          '让他深呼吸使劲吸',
          '不要打扰他',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！安抚情绪、引导慢呼吸可以减轻呼吸困难的恐慌感。',
          incorrect: '不对。使劲深呼吸反而会加重气道痉挛和恐慌，应温和引导缓慢呼吸。',
          callerCorrect: '我在他身边蹲着跟他说别怕爸爸在！跟爸爸一起慢慢呼吸！他好像没那么慌了……',
          callerIncorrect: '我让他使劲深呼吸……但是他越使劲喘得越厉害……脸都憋红了！',
        },
      },
      {
        id: 'asthma_mg',
        instruction: '帮助患者找到呼吸节奏，跟随节拍辅助按压胸廓辅助呼气。',
        prompt: '实操环节：辅助呼吸节奏',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我跟着他呼吸按节奏了！他说这样好受一点！',
          callerIncorrect: '我节奏没跟上，他喘得更厉害了……',
        },
        miniGame: {
          kind: 'rhythmPress',
          title: '辅助呼吸节奏',
          instruction: '帮助患者找到呼吸节奏，跟随节拍辅助按压胸廓辅助呼气。',
          passThreshold: 0.5,
          targetBpm: 80,
          bpmTolerance: 10,
          durationSec: 12,
          feedback: { good: '我跟着他呼吸按节奏了！他说这样好受一点！', bad: '我节奏没跟上，他喘得更厉害了……' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'as_lips_blue',
      trigger: 'time_elapsed',
      triggerValue: '15',
      type: 'new_symptom',
      dialogue: '他嘴唇好像有点发灰了！指甲也是！是不是更严重了？！你们快到了吗！',
    },
  ],

  outcomeNarrative: {
    good: '你让家长保持端坐，喷雾也按对了。车八分钟到，吸氧加雾化之后人就松快了。',
    bad: '家人执意让孩子躺下，呼吸反而更费劲。进急救室时血氧已经掉到 82%，上了无创呼吸机。',
    prank: '',
  },
}
