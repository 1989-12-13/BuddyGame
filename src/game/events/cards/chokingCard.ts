// ============================================================
// MPDS 协议卡片 11 — 窒息
// 分诊级别: 红色
// ============================================================

import type { EmergencyScenario } from '../../types'

export const chokingCard: EmergencyScenario = {
  id: 'choking',
  title: '气道异物窒息',
  callerId: 'cheng_xin',
  phoneNumber: '158****5555',
  baseStation: '西城区月坛附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 11,
    title: '窒息',
    chiefComplaint: '幼儿吃东西时卡住喉咙，无法说话咳嗽微弱面色发紫',
    determinantCode: '11-D-2',
    hotCold: 'HOT',
    keyQuestions: [
      '卡住多长时间了',
      '患者还能说话或咳嗽吗',
      '患者意识是否清楚',
      '吃了什么东西卡住的',
      '颜色有没有变',
    ],
  },

  openingLine: '救命啊！我孩子吃果冻卡住了！他脸都紫了！不哭不叫了！怎么办！！！',

  fourElements: {
    address: {
      vague: '西城区月坛附近',
      partial: '月坛北街',
      full: '月坛北街25号院2号楼3单元502',
    },
    contact: '158****5555',
    condition: {
      chiefComplaint: '三岁孩子吃果冻卡住喉咙了现在脸色发紫',
      age: '3岁',
      gender: '男性',
      consciousness: '眼睛睁着但没反应',
      breathing: '没有呼吸了完全不出声了',
      patientCount: '1人',
      additional: [
        '吃的是小杯果冻',
        '大概一分钟前卡的',
        '刚开始还咳了两下现在完全不咳了',
        '嘴唇开始发紫',
      ],
    },
    purpose: '救命啊他快不行了怎么救',
  },

  mpdsQuestions: [
    {
      id: 'mpds_ch_airway',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 1,
      stressEffect: -10,
      label: '气道阻塞',
      questionText: '他还能不能发出声音或咳嗽',
      answer: '不能了！完全不发声了！刚才还咳了两下现在什么声音都没有了！',
      answerVague: '不能了...没有声音了...',
      ramblingAnswer: '他刚才卡住的时候还咳了两声我以为他能自己咳出来，但是越咳声音越小，现在完全没声音了嘴一张一合的但是不出气不出声。脸从红变成紫了我真的吓死了！',
      panickedAnswer: '没声音了！嘴在动但是没有声音！脸发紫了！求求你们救救他！',
      reveals: ['additional'],
      judgment: {
        question: '患者无法发声、无法咳嗽、面色发紫，判断为？',
        options: [
          { label: '完全气道梗阻，需立即海姆立克法', fills: [{ field: 'conditionNote', value: '完全性气道梗阻，紧急处理' }], isCorrect: true },
          { label: '部分气道梗阻，可以继续观察', fills: [{ field: 'conditionNote', value: '部分气道梗阻' }], isCorrect: false },
          { label: '喉头水肿，需药物治疗', fills: [{ field: 'conditionNote', value: '喉头水肿可能' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '海姆立克急救法',
    intro: '情况非常紧急！孩子气道完全堵住了请立即按我说的做！',
    steps: [
      {
        id: 'ch_heimlich',
        instruction: '站或跪在孩子身后，一只手握拳放在孩子肚脐上方两横指处，另一手包住拳头，快速向内向上冲击5次',
        prompt: '第一步：海姆立克',
        options: [
          '腹部冲击5次（海姆立克法）',
          '抠喉咙',
          '倒过来抖',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！请立即执行！对3岁儿童使用海姆立克腹部冲击法。',
          incorrect: '不对！3岁儿童应使用海姆立克法——站或跪在身后，握拳放在脐上两横指处，快速向内向上冲击。',
          callerCorrect: '我跪在他后面了！握拳推了5下！果冻喷出来了！！！他哭了！！！',
          callerIncorrect: '我抠了他的喉咙...他吐了但是东西没出来...还是不出气...',
        },
      },
      {
        id: 'ch_chest',
        instruction: '如果5次冲击没出来，继续重复腹部冲击，直到异物排出或孩子失去意识',
        prompt: '第二步：持续冲击',
        options: [
          '继续腹部冲击直到排出',
          '放弃等救护车',
          '让孩子自己咳',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！持续腹部冲击直到异物排出或失去意识。',
          incorrect: '不对。完全性气道梗阻必须持续急救，不能等待。继续腹部冲击！',
          callerCorrect: '我又推了3下！他咳了一声然后果冻就喷出来了！他哭了！！！',
          callerIncorrect: '我停下来等救护车了...他脸越来越紫了...怎么办我是不是应该继续？！',
        },
      },
      {
        id: 'ch_cpr',
        instruction: '如果孩子失去意识躺下开始CPR',
        prompt: '第三步：CPR',
        options: [
          '失去意识立即开始CPR',
          '继续拍',
          '等他自己咳出来',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！一旦失去意识立即平放开始心肺复苏。',
          incorrect: '不对。失去意识时气道肌肉松弛，应平放立即开始CPR。',
          callerCorrect: '他刚才眼睛闭上了...我把他放平了开始按了！1...2...3...',
          callerIncorrect: '我还在拍...但是他不动了...眼睛闭上了...怎么办啊他是不是死了...',
        },
      },
      {
        id: 'ch_aim_game',
        instruction: '对准腹部实施海姆立克冲击。',
        prompt: '实操环节：海姆立克冲击',
        options: ['完成冲击'],
        correctIndex: 0,
        feedback: {
          correct: '冲击到位。',
          incorrect: '冲击不达标。',
          callerCorrect: '我冲击了！他咳了一声！东西好像动了！',
          callerIncorrect: '我位置没对准，冲击没效果。',
        },
        miniGame: {
          kind: 'quickChoice',
          title: '海姆立克腹部冲击',
          instruction: '选择正确的海姆立克冲击定位位置。',
          passThreshold: 0.5,
          question: '海姆立克冲击应定位在哪个位置？',
          options: [
            '腹部脐上两横指处',
            '胸骨正中',
            '背部肩胛骨之间',
            '喉结下方',
          ],
          correctIndex: 0,
          feedback: { good: '我冲击了！他咳了一声！东西好像动了！', bad: '我位置没对准，冲击没效果。' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'ch_clear',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'caller_speaks',
      dialogue: '出来了！果冻出来了！！！他哭了！！！他在哭了！！！他有呼吸了！！！',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导海姆立克急救法，背部拍击3次后果冻排出，孩子恢复呼吸和哭声，送医检查后无大碍',
    bad: '家属慌乱中把孩子倒过来控水耽误了时间，孩子因缺氧时间过长送医后需要高压氧治疗',
    prank: '',
  },
}
