// ============================================================
// MPDS 协议卡片 15 — 触电/雷击
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CPR_MINI_GAME_INSTRUCTION } from '../../../components/minigames/engines/cprUtils'

export const electrocutionCard: EmergencyScenario = {
  id: 'electrocution',
  title: '触电',
  callerId: 'fang_yu',
  phoneNumber: '150****8888',
  baseStation: '昌平区沙河工业区附近',
  isPrank: false,
  correctTriage: 'red',

  mpdsCard: {
    number: 15,
    title: '触电/雷击',
    chiefComplaint: '中年男性在工地触碰裸露电线后倒地，无意识无呼吸',
    determinantCode: '15-D-1',
    hotCold: 'HOT',
    keyQuestions: [
      '触电时间多久？',
      '电压多少？',
      '现在还有没有接触电源？',
      '患者有无意识和呼吸？',
      '有无烧伤（进出口）？',
    ],
  },

  openingLine: '喂喂喂！工地上有人触电了！他抓着一根破电线甩不开！我们已经用木棍把他打下来了！他现在躺地上不动了！！！',

  fourElements: {
    address: {
      vague: '昌平区沙河工业区附近',
      partial: '沙河工业区南侧在建工地',
      full: '沙河工业区南侧建筑工地3号楼二层，进大门直走到底上二楼',
    },
    contact: '150****8888',
    condition: {
      chiefComplaint: '工友在接线的时候没注意，摸到一根破皮的电线被电打了',
      age: '35岁',
      gender: '男性',
      consciousness: '完全没有反应，叫不醒了',
      breathing: '不知道还有没有，胸口好像不动了',
      patientCount: '1人',
      additional: [
        '220V家庭用电',
        '已经用干木棍把他和电线分开了',
        '右手掌心有烧焦的痕迹',
        '大概一两分钟前触电的',
      ],
    },
    purpose: '他被电打了怎么救？！要不要做心肺复苏？！',
  },

  // ============================================================
  // 手写对话脚本 — 方宇（工友）报告工友触电
  // 来电者个性：不知所措、反复确认是否安全、需要明确指令
  // 关系：工友（对现场了解）
  // ============================================================
  script: {
    step1_location: {
      operator: '您好，120。您在哪儿？',
      operatorRetry: '地址再说一遍，具体位置。',
      caller: {
        calm: ['昌平区沙河工业区南侧建筑工地3号楼二层。'],
        tense: ['沙河工业区！南侧工地！3号楼！二层！你们快来！'],
        panic: ['沙河工业区！3号楼！二层！快来！'],
        lost: ['沙河……工地……3号楼……'],
        retryPrefix: '我刚才不是说了——',
      },
      fillTerminal: { address: '昌平区沙河工业区南侧建筑工地3号楼二层' },
      outburst: '他不动了！！你们到底来不来啊！！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址记下了。我知道你慌，救护车已经在路上了。咱接着说，每个问题都帮到他。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    ask_landmark: {
      operator: '工地大门进去怎么走？',
      caller: {
        calm: ['进大门直走到底上二楼。'],
        tense: ['进大门！直走到底！上二楼！'],
        panic: ['大门进去……直走……上二楼！'],
        lost: ['大门进去……直走……'],
      },
      fillTerminal: { address: '昌平区沙河工业区南侧建筑工地3号楼二层，进大门直走到底上二楼' },
      calmReply: {
        operatorCalm: '好，进大门直走到底上二楼，记下了。咱继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……你说……',
        lost: '……好。',
      },
    },

    step2_event: {
      operator: '好，告诉我怎么了。',
      caller: {
        calm: ['工友接线时摸到破皮电线被电了。', '已经用干木棍把他和电线分开了。', '他躺地上不动了。'],
        tense: ['他摸到破电线被电了！', '用木棍把他打下来了！', '他不动了！右手有烧焦的痕迹！'],
        panic: ['被电了！！打下来了！！', '他不动了！！手心烧焦了！！', '你们快来！！'],
        lost: ['被电了……用木棍分开了……', '他不动了……', '怎么办……'],
      },
      fillTerminal: { chiefComplaint: '触电后无意识无呼吸，右手掌心烧伤', patientGender: '男性' },
      outburst: '他没气了！！你们快来啊！！他快死了！！',
      calmReply: {
        operatorCalm: '我听清楚了。触电，已经分开电源，人不动了——这些我记下了。你已经做对了，电源分开了就安全了。现在按我说的做。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    step3_age: {
      operator: '他多大岁数？',
      caller: {
        calm: ['35岁。'],
        tense: ['35！他35！'],
        panic: ['35！！35岁！！'],
        lost: ['35……应该是35……'],
      },
      fillTerminal: { patientAge: '35岁' },
      calmReply: {
        operatorCalm: '好，35岁，记下了。别急，一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    step4_vitals: {
      operator: '他还有意识吗？还在喘气吗？',
      caller: {
        calm: ['完全没有反应，叫不醒了。', '胸口好像不动了，没有呼吸了。'],
        tense: ['没有反应！叫不醒了！', '胸口不动了！没有呼吸了！'],
        panic: ['没有反应！！叫不醒了！！', '胸口不动了！！没有呼吸！！', '你们快来啊！！'],
        lost: ['叫不醒了……胸口也不动了……', '他是不是已经……', '不会的不会的……'],
      },
      fillTerminal: { conscious: false, breathing: false },
      outburst: '他没气了！！你们快来啊！！他快死了！！',
      calmReply: {
        operatorCalm: '听我说。没有意识、没有呼吸——这我知道了。现在你能救他。我会一步步教你做心肺复苏，你已经断开电源了，碰他是安全的。按我说的来。',
        calm: '好……我跟你做。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    ask_contact: {
      operator: '您的电话号码是多少？',
      operatorRetry: '号码再说一遍，一个数字一个数字说。',
      caller: {
        calm: ['15077628888，就是这个号。'],
        tense: ['150……7762……8888！打这个就行！'],
        panic: ['150……这个手机！8888！你打这个！'],
        lost: ['这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '150****8888' },
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
      id: 'mpds_elec_safety',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -10,
      label: '现场安全吗？',
      questionText: '请确认电源已经断开，你们现在是安全的吗？',
      answer: '用干木棍把他打下来了，现在不连着电了！',
      answerVague: '分开了...木棍...',
      ramblingAnswer: '我们找了一根干木棍把他手上的电线挑开了！他现在离电线有两三米远肯定没有电了！我们都穿着干鞋子站在干的地方！应该安全了！',
      panickedAnswer: '分开了分开了！！用木棍挑开了！！他不动了你们快来啊！！',
      reveals: ['additional'],
      judgment: {
        question: '现场已用干木棍分离伤者和电源，可以开始急救吗？',
        options: [
          { label: '现场已安全可以开始急救', fills: [{ field: 'conditionNote', value: '现场已安全，电源已分离' }], isCorrect: true },
          { label: '仍有触电风险不能靠近', fills: [{ field: 'conditionNote', value: '现场可能有电，等待专业人员' }], isCorrect: false },
          { label: '需要用金属再次确认断电', fills: [{ field: 'conditionNote', value: '用金属工具再次确认' }], isCorrect: false },
        ],
      },
    },
    {
      id: 'mpds_elec_breathing',
      category: 'breathing',
      tier: 'critical',
      timeCost: 3,
      stressEffect: -8,
      label: '还有呼吸吗？',
      questionText: '患者现在有呼吸吗？您能听到呼吸声或看到胸口起伏吗？',
      answer: '没有呼吸了，胸口根本不动了......',
      answerVague: '好像没有...不动了...',
      ramblingAnswer: '我凑近了看，他眼睛睁着但一动不动...我摸了一下脖子不知道有没有跳动。胸口好像没有起伏。手心有一个黑黑的烧焦的洞，手指也有点发黑。但是身上其他地方没有看到外伤。',
      panickedAnswer: '没有！！没有呼吸！！胸口不动！！手心都烧焦了！！怎么办！！',
      reveals: ['chiefComplaint'],
      judgment: {
        question: '触电后无意识无呼吸，最可能的诊断是？',
        options: [
          { label: '电击导致心脏骤停需立即CPR', fills: [{ field: 'chiefComplaint', value: '触电导致心脏骤停' }], isCorrect: true },
          { label: '只是电晕了等一会儿会醒', fills: [{ field: 'chiefComplaint', value: '电击晕厥' }], isCorrect: false },
          { label: '严重烧伤导致休克', fills: [{ field: 'chiefComplaint', value: '电烧伤休克' }], isCorrect: false },
        ],
      },
    },
  ],

  guidance: {
    title: '触电后CPR指导',
    intro: '患者可能心脏骤停需要立即CPR。我来指导您。先确认患者周围已经没有电源。',
    steps: [
      {
        id: 'elec_cpr_start',
        instruction: '请让患者平躺在地板上。把一只手的手掌根部放在他胸骨正中，另一只手叠在上面。',
        prompt: '第一步：开始CPR',
        options: [
          '确认安全后开始胸外按压',
          '先用水泼醒他',
          '等专业救护人员来',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！触电后心脏骤停需要立即CPR！',
          incorrect: '不对！触电后心脏骤停的黄金救援时间只有4分钟，必须立即开始CPR。',
          callerCorrect: '好！我跪在他旁边了！手放在他胸口中间了！然后怎么按？！',
          callerIncorrect: '我们都不敢碰他......怕还有电......但是他真的不动了啊！',
        },
      },
      {
        id: 'elec_cpr_rhythm',
        instruction: '用力快速按压，深度5厘米，频率每分钟100-120次。跟我数节奏：01 02 03 04...',
        prompt: '第二步：按压节奏',
        options: [
          '每30次按压接2次人工呼吸',
          '一直按压不要停',
          '按一会儿就停下来看看他醒了没',
        ],
        correctIndex: 0,
        feedback: {
          correct: '正确！30:2的CPR标准节奏！',
          incorrect: '不对。持续按压30次接2次人工呼吸才是正确的CPR节奏。',
          callerCorrect: '1234...2234...3234！我跟着节奏在按！他胸口随着我按压在起伏！',
          callerIncorrect: '我按了十几下看看他没反应就停了...是不是应该继续按？',
        },
      },
      {
        id: 'elec_cpr_continue',
        instruction: '继续保持30:2的节奏，如果有其他人可以轮换按压不要中断，直到救护车到达。',
        prompt: '第三步：持续CPR',
        options: [
          '独自坚持按压不要停',
          '和工友轮流按压保持节奏',
          '按了两分钟没反应就放弃',
        ],
        correctIndex: 1,
        feedback: {
          correct: '正确！轮流按压可以保持按压质量！',
          incorrect: '不对。单人长时间按压会疲劳导致按压深度不够，最好有人轮换。',
          callerCorrect: '我和老张换着按！他按30次我按30次！一直没停！',
          callerIncorrect: '就我一个人在按...我快没力气了...按得越来越浅了...',
        },
      },
      {
        id: 'elec_cpr_game',
        instruction: '实操演练：CPR 30:2 循环。',
        prompt: '实操环节：CPR 30:2',
        options: ['开始'],
        correctIndex: 0,
        feedback: {
          correct: 'CPR操作到位。',
          incorrect: 'CPR操作需改进。',
          callerCorrect: '我按了30下又吹了2口气！他有呼吸了！',
          callerIncorrect: '我手都麻了……节奏全乱了',
        },
        miniGame: {
          kind: 'cpr',
          title: 'CPR 30:2',
          instruction: CPR_MINI_GAME_INSTRUCTION,
          passThreshold: 0.5,
          cycles: 2,
          feedback: { good: '我按了30下又吹了2口气！他有呼吸了！', bad: '我手都麻了……节奏全乱了' },
        },
      },
    ],
  },

  specialEvents: [
    {
      id: 'elec_gasp',
      trigger: 'after_dispatch',
      triggerValue: '',
      type: 'new_symptom',
      dialogue: '他咳了一下！咳了一声然后喘了一口气！是不是活过来了？！但是他还是没醒！',
    },
  ],

  outcomeNarrative: {
    good: '你确认断电之后让他接着按，按了三分钟人就有了自主呼吸。心肌有损伤，住一周康复。',
    bad: '现场怕二次触电，一直不敢下手按。等车到已经过了四分钟，心跳没能救回来。',
    prank: '',
  },
}
