// ============================================================
// MPDS 协议卡片 15 — 触电/雷击
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'

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
    determinantCode: '15-D-2',
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
        id: 'elec_mg',
        instruction: '观察是否仍与电源接触，在确认已断电的安全窗口内进行急救操作。',
        prompt: '实操环节：断电时机判断',
        options: ['完成'],
        correctIndex: 0,
        feedback: {
          correct: '操作到位，正确执行。',
          incorrect: '操作需改进。',
          callerCorrect: '我确认断电了才碰他的！安全！',
          callerIncorrect: '我太着急了没确认断电就上手了……',
        },
        miniGame: {
          kind: 'timedShock',
          title: '断电时机判断',
          instruction: '观察是否仍与电源接触，在确认已断电的安全窗口内进行急救操作。',
          passThreshold: 0.5,
          windows: 1,
          windowMs: 2000,
          shockCooldownMs: 3000,
          falsePenalty: 0.25,
          feedback: { good: '我确认断电了才碰他的！安全！', bad: '我太着急了没确认断电就上手了……' },
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
    good: '调度员指导CPR，按压约3分钟后患者出现自主呼吸。救护车到达后送医，心电图显示心肌损伤但无严重后遗症，住院一周后康复',
    bad: '现场迟迟不敢开始CPR担心二次触电，等待救护车到达时已错过黄金4分钟，患者因心脏骤停时间过长未能挽回',
    prank: '',
  },
}
