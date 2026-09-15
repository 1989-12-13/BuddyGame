// ============================================================
// MPDS 协议卡片 28 — 卒中（脑血管意外）
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'

export const strokeCard: EmergencyScenario = {
  id: 'stroke',
  title: '疑似脑卒中',
  callerId: 'zhang_xiulan',
  phoneNumber: '136****9012',
  baseStation: '西城区金融街附近',
  isPrank: false,
  correctTriage: 'red',
  decayMultiplier: 0.9, // 卒中进展较缓

  mpdsCard: {
    number: 28,
    title: '卒中（脑血管意外）',
    chiefComplaint: '老年男性突然口角歪斜、言语不清、单侧肢体无力，发病<4.5h',
    determinantCode: '28-C-1',
    hotCold: 'HOT',
    keyQuestions: [
      '症状何时开始？（精确到分钟）',
      '能否微笑？（面部对称性）',
      '能否双手平举？（肢体无力）',
      '说话是否清晰？（语言障碍）',
      '有无高血压/心脏病史？',
    ],
  },

  openingLine: '喂？是120吗？我……我们老头子刚才吃饭的时候突然嘴歪了，话也说不清楚了，右手抬不起来了……这是咋回事啊？',

  variants: [
    {
      id: 'alone_at_home',
      callers: ['wei_qiang', 'ma_tao'],
      openingLine: '120吗？我妈一个人在家，刚才给我打电话，话都说不清楚了，就"啊啊"地叫我名字，我在这边听着不对，你们能不能先过去看看？',
      purpose: '我人不在她那边，我这就往过赶，你们先派人去！她一个人开不了门怎么办？',
      condition: {
        chiefComplaint: '独居老人电话中言语不清，家属远程察觉异常',
        age: '69岁',
        gender: '女性',
        consciousness: '电话里应了声，但只能发出含糊的音节',
        breathing: '听筒里呼吸有点粗，说不准正不正常',
        patientCount: '1人',
        additional: [
          '平时说话利索，还爱唠叨，今天突然就只会哼哼',
          '有房颤，药吃得断断续续',
          '隔壁邻居有她家备用钥匙',
          '她自己一个人住，白天没人去',
        ],
      },
      answers: {
        mpds_stroke_time: {
          answer: '就十来分钟前，她第一次打给我就说不清了，前一天晚上跟我视频还好好的',
          answerVague: '刚刚……就刚才……',
          ramblingAnswer: '具体几分钟我说不准，我是在办公室，她十来分钟前打过来的，一接通我就听出来不对，说话像含着一口水。昨天晚上我们视频的时候她还清楚着呢，还嘱咐我多穿点。所以应该是今天下午才这样的。我一边跟她说着话，一边就往楼下跑。',
          panickedAnswer: '我不知道！！就刚才那会儿！！昨天还好好的！！你们快点啊！！',
        },
        mpds_stroke_face: {
          answer: '我看不见她，只能听声音。我让她照我说的笑笑，她笑没笑我不知道，就是声音更怪了',
          answerVague: '看不见……只能听……',
          ramblingAnswer: '我人在电话这头啊，看不见她的脸。我照您说的让她笑一下，电话里她好像是在努力，但是发出来的声音更别扭了。我让她开视频她也不会弄。唉，早知道我该把她接过来一起住的。',
          panickedAnswer: '我看不见啊！！她一个人在家！！你们能进去吗？！',
        },
        mpds_stroke_arm: {
          answer: '她说不出话，我问她"手能不能动"，她嗯了一声，也不知道是能动还是不能动',
          answerVague: '不清楚……她不会说……',
          ramblingAnswer: '这个我真的问不出来。她在那边就是嗯嗯嗯的，问什么都是这个动静。我猜她可能是一边身子不听使唤了，不然不会连句"我没事"都说不出来。我邻居有我家钥匙，我让他过去了，但他也没进门。',
          panickedAnswer: '问不出来！！她就不会说话了！！你们快点！！',
        },
      },
      specialEvents: [
        {
          id: 'stroke_neighbor_enters',
          trigger: 'after_dispatch',
          triggerValue: '',
          type: 'new_symptom',
          dialogue: '邻居过去了，说敲了半天门才听见里面拖东西的声音，她好像是自己爬着来开门的，右边整个身子使不上劲……',
        },
      ],
      outcomeNarrative: {
        good: '你反复确认了症状出现的大致时间，也记下了房颤病史，并让家属通知邻居拿了备用钥匙。门打开时人还有意识，被及时接走。',
        bad: '电话里始终没定下最近的发病时间，也漏问了病史，到场时家属才想起补充。溶栓时间窗的判断因此少了一条关键依据。',
      },
      menu: { category: '神经系统', desc: '远程察觉 · 独居老人', tag: '🔢' },
    },
  ],

  fourElements: {
    address: {
      vague: '西城区金融街附近',
      partial: '金融街丰汇园小区',
      full: '丰汇园小区7号楼3单元201室，小区门口有个工商银行',
    },
    contact: '136****9012',
    condition: {
      chiefComplaint: '老头子吃饭的时候突然嘴歪了、话也说不清楚、右手抬不起来了',
      age: '72岁',
      gender: '男性',
      consciousness: '醒着的，但说话含糊不清',
      breathing: '呼吸看着还正常',
      patientCount: '1人',
      additional: [
        '有高血压病史',
        '症状大约在20分钟前开始',
        '之前没有类似情况',
      ],
    },
    purpose: '不会是要中风了吧！你们快来！',
  },

  // ============================================================
  // 手写对话脚本 — 张秀兰（妻子）报告丈夫疑似脑卒中
  // 来电者个性：紧张但努力配合、叙述啰嗦、记不清时间
  // 关系：妻子（对丈夫了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，小区名和楼号。',
      caller: {
        calm: ['西城区金融街丰汇园小区7号楼3单元201室。'],
        tense: ['金融街！丰汇园！7号楼！3单元201！你们快来！'],
        panic: ['丰汇园！7号楼！201！快来！'],
        lost: ['金融街……丰汇园……201……'],
        retryPrefix: '我不是刚说了——',
      },
      fillTerminal: { address: '西城区金融街丰汇园小区7号楼3单元201室' },
      outburst: '他嘴歪了！！你们到底来不来啊！！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你急，救护车已经在路上了。咱接着说，每个问题都帮到老伴。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '小区门口有什么明显的店吗？',
      caller: {
        calm: ['小区门口有个工商银行。'],
        tense: ['门口有工商银行！你们到了就能看到！'],
        panic: ['工商银行……门口……'],
        lost: ['有个银行……门口……'],
      },
      fillTerminal: { address: '西城区金融街丰汇园小区7号楼3单元201室，小区门口有工商银行' },
      calmReply: {
        operatorCalm: '好，工商银行，记下了。你做得很好，咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['老伴吃饭时突然嘴歪了，话说不清楚。', '右手抬不起来了。', '大概二十分钟前开始的。'],
        tense: ['老伴嘴歪了！话说不清楚了！', '右手抬不起来了！', '二十分钟前开始的！'],
        panic: ['嘴歪了！！说不出话了！！', '右手不行了！！你们快来！！', '是不是中风了！！'],
        lost: ['老伴嘴歪了……', '说不出话了……右手也不行了……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '突发口角歪斜、言语不清、右侧肢体无力', patientGender: '男性' },
      outburst: '他越来越严重了！！你们到底在干什么！！快来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。嘴歪，话说不清，右手抬不起来——这些我记下了。别移动他，别喂水，按我说的做。',
        calm: '好……我不动他。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他多大岁数？',
      caller: {
        calm: ['72岁。'],
        tense: ['72！他72！'],
        panic: ['72！！72岁！！'],
        lost: ['72……对，72。'],
      },
      fillTerminal: { patientAge: '72岁' },
      calmReply: {
        operatorCalm: '好，72岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还清醒吗？能说话吗？',
      caller: {
        calm: ['醒着的，但说话含糊不清。', '呼吸看着还正常。'],
        tense: ['醒着！但说话含糊！', '呼吸看着还正常！'],
        panic: ['醒着！！但说不清话！！', '呼吸正常！！你们快来！！'],
        lost: ['醒着……但说不清话……', '呼吸正常……'],
      },
      fillTerminal: { conscious: true, breathing: true },
      calmReply: {
        operatorCalm: '好，还清醒，这我知道了。让他侧躺，头偏一侧，别喂水。我一步步告诉你怎么做。',
        calm: '好……我让他侧躺。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['13677629012，就是这个号。'],
        tense: ['136……7762……9012！打这个就行！'],
        panic: ['136……这个手机！9012！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '136****9012' },
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
      id: 'mpds_stroke_time',
      category: 'mechanism',
      tier: 'critical',
      timeCost: 3,
      stressEffect: -8,
      label: '什么时候开始的？',
      questionText: '这些症状是什么时候开始出现的？请您尽量回忆准确时间。',
      answer: '大概20分钟前，吃完饭没一会儿就开始了……',
      answerVague: '没多久...吃完饭...',
      ramblingAnswer: '嗯...什么时候呢...就是刚才吃完饭，碗还没收呢，他就突然说话不对劲了。大概是...现在几点了？反正我们六点半开始吃饭的，吃了一半他就说头晕，然后嘴就这样了。所以应该是二十分钟左右吧...具体几分钟我也说不太准，我光顾着着急了。',
      panickedAnswer: '就刚才！！十分钟？二十分钟？我不知道！！我慌了！刚才还好好的突然就这样了！！',
      reveals: ['additional'],
      judgment: {
        question: '发病时间的描述很模糊——你的判断是？',
        options: [
          { label: '精确20分钟前', fills: [{ field: 'conditionNote', value: '发病约20分钟前' }], isCorrect: false },
          { label: '约20-30分钟前（估计值）', fills: [{ field: 'conditionNote', value: '发病约20-30分钟前（在溶栓时间窗内）' }], isCorrect: true },
          { label: '超过1小时', fills: [{ field: 'conditionNote', value: '发病时间不确定，可能超过1小时' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_stroke_face',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -6,
      label: '能笑一下吗？',
      questionText: '请您让老先生笑一下，看看嘴角是不是歪的？',
      answer: '他笑了……是的，右边嘴角往下耷拉着。',
      answerVague: '嘴...嘴是歪的...',
      ramblingAnswer: '笑了...他试着笑了一下，右边嘴角往下耷拉着，左边好像还正常。他说话的时候嘴巴也往一边歪，我一开始还以为是假牙掉了呢...右边脸整个看起来就跟...就跟不太对劲似的，表情不对称了。',
      panickedAnswer: '歪了歪了！！右边！右边嘴角掉下来了！一笑就斜的！！这是不是中风了？！我电视上看过的！！',
      reveals: ['chiefComplaint'],
      judgment: {
        question: '老人「右边嘴角耷拉、表情不对称」，你的判断是？',
        options: [
          { label: '右侧面瘫（疑似中枢性）', fills: [{ field: 'chiefComplaint', value: '右侧面瘫，疑似脑卒中' }], isCorrect: true },
          { label: '只是假牙问题或表情不自然', fills: [{ field: 'chiefComplaint', value: '面瘫待确认' }], isCorrect: false },
          { label: '双侧均不正常', fills: [{ field: 'chiefComplaint', value: '双侧面部不对称' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_stroke_arm',
      category: 'mechanism',
      tier: 'important',
      timeCost: 2,
      stressEffect: -4,
      label: '能举手臂吗？',
      questionText: '让老先生闭上眼睛，双手平举，看看能不能做到？',
      answer: '右手举不起来，左手还可以……',
      answerVague: '右手不行...举不起来...',
      ramblingAnswer: '我让他举手...右手抬了大概一半就掉下来了，左手倒是还能举着。他自己也很惊讶，说"我的手怎么不听使唤了"...右手整个就...像不是他的了一样，他看自己右手的那个表情特别害怕。',
      panickedAnswer: '右手不行！！完全抬不起来！！举一半就掉！左手好像还可以！',
      reveals: ['additional'],
      judgment: {
        question: '右手举一半掉落——此体征提示什么？',
        options: [
          { label: '右侧肢体偏瘫（符合卒中表现）', fills: [{ field: 'conditionNote', value: '右侧肢体偏瘫，FAST阳性' }], isCorrect: true },
          { label: '只是没力气，可能饿了', fills: [{ field: 'conditionNote', value: '肢体无力待观察' }], isCorrect: false },
          { label: '双侧均无力', fills: [{ field: 'conditionNote', value: '双侧肢体无力' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '脑卒中现场处置',
    intro: '救护车已在路上。在到达前，请保持患者安静，不要喂食喂水，并帮患者摆好体位防止误吸。',
    steps: [
      {
        id: 'st_position_choice',
        instruction: '把患者摆成侧卧的复苏体位，头偏向一侧，防止呕吐物堵塞气道。',
        prompt: '第一步：摆放复苏体位',
        options: [
          '侧卧 头偏向一侧',
          '平躺仰头',
          '扶坐起来',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！侧卧头偏一侧能防止误吸，保护气道。',
          incorrect: '不对。脑卒中患者应保持侧卧、头偏向一侧，避免呕吐物呛入气道。',
          callerCorrect: '我让他侧过身了，头也偏过去了一点。这样对吗？',
          callerIncorrect: '我把他扶起来坐着了，他好像更难受了。',
        },
      },
      {
        id: 'st_position_game',
        instruction: '把患者身体摆成侧卧复苏体位。',
        prompt: '实操环节：摆位',
        options: ['完成摆位'],
        correctIndex: 0,
        feedback: {
          correct: '摆位到位。',
          incorrect: '摆位不达标。',
          callerCorrect: '我把他侧过来了，头也偏着，看上去呼吸顺多了。',
          callerIncorrect: '我摆的位置不太对，他好像不太舒服。',
        },
        miniGame: {
          kind: 'stepOrder',
          title: '复苏体位摆位',
          instruction: '将患者摆成侧卧复苏体位防止呕吐物误吸。请按正确顺序点击操作步骤。',
          passThreshold: 0.5,
          steps: [
            '将患者靠近自己一侧的手臂向上弯曲呈直角',
            '将患者另一侧手臂横放胸前',
            '将患者远侧腿的膝盖弯曲',
            '抓住远侧肩膀和膝盖，向自己一侧缓缓翻转',
            '调整头部后仰，保持气道通畅',
          ],
          feedback: { good: '我把他侧过来了，头也偏着，看上去呼吸顺多了。', bad: '我摆的位置不太对，他好像不太舒服。' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'stroke_worse',
      trigger: 'time_elapsed',
      triggerValue: '15',
      type: 'new_symptom',
      dialogue: '哎呀！老头子现在好像更严重了，右边胳膊彻底动不了了！你们到哪了？',
    },
  ],

  outcomeNarrative: {
    good: '你让张秀兰把发作前后的事按住时间顺序讲了一遍，也记下了老先生平时吃什么药。救护车到的时候她手里还攥着写有时间的那张纸。',
    bad: '电话里反复追问"到底几点"，老太太越说越乱，最后谁也没记清症状是几点开始的。那张写着时间的纸，到她上车才想起来。',
    prank: '',
  },
}
