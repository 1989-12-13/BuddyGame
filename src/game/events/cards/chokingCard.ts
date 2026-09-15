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

  // ============================================================
  // 手写对话脚本 — 程欣（母亲）报告孩子气道异物窒息
  // 来电者个性：尖叫哭喊无法冷静、反复说孩子吃东西卡住了
  // 关系：母亲（对孩子了解）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['西城区月坛北街25号院2号楼3单元502。'],
        tense: ['月坛北街！25号院！2号楼！3单元502！你们快来！'],
        panic: ['月坛北街！25号院！502！快来啊！'],
        lost: ['月坛……25号院……502……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '西城区月坛北街25号院2号楼3单元502' },
      outburst: '你们到底来不来啊！孩子脸都紫了！',
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
      operator: '小区旁边有什么明显的标志吗？',
      caller: {
        calm: ['月坛北街，小区门口有个超市。'],
        tense: ['月坛北街！门口有超市！你们到了就能看到！'],
        panic: ['月坛北街……超市……门口！'],
        lost: ['好像有个超市……门口……'],
      },
      fillTerminal: { address: '西城区月坛北街25号院2号楼3单元502，小区门口有超市' },
      calmReply: {
        operatorCalm: '好，超市，记下了。你做得很好，咱继续。',
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
        calm: ['孩子吃果冻卡住了。', '脸都紫了，不哭不叫了。', '大概一分钟前卡的。'],
        tense: ['孩子吃果冻卡住了！脸都紫了！', '不哭不叫了！刚才还咳了两下！', '大概一分钟前！'],
        panic: ['果冻卡住了！！脸紫了！！', '不出声了！！你们快来！！', '他快不行了！！'],
        lost: ['吃果冻卡住了……', '脸紫了……不哭了……', '怎么办啊……'],
      },
      fillTerminal: { chiefComplaint: '幼儿吃果冻窒息，面色发紫，无声', patientGender: '男性' },
      outburst: '他不行了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。孩子吃果冻卡住了，脸紫了，不出声——这些我记下了。你现在是我唯一的帮手，按我说的做，他有机会。',
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
        calm: ['3岁。'],
        tense: ['3岁！今年3岁！'],
        panic: ['3岁！！3岁！！'],
        lost: ['3岁……对，3岁。'],
      },
      fillTerminal: { patientAge: '3岁' },
      calmReply: {
        operatorCalm: '好，3岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    // --- 步骤4：意识与呼吸 ---
    step4_vitals: {
      operator: '孩子还有意识吗？还在喘气吗？',
      caller: {
        calm: ['眼睛睁着但没反应。', '没有呼吸了，完全不出声了。'],
        tense: ['眼睛睁着但没反应！', '不出声了！胸口不动了！没有呼吸了！'],
        panic: ['没反应了！！眼睛睁着但不动！！', '不出声了！！没有呼吸！！', '你们快来啊！！'],
        lost: ['眼睛睁着……但不动了……', '不出声了……胸口也不动了……', '他是不是已经……'],
      },
      fillTerminal: { conscious: true, breathing: false },
      outburst: '他没气了！！你们快来啊！！他快死了！！',
      calmReply: {
        operatorCalm: '听我说。眼睛睁着但没反应，没有呼吸——这我知道了。现在你能救他。我会一步步教你做海姆立克，你按我说的来，每一秒都很重要。',
        calm: '好……我跟你做。',
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
        calm: ['15877625555，就是这个号。'],
        tense: ['158……7762……5555！打这个就行！'],
        panic: ['158……这个手机！5555！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '158****5555' },
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
    good: '你带着家属做海姆立克，拍到第三下果冻就出来了。孩子哭出声，送医检查没大碍。',
    bad: '家属慌了，把孩子倒过来控水，时间就这么耽误了。缺氧太久，得做高压氧治疗。',
    prank: '',
  },
}
