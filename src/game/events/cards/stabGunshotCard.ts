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
    determinantCode: '27-D-2',
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
    good: '调度员指导封闭伤口和正确体位，救护车6分钟到达送医后诊断为开放性气胸行胸腔闭式引流术术后恢复良好',
    bad: '家属用纱布塞入伤口导致异物进入胸腔且未封闭伤口，伤者出现张力性气胸送医时已出现严重呼吸循环障碍',
    prank: '',
  },
}
