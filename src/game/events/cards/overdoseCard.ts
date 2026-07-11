// ============================================================
// MPDS 协议卡片 23 — 过量/中毒
// 分诊级别: 危重（黄色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const overdoseCard: EmergencyScenario = {
  id: 'overdose',
  title: '药物过量',
  callerId: 'lu_jie',
  phoneNumber: '188****2222',
  baseStation: '海淀区五道口附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 23,
    title: '过量/中毒',
    chiefComplaint: '青年女性疑似服用过量安眠药，呼叫不应，有遗书',
    determinantCode: '23-D-2',
    hotCold: 'HOT',
    keyQuestions: [
      '吃了什么药？吃了多少？',
      '什么时候吃的？',
      '患者是否有意识？能否叫醒？',
      '有无呕吐？',
      '有无遗书或自杀倾向？',
    ],
  },

  openingLine: '喂！我室友好像吃药了！好多空药盒在旁边！我叫不醒她！她是不是自杀了？！',

  fourElements: {
    address: {
      vague: '海淀区五道口附近',
      partial: '五道口华清嘉园小区',
      full: '华清嘉园8号楼2单元501室，五道口地铁站B口出来往北走300米',
    },
    contact: '188****2222',
    condition: {
      chiefComplaint: '室友微信跟我说对不起，我冲进她房间发现地上好多空药盒，人躺在床上怎么叫都不醒',
      age: '26岁',
      gender: '女性',
      consciousness: '完全叫不醒，用力拍她也没反应',
      breathing: '呼吸非常浅，几乎听不到',
      patientCount: '1人',
      additional: [
        '旁边有安眠药盒和酒精空瓶',
        '可能有饮酒',
        '微信发消息大概二十分钟前',
        '最近她情绪一直不好',
      ],
    },
    purpose: '她是不是自杀！你们快来救救她！要不要催吐？！',
  },

  mpdsQuestions: [
    {
      id: 'mpds_overdose_drug',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '药物信息',
      questionText: '吃了什么药大概多少？',
      answer: '安眠药！艾司唑仑！盒子全空了至少一盒',
      answerVague: '药...好多药...不知道是什么...',
      ramblingAnswer: '艾司唑仑！那个安眠药的盒子全空了！至少一整盒20片！还有一瓶二锅头也空了半瓶！她平时有失眠吃这个药，但从来没吃过这么多！旁边还有一张纸条上面写着对不起。',
      panickedAnswer: '安眠药！艾司唑仑！一整盒都空了！还有半瓶白酒！她是不是想死啊！！你们快来！！',
      reveals: ['additional'],
      judgment: {
        question: '安眠药加酒精同时服用——这提示什么？',
        options: [
          { label: '安眠药合并酒精 高度危险', fills: [{ field: 'conditionNote', value: '安眠药合并酒精，呼吸抑制风险极高' }], isCorrect: true },
          { label: '酒精可中和药物作用 风险降低', fills: [{ field: 'conditionNote', value: '误判为酒精中和' }], isCorrect: false },
          { label: '只需观察 不需要特殊处理', fills: [{ field: 'conditionNote', value: '低估风险' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_overdose_breathing',
      category: 'breathing',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '意识呼吸',
      questionText: '她现在还有呼吸吗？',
      answer: '有...但是很浅很慢...像是睡着了一样',
      answerVague: '有...好像有...我不确定...',
      ramblingAnswer: '我刚才凑近了看她，胸口还在动，但是非常慢，大概十几秒才起伏一次。我拍她脸掐她人中都没有反应。她嘴巴周围有点发白，我感觉不太对劲。呼吸声几乎听不到。',
      panickedAnswer: '有！有呼吸！但是好慢好浅！像没有了一样！她是不是要死了？！',
      reveals: ['breathing'],
    },
  ],

  guidance: {
    title: '药物过量急救指导',
    intro: '不要催吐。保持患者呼吸道通畅。救护车马上就到。',
    steps: [
      {
        id: 'od_side',
        instruction: '让患者侧躺防止呕吐物窒息。',
        prompt: '第一步：侧卧体位',
        options: [
          '侧躺保持气道开放',
          '平躺',
          '坐着',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！侧躺可以防止呕吐物堵塞气道。',
          incorrect: '不对。平躺时如果发生呕吐，呕吐物容易进入气管导致窒息。应侧躺。',
          callerCorrect: '我把她翻过来了！侧着躺好了！但是她一点反应都没有……好吓人……',
          callerIncorrect: '她现在平躺着……我刚才想让她坐着但她根本坐不起来，跟个布娃娃一样。',
        },
      },
      {
        id: 'od_collect',
        instruction: '把空药盒和酒瓶收好带给医生。',
        prompt: '第二步：收集信息',
        options: [
          '收好药盒酒瓶带去医院',
          '扔掉证据',
          '不用管',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！药盒和酒瓶能帮助医生判断药物种类和剂量。',
          incorrect: '不对。药盒和酒瓶是医生判断药物种类和剂量最重要的依据，千万不要扔掉。',
          callerCorrect: '我把药盒和酒瓶都装塑料袋里了！还有那张纸条我也收好了！',
          callerIncorrect: '我刚才把那些东西都扔垃圾桶了……没想到还要用……',
        },
      },
      {
        id: 'od_observe',
        instruction: '如果呼吸停止立即开始CPR并通知我。',
        prompt: '第三步：观察呼吸',
        options: [
          '密切观察呼吸',
          '让她睡觉',
          '用冷水泼醒',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！密切观察呼吸变化是药物过量最关键的措施。',
          incorrect: '不对。药物过量患者处于深度抑制状态，不应打扰，但必须密切观察呼吸。',
          callerCorrect: '我一直在看着她！刚才她又呼吸了一次……虽然很慢但是还有……我害怕她突然就不喘了……',
          callerIncorrect: '我泼了她一脸冷水……她一点反应都没有……我是不是不应该这样？！',
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'od_breathing_decline',
      trigger: 'time_elapsed',
      triggerValue: '10',
      type: 'new_symptom',
      dialogue: '她呼吸越来越慢了！刚才还能看到胸口动，现在几乎看不出来了！怎么办！',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导侧卧并密切观察呼吸，患者因呼吸抑制在救护车到达时仅剩微弱呼吸，急救人员给予纳洛酮后呼吸改善，送医洗胃后脱离危险',
    bad: '家属急于催吐导致患者误吸胃内容物造成吸入性肺炎，且浪费了宝贵的急救时间',
    prank: '',
  },
}
