// ============================================================
// MPDS 协议 21 — 出血/撕裂伤
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const hemorrhageCard: EmergencyScenario = {
  id: 'hemorrhage',
  title: '刀割伤大出血',
  callerId: 'ye_xin',
  phoneNumber: '186****3333',
  baseStation: '东城区鼓楼大街附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 21,
    title: '出血/撕裂伤',
    chiefComplaint: '青年男性手臂被碎玻璃割伤，活动性喷射状出血',
    determinantCode: '21-D-3',
    hotCold: 'HOT',
    keyQuestions: [
      '出血部位在哪里？',
      '出血是涌出来的还是喷出来的？',
      '有无异物残留？',
      '伤员意识是否清楚？',
      '出血持续多久了？',
    ],
  },

  openingLine: '出事了！我朋友摔了一跤胳膊撞碎了玻璃门，手臂被划了一个大口子！血往外喷！怎么都止不住！',

  fourElements: {
    address: {
      vague: '东城区鼓楼大街附近',
      partial: '鼓楼大街乙28号餐厅',
      full: '鼓楼大街乙28号老北京炸酱面馆，鼓楼往南200米路东',
    },
    contact: '186****3333',
    condition: {
      chiefComplaint: '朋友喝了点酒出门的时候滑倒了，胳膊撞碎了玻璃门，一个大血口子',
      age: '29岁',
      gender: '男性',
      consciousness: '还清醒但脸色发白看起来很害怕',
      breathing: '呼吸很快，吓到了',
      patientCount: '1人',
      additional: [
        '右前臂内侧被玻璃划伤',
        '血是一阵一阵喷出来的',
        '地上已经流了一大滩血',
        '有一块玻璃茬子还插在胳膊上',
      ],
    },
    purpose: '血止不住！快想办法！我要不要把那块玻璃拔出来？！',
  },

  mpdsQuestions: [
    {
      id: 'mpds_hem_bleed_type',
      category: 'bleeding',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '出血特征',
      questionText: '血是喷出来的还是流出来的？',
      answer: '喷的！一阵一阵的！跟心跳一样！',
      answerVague: '喷的...红色的...',
      ramblingAnswer: '喷的！红色的血一阵一阵往外喷，跟脉搏一样一突一突的！地上已经一大滩了，他那个白衬衫整个袖子都红了！我看着就觉得头晕！他脸色也越来越白了！是不是动脉破了？！',
      panickedAnswer: '喷的喷的！！跟水龙头一样！！一阵一阵的！！地上全是血！！',
      reveals: ['consciousness'],
      judgment: {
        question: '喷射状出血提示什么？',
        options: [
          { label: '动脉损伤 需紧急止血', fills: [{ field: 'conditionNote', value: '喷射状出血，考虑动脉损伤' }], isCorrect: true },
          { label: '静脉损伤 出血不严重', fills: [{ field: 'conditionNote', value: '可能是静脉出血' }], isCorrect: false },
          { label: '毛细血管出血 不用管', fills: [{ field: 'conditionNote', value: '可能是毛细血管出血' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_hem_foreign',
      category: 'bleeding',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '异物',
      questionText: '伤口里有没有东西？',
      answer: '有一块玻璃扎在里面...我不敢拔',
      answerVague: '有...玻璃...',
      ramblingAnswer: '有一块玻璃茬子还插在他胳膊上！大概有手指那么长，斜着扎进去的，周围还在往外冒血！我不敢碰那个玻璃！他疼得龇牙咧嘴的！',
      panickedAnswer: '有！！玻璃还在里面！！我不敢拔！！我要不要拔掉？！',
      reveals: ['additional'],
      judgment: {
        question: '伤口内有异物应该如何处理？',
        options: [
          { label: '保留异物不要拔出 绕开加压止血', fills: [{ field: 'conditionNote', value: '伤口内异物保留' }], isCorrect: true },
          { label: '立刻拔出异物', fills: [{ field: 'conditionNote', value: '已拔出异物' }], isCorrect: false },
          { label: '用酒精冲洗伤口', fills: [{ field: 'conditionNote', value: '已冲洗伤口' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '动脉出血紧急止血',
    intro: '这是动脉出血非常危险。请您按我说的做，先不要管玻璃。',
    steps: [
      {
        id: 'hem_press',
        instruction: '用干净的布或毛巾直接用力按压在伤口上',
        prompt: '第一步：直接按压',
        options: [
          '用干净布料直接按压伤口',
          '拔出玻璃再止血',
          '用酒精冲洗',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！持续用力按压是止血的关键。',
          incorrect: '不对。不要拔出异物，也不要冲洗。用布料直接按压在伤口上。',
          callerCorrect: '我找了条干净毛巾压上去了！按住了！血好像没喷那么厉害了！但是毛巾很快就红了！',
          callerIncorrect: '我先把玻璃拔出来了...天哪血喷得更厉害了！喷了我一身！！怎么办怎么办！！',
        },
      },
      {
        id: 'hem_bandage',
        instruction: '用绷带或布条紧紧缠绕包扎',
        prompt: '第二步：加压包扎',
        options: [
          '紧紧缠绕加压包扎',
          '用创可贴贴上',
          '撒止血药粉',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！加压包扎可以持续止血。',
          incorrect: '不对。创可贴太小，止血药粉也不适合动脉出血。需要用绷带或布条紧紧缠绕。',
          callerCorrect: '我找了条围巾！在毛巾外面紧紧缠了两圈系住了！血好像止住了一些！',
          callerIncorrect: '我贴了几个创可贴...血从边上又流出来了...创可贴太小了根本没用！',
        },
      },
      {
        id: 'hem_elevate',
        instruction: '让伤员躺下抬高伤肢',
        prompt: '第三步：抬高伤肢',
        options: [
          '躺下抬高伤肢',
          '坐着不动',
          '站起来走动',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！抬高伤肢可以减少出血量。',
          incorrect: '不对。伤员应躺下减少耗氧，同时抬高伤肢利用重力减少出血。',
          callerCorrect: '我让他躺下来了！把胳膊垫高放在沙发靠背上！他还在发抖...但好像比刚才好一点了！',
          callerIncorrect: '他站着走来走去...地上又滴了一路血...我是不是应该让他躺下？',
        },
      },
      {
        id: 'hem_position_game',
        prompt: '实操环节：选择止血位置',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '正确！动脉出血应在伤口近心端的动脉止血点按压。',
          incorrect: '不对。动脉出血应从近心端阻断血流，上臂内侧肱动脉是正确位置。',
          callerCorrect: '我按住了上臂内侧的位置！血好像不喷了！',
          callerIncorrect: '我按在了伤口上...但是血还在往外冒...',
        },
        miniGame: {
          kind: 'locationSelect',
          title: '手臂止血位置',
          instruction: '伤者前臂中段被玻璃割伤、动脉喷射状出血。应该在哪个位置按压止血？',
          passThreshold: 0.5,
          bodyPart: 'arm',
          woundDesc: '前臂中段伤口，动脉喷射状出血',
          options: [
            '上臂内侧（肱动脉近心端）',
            '伤口处直接按压',
            '手腕脉搏处',
          ],
          correctIndex: 0,
          feedback: { good: '我按住了上臂内侧的位置！血好像不喷了！', bad: '我按在了伤口上...但是血还在往外冒...' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'hem_dizziness',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他说头晕眼花......刚才还能说话现在好像听不太清我在说什么了......是不是失血太多了？',
    },
  ],

  outcomeNarrative: {
    good: '调度员指导有效加压止血，伤员在失血约800ml后止血成功，救护车10分钟到达，送医后行血管吻合术恢复良好',
    bad: '家属将玻璃拔出导致二次损伤和更大量出血，伤员陷入失血性休克，抢救后虽保住手臂但需要长期康复',
    prank: '',
  },
}
