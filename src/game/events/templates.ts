// ============================================================
// 零点接线台 — 急救通话场景数据
// ============================================================

import type { EmergencyScenario } from '../types'

export const SCENARIOS: Record<string, EmergencyScenario> = {

  // ==========================================
  // 场景1：心脏骤停 — 濒危（红色）
  // ==========================================
  cardiac_arrest: {
    id: 'cardiac_arrest',
    title: '心脏骤停',
    callerId: 'li_jianguo',
    phoneNumber: '138****4321',
    baseStation: '朝阳区望京街道附近',
    isPrank: false,
    correctTriage: 'red',

    mpdsCard: {
      number: 9,
      title: '心脏/呼吸骤停/死亡',
      chiefComplaint: '患者无意识、无呼吸或无有效呼吸',
      determinantCode: '9-E-1',
      hotCold: 'HOT',
      keyQuestions: [
        '患者是否有意识？',
        '患者是否在呼吸？',
        '是否为目击骤停？',
        '患者年龄？',
        '是否有人在做CPR？',
      ],
    },

    openingLine: '喂！120吗？我老婆刚才还好好的在看电视，突然就倒在地上了！怎么叫都不醒！你们快来啊！',

    fourElements: {
      address: {
        vague: '朝阳区望京街道附近',
        partial: '望京SOHO旁边的小区，望京西园三区',
        full: '望京西园三区12号楼2单元501室，楼下有一个京东便利店',
      },
      contact: '138****4321',
      condition: {
        chiefComplaint: '我老婆在看电视，突然倒在地上，怎么叫都叫不醒',
        age: '45岁左右',
        gender: '女性',
        consciousness: '怎么叫都不醒，一点反应都没有',
        breathing: '没有呼吸了！胸口都不动了',
        patientCount: '1人',
        additional: [
          '之前有心脏病史',
          '嘴唇发紫',
          '大概5分钟前倒下的',
        ],
      },
      purpose: '快来救命！需要救护车！',
    },

    /** 5步标准协议已覆盖意识+呼吸+年龄，无需补充MPDS问询 */
    mpdsQuestions: [],

    guidance: {
      title: '心肺复苏（CPR）指导',
      intro: '救护车已经在路上了。在救护车到达之前，请您按照我的指令来帮助患者。您能做胸外按压吗？',
      steps: [
        {
          id: 'cpr_position',
          instruction: '请让患者平躺在地板上，确保背部是硬的平整的平面。',
          prompt: '第一步：摆好体位',
          options: [
            '让患者平躺在硬地板上',
            '把患者扶起来坐在椅子上',
            '让患者侧躺',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！平躺硬地板是做CPR的前提。',
            incorrect: '不对。心脏骤停必须平躺在硬平面上，坐姿或侧躺无法有效按压。',
            callerCorrect: '好！我把他放平了！躺地板上了！然后呢？下一步我该做什么？！',
            callerIncorrect: '啊？扶他起来坐着？他人都没反应了怎么坐啊……你是不是说错了？',
          },
        },
        {
          id: 'cpr_hands',
          instruction: '请把您一只手的手掌根部放在患者胸骨正中，两乳头连线的中点。另一只手叠在上面，十指相扣。',
          prompt: '第二步：找到按压位置',
          options: [
            '手掌根部放在胸骨正中两乳头连线中点',
            '手掌放在肚子上',
            '手掌放在左胸心脏位置',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！胸骨正中是最有效的按压位置。',
            incorrect: '不对。按压位置应在胸骨正中（两乳头连线中点），不是肚子或左胸。',
            callerCorrect: '放好了！两只手叠在一起，就放在你说的那个位置！现在要怎么按？快告诉我！',
            callerIncorrect: '放肚子上了……但是他肚子一点反应都没有啊……我真的放对了吗？他没动静啊！',
          },
        },
        {
          id: 'cpr_depth',
          instruction: '请用力按压，深度至少5厘米，频率大约每分钟100-120次，跟我数节奏：01、02、03……',
          prompt: '第三步：按压节奏',
          options: [
            '深度5cm，频率100-120次/分钟',
            '轻轻按压，不要太用力',
            '越快越好，不管深度',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！标准CPR是深度5-6cm，频率100-120次/分钟。',
            incorrect: '不对。按压力度不够或太快太慢都会影响效果。标准是5cm深度，100-120次/分钟。',
            callerCorrect: '我跟你的节奏按了！01、02、03！她胸口在起伏！我的手感觉得到！她是不是有反应了？！',
            callerIncorrect: '我怕太大力把她按坏……就稍微轻轻按了按……她好像还是没反应……是不是我做错了？',
          },
        },
      ],
    },

    specialEvents: [
      {
        id: 'cpr_caller_cry',
        trigger: 'after_dispatch',
        triggerValue: '',
        type: 'caller_panic',
        dialogue: '她脸色越来越白了！救护车怎么还没到啊！呜呜……',
      },
    ],

    outcomeNarrative: {
      good: '患者心脏骤停，接线员在43秒内完成派车并指导CPR。救护车8分钟后到达，患者被成功除颤，恢复自主心跳。',
      bad: '患者心脏骤停，派车延误加上地址不完整，救护车超过15分钟才到达。错过了黄金抢救时间……',
      prank: '',
    },
  },

  // ==========================================
  // 场景2：车祸创伤 — 危重（黄色）
  // ==========================================
  trauma_car: {
    id: 'trauma_car',
    title: '严重车祸',
    callerId: 'wang_xiao',
    phoneNumber: '139****5678',
    baseStation: '海淀区中关村大街附近',
    isPrank: false,
    correctTriage: 'yellow',

    mpdsCard: {
      number: 29,
      title: '交通/运输事故',
      chiefComplaint: '骑电动车被汽车撞击，外伤出血、脊柱疑似损伤',
      determinantCode: '29-D-1',
      hotCold: 'HOT',
      keyQuestions: [
        '发生了什么？（事故机制）',
        '有多少伤员？',
        '伤员是否被困/卡住？',
        '有活动性出血吗？',
        '伤员意识是否清醒？',
      ],
    },

    openingLine: '你好，这边出车祸了，一个骑电动车的人被汽车撞了，流了好多血，人还清醒但是动不了。',

    fourElements: {
      address: {
        vague: '海淀区中关村大街附近',
        partial: '中关村大街和知春路交叉口',
        full: '中关村大街和知春路交叉口，海淀黄庄地铁站A2出口往北50米',
      },
      contact: '139****5678',
      condition: {
        chiefComplaint: '路边有个骑电动车的人被汽车撞了，腿在流血，人还醒着但动不了了',
        age: '30岁左右',
        gender: '男性',
        consciousness: '人是清醒的，能跟我说话',
        breathing: '呼吸看着还算正常',
        patientCount: '1人',
        additional: [
          '右腿有明显外伤，出血量较大',
          '自述腰部疼痛',
          '戴着头盔，头部无明显外伤',
        ],
      },
      purpose: '需要救护车和急救',
    },

    mpdsQuestions: [
      {
        id: 'mpds_bleeding',
        category: 'bleeding',
        tier: 'critical',
        timeCost: 3,
        stressEffect: -8,
        label: '出血严重吗？',
        questionText: '出血量大吗？是涌出来的还是一点点渗出来的？',
        answer: '挺多的，裤腿全湿了……但不是喷出来的那种。',
        answerVague: '好多血...裤子上都是...',
        ramblingAnswer: '挺多的...不是那种喷的，就是一直往外渗，他那个裤腿全湿透了，深色的裤子都被血染得发亮。我刚才试着用纸巾按了一下，根本止不住...不过不是嗞出来的那种，就感觉一直在流。他好像不太疼的样子，但出血量我觉得不少。',
        panickedAnswer: '好多血！！！裤子上地上都是！一直在流一直在流！你快说我要怎么止血啊！！！他不会死吧？！',
        reveals: ['additional', 'consciousness'],
        judgment: {
          question: '根据来电者描述「裤腿全湿、一直渗、不是喷出来的」，出血特征最可能是？',
          options: [
            { label: '动脉喷射性出血', sublabel: '危险！需即刻止血', fills: [{ field: 'conditionNote', value: '动脉喷射性出血' }], isCorrect: false },
            { label: '大面积静脉性渗血', sublabel: '量大但非喷射', fills: [{ field: 'conditionNote', value: '右腿大面积静脉性出血' }], isCorrect: true },
            { label: '少量毛细血管出血', sublabel: '不紧急', fills: [{ field: 'conditionNote', value: '少量外出血' }], isCorrect: false },
            { label: '内出血（体表无明显出血）', fills: [{ field: 'conditionNote', value: '疑似内出血' }], isCorrect: false },
          ],
        },
      },
    ],

    guidance: {
      title: '外伤出血控制',
      intro: '救护车正在路上。在等待期间，请帮助伤者控制出血。您能找到干净的布或者衣服吗？',
      steps: [
        {
          id: 'bleed_pressure',
          instruction: '请用干净的布或衣物直接按压在出血部位上，用力但不要过度。',
          prompt: '第一步：止血',
          options: [
            '用干净布直接按压伤口止血',
            '用酒精冲洗伤口',
            '用绳子扎紧伤口上方',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！直接按压是最有效的止血方法。',
            incorrect: '不对。酒精冲洗会刺激伤口加剧疼痛，扎止血带需要专业知识，直接按压是最安全有效的方法。',
            callerCorrect: '我用衣服死死压住了！血好像没刚才渗得那么快了……这是个好兆头吧？',
            callerIncorrect: '我拿酒精给他冲了一下……他疼得嗷嗷叫！是不是我做错了？！出血还是没止住！',
          },
        },
        {
          id: 'bleed_elevate',
          instruction: '如果可能的话，把伤者的腿稍微抬高一点，但要小心不要移动伤者。',
          prompt: '第二步：抬高伤处',
          options: [
            '在不移动身体的前提下抬高腿部',
            '把伤者扶起来坐着',
            '不用管，等救护车来就行',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！抬高伤处有助于减少出血，但千万不要移动疑似脊柱损伤的患者。',
            incorrect: '不对。切忌移动伤者（可能脊柱受伤），只需在不移动的前提下抬高伤处。',
            callerCorrect: '我小心翼翼地给他腿垫了一下，他说感觉比刚才好点了……还跟我说谢谢……',
            callerIncorrect: '他说腰疼得不行，我不敢动他了……但是他腿还在流血，我该怎么办？',
          },
        },
        {
          id: 'bleed_monitor',
          instruction: '请持续观察伤者的意识状态和呼吸，如果出现意识模糊或呼吸异常，立即告诉我。',
          prompt: '第三步：持续观察',
          options: [
            '持续观察意识和呼吸变化',
            '让伤者自己待着',
            '给伤者喝水',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！持续观察是及时发现病情变化的关键。',
            incorrect: '不对。外伤患者可能随时恶化，需要持续观察。另外不要给伤者饮水（可能需手术）。',
            callerCorrect: '我一直盯着他呢……他现在还醒着，在跟我说话。他说腰还是疼，但人还算清楚。',
            callerIncorrect: '他好像想睡觉了……眼睛快闭上了……让他睡一下可以吧？还是说……不能睡？',
          },
        },
      ],
    },

    specialEvents: [
      {
        id: 'trauma_update',
        trigger: 'after_dispatch',
        triggerValue: '',
        type: 'new_symptom',
        dialogue: '等等……伤者说他的腰越来越疼了，而且右腿好像没感觉了……',
      },
    ],

    outcomeNarrative: {
      good: '车祸伤员得到及时派车和现场止血指导，救护车11分钟后到达。伤员右腿骨折伴腰椎损伤，因现场处置得当，未造成二次伤害。',
      bad: '派车延迟且止血指导错误，伤员出血量较大。救护车到达时伤员已出现早期休克症状……',
      prank: '',
    },
  },

  // ==========================================
  // 场景3：脑卒中 — 濒危（红色）
  // ==========================================
  stroke: {
    id: 'stroke',
    title: '疑似脑卒中',
    callerId: 'zhang_xiulan',
    phoneNumber: '136****9012',
    baseStation: '西城区金融街附近',
    isPrank: false,
    correctTriage: 'red',

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

    guidance: null, // 脑卒中不需要现场急救指导，关键是尽快送医

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
      good: '接线员迅速识别脑卒中症状，1分钟内派车。患者27分钟到达医院，在溶栓时间窗内得到治疗，恢复良好。',
      bad: '派车延迟，到达医院时已超过溶栓时间窗。患者留下了永久性右侧肢体偏瘫……',
      prank: '',
    },
  },

  // ==========================================
  // 场景4：产科急症 — 危重（黄色）
  // ==========================================
  obstetric: {
    id: 'obstetric',
    title: '产科急症',
    callerId: 'zhao_lei',
    phoneNumber: '137****3456',
    baseStation: '丰台区方庄附近',
    isPrank: false,
    correctTriage: 'yellow',

    mpdsCard: {
      number: 24,
      title: '妊娠/分娩/流产',
      chiefComplaint: '孕38周破水、规律宫缩3-4分钟，第二胎',
      determinantCode: '24-D-3',
      hotCold: 'HOT',
      keyQuestions: [
        '怀孕多少周了？',
        '羊水破了多久？什么颜色？',
        '宫缩间隔和持续时间？',
        '有无阴道大量出血？',
        '能看到婴儿头部或脐带吗？',
      ],
    },

    openingLine: '救命啊！！！我老婆要生了！预产期还有两周但是刚才突然破水了！她疼得不行了！你们快来啊！！！',

    fourElements: {
      address: {
        vague: '丰台区方庄附近',
        partial: '方庄芳城园一区',
        full: '芳城园一区5号楼1单元802室，楼下有个链家地产',
      },
      contact: '137****3456',
      condition: {
        chiefComplaint: '我老婆怀孕38周，刚才突然破水了，宫缩越来越频繁',
        age: '32岁',
        gender: '女性',
        consciousness: '人是清醒的，但疼得话都说不全了',
        breathing: '呼吸很急促，一直在喘',
        patientCount: '1个人（肚子里还有个孩子）',
        additional: [
          '预产期还有2周',
          '羊水已破，大约5分钟前',
          '宫缩间隔约3-4分钟',
          '这是第二胎',
        ],
      },
      purpose: '马上派救护车！可能需要接生！',
    },

    mpdsQuestions: [
      {
        id: 'mpds_ob_water',
        category: 'mechanism',
        tier: 'critical',
        timeCost: 2,
        stressEffect: -5,
        label: '羊水什么颜色？',
        questionText: '羊水是什么颜色的？清的还是有颜色？',
        answer: '清的！就是透明的！',
        answerVague: '水...是水...透明的...',
        ramblingAnswer: '清的！透明的！我刚看了一眼，地板上湿了一片，没有颜色也没味道...跟水一样。这个正常吗？我记得以前第一胎那时候破水好像也是清的。应该不是带血的吧，没有红色也没有黄绿色，就是透明的。',
        panickedAnswer: '水！！！就是水！！！透明的！！没有什么颜色！！也没有血！！',
        reveals: ['additional'],
        judgment: {
          question: '羊水「透明无色」提示什么？',
          options: [
            { label: '正常羊水，无胎儿窘迫迹象', fills: [{ field: 'conditionNote', value: '羊水清亮，无胎粪污染' }], isCorrect: true },
            { label: '可能有胎粪污染（黄色/绿色）', fills: [{ field: 'conditionNote', value: '羊水可能胎粪污染' }], isCorrect: false },
            { label: '血性羊水，可能有胎盘早剥', fills: [{ field: 'conditionNote', value: '血性羊水，警惕胎盘早剥' }], isCorrect: false },
          ],
        },
      },
      {
        id: 'mpds_ob_contraction',
        category: 'mechanism',
        tier: 'important',
        timeCost: 2,
        stressEffect: -3,
        label: '宫缩间隔多久？',
        questionText: '宫缩大概隔多久一次？每次持续多长时间？',
        answer: '大概三四分钟一次……每次疼几十秒吧！',
        answerVague: '几分钟...她一直疼...',
        ramblingAnswer: '三四分钟...可能三分钟也可能四分钟，我一直在看手机计时...一开始间隔还挺长的可能有十分钟，现在越来越密了！刚才那波疼了有四五十秒吧，她疼得抓住我的手臂指甲都掐进去了...这正常吗？是不是快生了？',
        panickedAnswer: '越来越快了！！一开始十分钟一次现在感觉两三分钟就疼一次了！！她疼得嗷嗷叫！！我受不了了！！',
        reveals: ['additional'],
        judgment: {
          question: '宫缩从10分钟缩短到3-4分钟——这提示什么阶段？',
          options: [
            { label: '活跃期产程，即将分娩', fills: [{ field: 'conditionNote', value: '活跃期产程，宫缩3-4分钟一次' }], isCorrect: true },
            { label: '假性宫缩，可能不会马上生', fills: [{ field: 'conditionNote', value: '可能是假性宫缩' }], isCorrect: false },
            { label: '异常宫缩，可能有危险', fills: [{ field: 'conditionNote', value: '宫缩异常，警惕' }], isCorrect: false },
          ],
        },
      },
      {
        id: 'mpds_ob_bleeding',
        category: 'bleeding',
        tier: 'important',
        timeCost: 2,
        stressEffect: -3,
        label: '有出血吗？',
        questionText: '有没有大量出血？',
        answer: '没……没有！就是羊水！',
        answerVague: '没...好像没有...',
        ramblingAnswer: '没有没有，我仔细看了，就是羊水，没有血。地板上就是透明的水渍。我特别看了一下她垫的毛巾，也没有红色。应该就是普通的破水...至少目前没有出血。',
        panickedAnswer: '没有血！！就是水！！但是水好多啊！！一直在流！！会不会流光了啊？！',
        reveals: ['consciousness'],
      },
    ],

    guidance: {
      title: '院前分娩指导',
      intro: '救护车正在赶来。请您保持冷静，我来指导您。首先让您妻子平躺，用枕头垫高头部。',
      steps: [
        {
          id: 'ob_position',
          instruction: '让产妇平躺，双腿弯曲分开。准备好干净的毛巾或床单。',
          prompt: '第一步：准备体位',
          options: [
            '让产妇平躺，双腿弯曲分开',
            '让产妇站起来走动',
            '让产妇坐着用力',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！平躺是安全的分娩体位。',
            incorrect: '不对。破水后应平躺，站立或坐着会增加脐带脱垂风险。',
            callerCorrect: '她躺好了！腿也弯着了！她一直在喊疼……宫缩又来了！接下来怎么做？！',
            callerIncorrect: '她站着呢……我让她走了一下，她疼得站不住啊！破水是不是越来越多了？怎么办？！',
          },
        },
        {
          id: 'ob_push',
          instruction: '当宫缩来临时，指导产妇深呼吸并向下用力。在宫缩间歇让她休息。',
          prompt: '第二步：指导用力',
          options: [
            '宫缩时向下用力，间歇时休息',
            '一直持续用力',
            '不要用力，等医生来',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！配合宫缩节奏用力最有效。',
            incorrect: '不对。持续用力会导致产妇过度疲劳，应配合宫缩节奏。',
            callerCorrect: '她跟着宫缩的节奏在用力！一疼我就让她使劲……不疼的时候她就喘口气！我看到孩子头了！！头出来了！！',
            callerIncorrect: '我让她一直使劲……她现在没力气了……她说不行了使不上劲了……怎么办啊孩子还没出来！',
          },
        },
        {
          id: 'ob_baby',
          instruction: '如果婴儿头部出现，请用手轻轻托住，千万不要用力拉。让婴儿自然娩出。',
          prompt: '第三步：接住婴儿',
          options: [
            '轻轻托住婴儿头部，不要拉拽',
            '用力把婴儿拉出来',
            '不要碰婴儿',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！轻轻托住保护婴儿，自然娩出。',
            incorrect: '不对。用力拉拽可能造成婴儿臂丛神经损伤，但也不能不接。应轻轻托住。',
            callerCorrect: '我托住头了！好小……他在动！他动了！眼睛睁开了！孩子出来了！呜……呜呜……出来了！！',
            callerIncorrect: '我……我没敢碰……她就那么掉在地上了……哇哇大哭！孩子哭了！但是他掉地上了！！我是不是闯祸了？！',
          },
        },
      ],
    },

    specialEvents: [
      {
        id: 'ob_push_urge',
        trigger: 'after_dispatch',
        triggerValue: '',
        type: 'caller_panic',
        dialogue: '她说有想大便的感觉！是不是要生了？！我该怎么办啊啊啊！！！',
      },
    ],

    outcomeNarrative: {
      good: '接线员冷静指导院前分娩，产妇在救护车到达前顺利分娩。母婴平安，新生儿评分良好。',
      bad: '家属慌乱中未按指导操作，产妇在家中无人监护的情况下分娩，新生儿有轻度窒息……',
      prank: '',
    },
  },

  // ==========================================
  // 场景5：化学品灼伤 — 轻伤（绿色）
  // ==========================================
  chemical_burn: {
    id: 'chemical_burn',
    title: '化学品灼伤',
    callerId: 'chen_ming',
    phoneNumber: '135****7890',
    baseStation: '大兴区亦庄开发区附近',
    isPrank: false,
    correctTriage: 'green',

    mpdsCard: {
      number: 7,
      title: '烧伤（烫伤）/爆炸伤',
      chiefComplaint: '98%浓硫酸溅到右手背，单部位化学灼伤',
      determinantCode: '7-C-3',
      hotCold: 'HOT',
      keyQuestions: [
        '是什么化学品？（化学品名和浓度）',
        '伤及哪些部位？面积多大？',
        '有无吸入或溅入眼睛？',
        '是否在用流动水冲洗？持续多久？',
        '伤者意识和呼吸是否正常？',
      ],
    },

    openingLine: '你好120，我们在实验室做实验，同事不小心把浓硫酸溅到手上了，皮肤烧伤了一大片，现在应该怎么处理？',

    fourElements: {
      address: {
        vague: '大兴区亦庄开发区附近',
        partial: '亦庄经济技术开发区，生物医药园',
        full: '生物医药园A座3楼302实验室，亦庄线荣京东街站向西500米',
      },
      contact: '135****7890',
      condition: {
        chiefComplaint: '同事在实验室做实验，浓硫酸溅到手背上了，皮肤烧了一大块',
        age: '28岁',
        gender: '男性',
        consciousness: '人是清醒的，但疼得不行',
        breathing: '呼吸正常',
        patientCount: '1人',
        additional: [
          '浓硫酸溅到右手背',
          '已用流动水冲洗了5分钟',
          '伤者疼痛剧烈但可忍受',
          '没有溅到眼睛或面部',
        ],
      },
      purpose: '需要救护车，同时需要现场处理指导',
    },

    mpdsQuestions: [
      {
        id: 'mpds_chem_what',
        category: 'mechanism',
        tier: 'critical',
        timeCost: 2,
        stressEffect: -8,
        label: '什么化学品？',
        questionText: '具体是什么化学品？浓度是多少？',
        answer: '是浓硫酸，浓度大概98%。就溅了一小滴。',
        answerVague: '硫酸...浓的...',
        ramblingAnswer: '浓硫酸...试剂瓶上写的是98%，分析纯的。就是我们实验室做酸化实验用的那种。我同事转移的时候手一滑，滴管里甩出来一小滴掉在手背上了...就很小一滴，但是马上就起了一个大泡。还好他反应快，马上把手套摘了冲到水龙头那边去了。',
        panickedAnswer: '硫酸！！！浓硫酸！！98%的！！就溅了一小滴！！但是马上皮就变了！！发白！！',
        reveals: ['chiefComplaint'],
        judgment: {
          question: '98%浓硫酸溅到手上——损伤程度判断？',
          options: [
            { label: '强腐蚀性化学灼伤，需紧急处理', fills: [{ field: 'chiefComplaint', value: '98%浓硫酸化学灼伤右手背' }], isCorrect: true },
            { label: '小滴溅洒，不严重', fills: [{ field: 'chiefComplaint', value: '轻微化学烧伤' }], isCorrect: false },
            { label: '可能是热烧伤而非化学灼伤', fills: [{ field: 'chiefComplaint', value: '疑似热烧伤' }], isCorrect: false },
          ],
        },
      },
      {
        id: 'mpds_chem_area',
        category: 'bleeding',
        tier: 'important',
        timeCost: 2,
        stressEffect: -5,
        label: '伤到哪里了？',
        questionText: '除了手还有哪些地方被溅到了？脸上或眼睛有没有？',
        answer: '没有没有，就是右手背，面积大概一个手掌心那么大。他戴了护目镜的。',
        answerVague: '就是手...右手...',
        ramblingAnswer: '没有没有，我仔细看了，就是右手背，虎口往下一点的位置，面积大概...一个瓶盖那么大吧，但是周围一圈都发红了。他当时戴着护目镜和实验服，脸上没事，眼睛也没问题。实验服上溅了几滴但没渗透进去。真的就是手背上那一小块，不过看起来挺吓人的。',
        panickedAnswer: '就手！！右手！！手背！！别的地方没有！！他戴着护目镜！！脸上没事！！但是手背已经...已经烧白了！！',
        reveals: ['additional', 'consciousness'],
        judgment: {
          question: '灼伤范围仅右手背一小块，未波及面部——伤情分级？',
          options: [
            { label: '单部位局限性化学灼伤', fills: [{ field: 'conditionNote', value: '右手背局限性化学灼伤，面积约1%' }, { field: 'conscious', value: true }], isCorrect: true },
            { label: '大面积化学灼伤', fills: [{ field: 'conditionNote', value: '大面积化学灼伤' }], isCorrect: false },
            { label: '可能吸入化学品', fills: [{ field: 'conditionNote', value: '需排查吸入性损伤' }], isCorrect: false },
          ],
        },
      },
      {
        id: 'mpds_chem_rinse',
        category: 'mechanism',
        tier: 'important',
        timeCost: 2,
        stressEffect: -3,
        label: '冲洗了吗？',
        questionText: '你们有没有用流动水冲洗？冲了多久？',
        answer: '冲了，已经用流动水冲了差不多五分钟了。',
        answerVague: '冲了...冲了一会儿...',
        ramblingAnswer: '冲了冲了！他一溅到马上就冲到水池那边去了，一直用那个洗眼器接的水管在冲。大概冲了有五分钟左右了吧，我帮他计着时间的，因为实验室培训时候教过要冲15到20分钟...他现在手还在水龙头下面冲着呢，我叫他不要停。',
        panickedAnswer: '冲了！！一直在冲！！冲了好几分钟了！！还要冲多久？！我就让他冲着不要停！！',
        reveals: ['additional'],
      },
    ],

    guidance: {
      title: '化学品灼伤处理',
      intro: '救护车已经出发了。化学灼伤的现场处理至关重要，请按我说的做。',
      steps: [
        {
          id: 'chem_rinse',
          instruction: '继续用大量流动清水冲洗伤处，至少冲洗15-20分钟。不要用热水，用常温水。',
          prompt: '持续冲洗伤口',
          options: [
            '用大量流动常温水持续冲洗至少15分钟',
            '涂烫伤膏',
            '用冰块冷敷',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！大量流动水冲洗是化学灼伤的首选处理方法。',
            incorrect: '不对。不要涂任何药膏（会阻碍散热和化学物质清除），也不要用冰块（可能造成冻伤叠加）。',
            callerCorrect: '我让他一直冲着！手在水龙头下面淋着，他说比刚才好受点了，烧灼感没那么强了。',
            callerIncorrect: '我刚才给他涂了烫伤膏……他现在疼得更厉害了！手背发红发黑……是不是更严重了？！',
          },
        },
        {
          id: 'chem_clothing',
          instruction: '小心脱掉或剪掉被污染的手套和衣物，注意不要把化学品扩散到其他部位的皮肤上。',
          prompt: '去除污染衣物',
          options: [
            '小心剪掉/脱掉被污染的衣物手套',
            '不用管衣物，只冲水',
            '用布擦拭干净',
          ],
          correctIndex: 0,
          feedback: {
            correct: '正确！去除污染源才能彻底清除化学品。',
            incorrect: '不对。被污染的衣物手套会持续接触皮肤造成进一步损伤，必须去除。',
            callerCorrect: '我帮他把手套剪掉了！手上确实还有硫酸痕迹……现在继续冲水呢！他说没那么疼了。',
            callerIncorrect: '我没敢碰他衣服……就一直让他冲水来着……他说还是疼，手套黏在手上会不会有事啊？',
          },
        },
      ],
    },

    specialEvents: [],

    outcomeNarrative: {
      good: '接线员正确指导了持续冲洗和污染衣物去除。救护车到达时伤者疼痛有所缓解，送医后诊断为浅二度化学灼伤，预后良好。',
      bad: '现场处理不当（未持续冲洗或涂抹了药膏），导致化学灼伤加深为深二度，需要植皮手术……',
      prank: '',
    },
  },

  // ==========================================
  // 场景6：恶作剧电话 — 不应派车
  // ==========================================
  prank_call: {
    id: 'prank_call',
    title: '恶作剧电话',
    callerId: 'xiao_pang',
    phoneNumber: '132****0000',
    baseStation: '东城区东直门附近',
    isPrank: true,
    correctTriage: 'green', // 不应派车，正确做法是识别并拒绝

    mpdsCard: {
      number: 32,
      title: '未知问题（有人倒下）',
      chiefComplaint: '来电者称"小猫卡在树上"，非人体紧急情况',
      determinantCode: 'Ω',
      hotCold: 'COLD',
      keyQuestions: [
        '患者是谁？（人还是动物？）',
        '患者年龄？',
        '发生了什么事？',
        '需要什么帮助？',
      ],
    },

    openingLine: '喂！哈哈哈哈！我们家的小猫卡在树上了你们能来救它吗？哈哈哈哈……',

    fourElements: {
      address: {
        vague: '东城区东直门附近',
        partial: '东直门外大街',
        full: '东直门外大街XX小区',
      },
      contact: '132****0000',
      condition: {
        chiefComplaint: '小猫卡在树上',
        age: '小猫',
        gender: '不详',
        consciousness: '清醒',
        breathing: '正常',
        patientCount: '1只猫',
        additional: [
          '明显是小孩在恶作剧',
          '旁边有其他小孩的笑声',
          '口吻完全不严肃',
        ],
      },
      purpose: '救小猫',
    },

    mpdsQuestions: [
      {
        id: 'mpds_prank_patient',
        category: 'consciousness',
        tier: 'critical',
        timeCost: 2,
        stressEffect: -5,
        label: '患者是谁？',
        questionText: '请问患者是谁？有什么症状？',
        answer: '就是我们家小花（小猫）啊！它下不来了哈哈哈哈！',
        answerVague: '小花...小猫嘛...',
        ramblingAnswer: '就是我们家的猫啊！它叫小花！是一只胖橘猫！它刚才追一只鸟然后爬到树上去了，现在趴在树上喵喵叫不敢下来！你看它那么胖，卡在两个树杈中间特别搞笑！你们快派人来救它吧哈哈哈！',
        panickedAnswer: '是小花！！我们家的猫！！它卡住了！！下不来了！！它叫得好惨啊！！',
        reveals: ['chiefComplaint'],
        judgment: {
          question: '来电者称「患者是猫」且伴随笑声——你判断这是什么电话？',
          options: [
            { label: '紧急情况——立即派车', fills: [{ field: 'chiefComplaint', value: '小猫卡在树上' }], isCorrect: false },
            { label: '恶作剧电话——拒绝派车', fills: [{ field: 'chiefComplaint', value: '恶作剧电话（非人体紧急情况）' }, { field: 'conditionNote', value: '来电者称猫卡树上，伴有笑声，疑似儿童恶作剧' }], isCorrect: true },
            { label: '动物救援——转消防部门', fills: [{ field: 'chiefComplaint', value: '动物救援，转接消防' }], isCorrect: false },
            { label: '信息不足，继续追问', fills: [], isCorrect: false },
          ],
        },
      },
    ],

    guidance: null,
    specialEvents: [],

    outcomeNarrative: {
      good: '接线员正确识别了恶作剧电话，告知来电者120是急救专线，请勿占用。节省了宝贵的急救资源。',
      bad: '接线员派出了救护车……到现场后才发现是恶作剧。一辆救护车被浪费了40分钟。',
      prank: '接线员正确识别了恶作剧电话并教育了来电者。120资源没有被浪费。',
    },
  },
}

/** 所有场景ID列表 */
export const SCENARIO_IDS = Object.keys(SCENARIOS)

/** 获取场景 */
export function getScenario(id: string): EmergencyScenario {
  const s = SCENARIOS[id]
  if (!s) throw new Error(`Unknown scenario: ${id}`)
  return s
}
