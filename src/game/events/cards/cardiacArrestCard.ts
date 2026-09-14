// ============================================================
// MPDS 协议卡片 09 — 心脏/呼吸骤停/死亡
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CPR_MINI_GAME_INSTRUCTION } from '../../../components/minigames/engines/cprUtils'

export const cardiacArrestCard: EmergencyScenario = {
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

  // ============================================================
  // 手写对话脚本 — 李建国（丈夫）报告妻子心脏骤停
  // 来电者个性：语速极快、断断续续、带着哭腔
  // 关系：丈夫（对患者完全了解）
  // ============================================================
  script: {
    // --- 步骤1：位置确认 ---
    step1_location: {
      operator: '您好，120。您在哪儿？把地址告诉我。',
      operatorRetry: '地址我刚才没记全，麻烦把小区名和楼号再报一遍。',
      caller: {
        calm: ['望京西园三区，12号楼2单元501。'],
        tense: ['望京……望京西园三区！12号楼2单元501！你们快来！'],
        panic: ['望京！望京西园三区！12号楼……具体的我……501！你们快来啊！'],
        lost: ['就在望京……西园三区……快来……求求你们……'],
        retryPrefix: '我不是刚说了嘛——',
      },
      fillTerminal: { address: '望京西园三区12号楼2单元501室' },
      outburst: '你们到底来不来啊！地址我都说了好几遍了！',
      requireComplete: true,
      calmReply: {
        operatorCalm: '地址我记下了。我知道你急，救护车已经在路上了。咱接着说，下面每一个问题都能帮到她。',
        calm: '好……好，你问。',
        tense: '行……行，你问，我尽量。',
        panic: '你快说……我听着呢……',
        lost: '……嗯。',
      },
    },

    // --- 步骤1b：标志建筑 ---
    ask_landmark: {
      operator: '12号楼旁边有什么明显的店或者牌子吗？',
      caller: {
        calm: ['楼下有个京东便利店，门头是红色的。'],
        tense: ['楼下有个京东便利店！红色的牌子！你们到了就能看见！'],
        panic: ['有个店……红色的……京东便利店！就在楼下！'],
        lost: ['好像有个店……红色的……我不确定了……'],
      },
      fillTerminal: { address: '望京西园三区12号楼2单元501室，楼下有京东便利店' },
      calmReply: {
        operatorCalm: '好，京东便利店，我记下了。你做得很好，现在咱们继续。',
        calm: '好，你说。',
        tense: '行，我听着。',
        panic: '嗯……嗯，你说……',
        lost: '……好。',
      },
    },

    // --- 步骤2：事件经过 ---
    step2_event: {
      operator: '好，告诉我到底怎么了。',
      caller: {
        calm: ['我老婆刚才还在看电视，突然就倒在地上了。', '我叫她，推她，一点反应都没有。'],
        tense: ['她、她在看电视，好好的，突然就倒了！', '我叫她她不应，推她她不动！', '嘴角有点歪，嘴唇发紫！'],
        panic: ['她倒了！！就在我旁边倒的！！', '叫不动了！！推也不动！！', '嘴唇都紫了！！你们快来！！'],
        lost: ['刚才还好好的……突然就……', '她不会死了吧？不会吧？', '我不敢碰她……'],
      },
      fillTerminal: { chiefComplaint: '妻子突然倒地，无意识，嘴唇发紫', patientGender: '女性' },
      outburst: '她不行了！！你们到底在干什么！！快点来啊！！',
      calmReply: {
        operatorCalm: '我听清楚了。你爱人突然倒地，没有反应，嘴唇发紫——这些我都记下了。你现在是我唯一的帮手，你按我说的做，她就有机会。',
        calm: '好……我按你说的做。',
        tense: '好，好，你说，我做什么？',
        panic: '你说……我做什么……我听你的……',
        lost: '……我做什么……',
      },
    },

    // --- 步骤3：患者年龄 ---
    step3_age: {
      operator: '她多大岁数了？',
      caller: {
        calm: ['45岁。'],
        tense: ['45！她今年45！'],
        panic: ['45！！45岁！！'],
        lost: ['45……应该是45……对，45。'],
      },
      fillTerminal: { patientAge: '45岁' },
      calmReply: {
        operatorCalm: '好，45岁，记下了。别急，咱一个一个来。',
        calm: '好，你问。',
        tense: '行，你说。',
        panic: '嗯……嗯。',
        lost: '……好。',
      },
    },

    // --- 步骤4：意识与呼吸 ---
    step4_vitals: {
      operator: '她还有意识吗？还在喘气吗？',
      caller: {
        calm: ['没有意识，怎么叫都不醒。', '呼吸我也看了，胸口不动了。'],
        tense: ['没意识！叫都叫不醒！', '胸口……我看了……不动了！没有呼吸了！'],
        panic: ['没意识！！叫不动了！！', '胸口不动了！！没有呼吸！！', '你们快来啊！！'],
        lost: ['叫不动了……胸口也不动了……', '她是不是已经……', '不会的不会的……'],
      },
      fillTerminal: { conscious: false, breathing: false },
      outburst: '她没气了！！你们快来啊！！她要死了！！',
      calmReply: {
        operatorCalm: '听我说。没有意识、没有呼吸——这我知道了。现在你能救她。我会一步步教你做心肺复苏，你按我说的来，每一秒都很重要。先深呼吸，跟我做。',
        calm: '好……我跟你做。',
        tense: '好，好，你说，怎么做？',
        panic: '怎么做……你快说……我做了……',
        lost: '……我试试……',
      },
    },

    // --- 联系电话 ---
    ask_contact: {
      operator: '您的电话号码是多少？我记一下。',
      operatorRetry: '号码我刚才没记全，麻烦再报一遍，一个数字一个数字说。',
      caller: {
        calm: ['13877624321，就是这个号。'],
        tense: ['138……7762……4321！打这个就行！'],
        panic: ['138……就是这个手机！你打这个！4321！'],
        lost: ['就是这个手机……能打通吧……'],
      },
      fillTerminal: { contact: '138****4321' },
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
          callerCorrect: '好！我把她放平了！躺地板上了！然后呢？下一步我该做什么？！',
          callerIncorrect: '啊？扶她起来坐着？她人都没反应了怎么坐啊……你是不是说错了？',
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
          callerIncorrect: '放肚子上了……但是她肚子一点反应都没有啊……我真的放对了吗？她没动静啊！',
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
      {
        id: 'cpr_game',
        instruction: '开始心肺复苏：30次胸外按压后做2次人工呼吸，循环2轮。',
        prompt: '实操环节：CPR 30:2',
        options: ['开始'],
        correctIndex: 0,
        feedback: {
          correct: 'CPR操作到位。',
          incorrect: 'CPR操作需改进。',
          callerCorrect: '我按了30下又吹了2口气，她好像有反应了！',
          callerIncorrect: '我太紧张了，手一直在抖……按不准节奏',
        },
        miniGame: {
          kind: 'cpr',
          title: '心肺复苏 30:2',
          instruction: CPR_MINI_GAME_INSTRUCTION,
          passThreshold: 0.5,
          cycles: 2,
          feedback: { good: '我按了30下又吹了2口气，她好像有反应了！', bad: '我太紧张了，手一直在抖……按不准节奏' },
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
    good: '你让丈夫把她平放到地上，一句一句带着他数按压的次数，直到电话那头传来推门和脚步声。他后来只记得一句"别停"。',
    bad: '问清楚情况花的时间太长，等指导开始时已经过去好几分钟。丈夫一直在问"要不要先扶她起来"，没有人答他。',
    prank: '',
  },
}
