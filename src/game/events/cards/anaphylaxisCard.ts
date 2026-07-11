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
    good: '调度员准确识别过敏性休克并指导半坐卧位，患者7分钟后接受肾上腺素注射，症状迅速缓解，住院观察24小时后出院',
    bad: '患者平躺后喉头水肿进一步加重导致气道阻塞，急救人员到达时已出现严重缺氧，需要紧急气管插管',
    prank: '',
  },
}
