// ============================================================
// MPDS 协议 21 — 出血/撕裂伤
// 分诊级别: 濒危（红色）
// ============================================================

import type { EmergencyScenario } from '../../types'
import { CAMPAIGN_GUIDANCE } from './campaignGuidance'

export const hemorrhageCard: EmergencyScenario = {
  id: 'hemorrhage',
  title: '玻璃割伤大出血',
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

  variants: [
    {
      id: 'workshop_saw',
      callers: ['lei_gang', 'fang_yu'],
      openingLine: '喂120！车间里出事了！老张用电锯锯木头，手滑了一下，锯到大腿了！裤子全是血，他站都站不住了！',
      purpose: '血止不住！我拿工作服压着了！要不要弄个绳子在他大腿根那儿扎起来？！',
      condition: {
        chiefComplaint: '木工车间电锯伤及大腿，大量出血，伤员站立不稳',
        age: '46岁',
        gender: '男性',
        consciousness: '还醒着，但说头晕，脸色发灰',
        breathing: '呼吸很急，一直在冒冷汗',
        patientCount: '1人',
        additional: [
          '右大腿前侧一条很深的斜切口子',
          '血一直往外涌，工作服一下就湿透了',
          '锯片上还挂着碎布，已经断电了',
          '车间里有木屑，地上很滑',
        ],
      },
      answers: {
        mpds_hem_bleed_type: {
          answer: '涌出来的！不是喷的，但是量特别大，一块毛巾按上去马上就透了！',
          answerVague: '一直涌……好多……',
          ramblingAnswer: '不是那种一阵一阵喷的，就是一直往外涌，咕咚咕咚的。我拿他一整件工作服按上去的，没两下就洇透了，手都能感觉到热的。他刚才还能站着，现在得靠着我，说眼前发黑。地上这一片全湿了，我脚底下都打滑。',
          panickedAnswer: '血一直涌！！按都按不住！！他身上都是血！！我手上一片红！！',
        },
        mpds_hem_foreign: {
          answer: '伤口里好像有木屑，还有一点锯片上蹭下来的东西，我看不太清',
          answerVague: '有……木头渣……',
          ramblingAnswer: '木屑肯定有，锯木头嘛，到处都是。伤口里我看不太清楚，好像卡着点黑的东西，不知道是木刺还是别的。我不敢伸手去掏，就用布整个压住了。他那个伤口挺深的，翻着口。',
          panickedAnswer: '里面好像有东西！！木屑！！我不敢碰！！',
        },
      },
      specialEvents: [
        {
          id: 'hem_workshop_shock',
          trigger: 'after_dispatch',
          triggerValue: '',
          type: 'new_symptom',
          dialogue: '老张现在说得话都连不上了，一个劲说冷，嘴唇都发白了……他刚才还好好的！这是不是要休克了？！',
        },
      ],
      outcomeNarrative: {
        good: '你让他不要反复掀开查看伤口，用整块布料持续按住，也提醒别再往伤口里掏东西。救护车赶到时出血已经明显减缓，人还清醒着被抬上车。',
        bad: '电话里没说清能不能用绳子捆，来电者自己在大腿根上勒了一道，过紧又不敢松，等救护车到的时候那侧脚趾已经发紫了。',
      },
      menu: { category: '创伤出血', desc: '车间电锯伤 · 加压止血', tag: '🔢' },
    },
  ],

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

  guidance: CAMPAIGN_GUIDANCE.hemorrhage,

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
    good: '你让叶欣压住不动、别去动那块玻璃，她就一直没松手。救护车进门的时候她还跪在地上压着，白衬衫袖子全红了。',
    bad: '叶欣问到能不能拔那块玻璃，电话里没来得及拦住。她拔了之后血一下涌得更凶，她自己也吓得哭了出来。',
    prank: '',
  },
}
