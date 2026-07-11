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
  correctTriage: 'yellow',

  mpdsCard: {
    number: 4,
    title: '袭击/性侵犯',
    chiefComplaint: '青年男性在街头被人打伤头部脸部流血意识模糊',
    determinantCode: '4-D-2',
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
        instruction: '用干净布料按压面部出血部位',
        prompt: '第二步：面部止血',
        options: [
          '按压面部止血',
          '仰头止血',
          '塞纸巾到鼻孔',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！直接按压出血部位是最有效的止血方法。',
          incorrect: '不对。仰头会让血液倒流进入咽喉，塞纸巾可能滑入鼻腔。',
          callerCorrect: '我用衣服按住了他的鼻子和脸上的伤口。血好像少了些。',
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
        id: 'assault_mg',
        instruction: '用布料持续按压伤口止血，保持压力。',
        prompt: '实操环节：持续按压止血',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我按住了！他脸上血止住了不少！',
          callerIncorrect: '我手一滑没按住，血又流出来了……',
        },
        miniGame: {
          kind: 'holdPressure',
          title: '持续按压止血',
          instruction: '用布料持续按压伤口止血，保持压力。',
          passThreshold: 0.5,
          holdSec: 8,
          bleedRatePerSec: 14,
          regainPerSec: 20,
          feedback: { good: '我按住了！他脸上血止住了不少！', bad: '我手一滑没按住，血又流出来了……' },
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
    good: '调度员指导颈椎保护和止血，伤者送医后诊断为轻度脑震荡和鼻骨骨折，住院观察两天后出院',
    bad: '路人试图扶伤者坐起造成颈椎二次损伤，伤者被诊断为颈椎挫伤伴神经压迫需要长期康复治疗',
    prank: '',
  },
}
