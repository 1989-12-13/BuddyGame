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
    good: '调度员指导保持端坐位并正确使用喷雾，患者保持呼吸通畅，救护车8分钟到达给予吸氧和雾化治疗后症状缓解送医',
    bad: '家人执意让孩子躺下导致呼吸困难加重，患者到达急救室时血氧饱和度已降至82%，需要无创呼吸机支持',
    prank: '',
  },
}
