// ============================================================
// 120调度台 — 来电者说话特质表
// ============================================================
// 与 personas.ts 分开维护：
//   personas.ts 回答「他是谁」（姓名 / 关系 / 情绪基调 / 风格描述）
//   voices.ts   回答「他怎么说话」（可被机制读取的结构化特质）
//
// 依据 personas.ts 的 speechStyle 与 relationship 标注，
// 只影响措辞，不影响信息质量与评分。
// personality 口语素材全部可选 —— 未配置时回落中性行为。
// ============================================================

import type { CallerId, CallerVoice } from '../types'

const CALLER_VOICES: Record<CallerId, CallerVoice> = {
  // ===== 原始场景 =====
  li_jianguo: { // 语速极快、断断续续、带哭腔
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: {
      address: ['同志'],
      panicTick: 'sob',
      interjects: true,
      echoes: true,
      urges: ['同志你们快点啊，我老伴儿等不起了！', '你们来了没有啊，我一直抱着她呢！'],
    },
  },
  wang_xiao: { // 冷静但略显紧张、叙述有条理
    verbosity: 1, rationality: 2, medicalLiteracy: 1,
    personality: { catchphrases: ['那个'] },
  },
  zhang_xiulan: { // 说话慢、容易跑题、记不清细节
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      catchphrases: ['哎哟喂', '你说啥来着'],
      panicTick: 'stammer',
      echoes: true,
      rambleTails: [
        '……哎哟我这脑子，一着急啥都记不清了。',
        '……你说啥来着？我再说一遍给你听。',
        '……我这把年纪了，头一回碰上这种事儿。',
        '……隔壁老王家上次也是这样，后来……算了不说了。',
      ],
    },
  },
  zhao_lei: { // 大喊大叫、反复说"快点来"
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      catchphrases: ['快点儿', '哎呀'],
      panicTick: 'shout',
      interjects: true,
      rambleTails: [
        '……我跟你们说了多少遍了！快点儿！',
        '……哎呀我真是要急死了！',
        '……你们到底听没听见我说啥啊？',
      ],
    },
  },
  chen_ming: { // 紧张但尽力配合、主动提供信息
    verbosity: 1, rationality: 1, medicalLiteracy: 1,
    personality: { catchphrases: ['那个'] },
  },
  xiao_pang: { // 童声、嘻嘻哈哈
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      address: ['喂'],
      catchphrases: ['嘿', '嘿嘿'],
      panicTick: 'scream',
      rambleTails: ['……喂，你怎么不说话了呀？', '……嘿嘿，是不是被我吓到啦。'],
    },
  },

  // ===== 第二批 =====
  liu_fang: { // 哭腔急促、不停重复孩子的名字
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'sob', interjects: true, echoes: true,
      rambleTails: [
        '……宝宝你应一声啊，妈妈在这儿呢。',
        '……他才那么点儿大啊……',
        '……我求求你们了，快点……',
      ],
    },
  },
  sun_wei: { // 语速快但还算清晰、不断问怎么办
    verbosity: 1, rationality: 0, medicalLiteracy: 1,
    personality: {
      interjects: true, catchphrases: ['怎么办，怎么办'],
      urges: ['你们快告诉我我现在该干啥！别让我干等着！', '到底还要多久？我得做点啥吧！'],
    },
  },
  zhou_ming: { // 语气镇定、叙述有条理、冷静配合
    verbosity: 1, rationality: 2, medicalLiteracy: 1,
    personality: {},
  },
  wu_lili: { // 尖叫哭泣、需要反复安抚
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'sob', interjects: true,
      rambleTails: [
        '……你别挂电话行不行，我一个人害怕。',
        '……我真的不知道该怎么办了……',
        '……他要是没了我们娘俩怎么办啊……',
      ],
    },
  },
  huang_qiang: { // 声音发颤、不断追问还有多久
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      address: ['师傅'], interjects: true,
      rambleTails: [
        '……师傅，你们那个车到底走到哪儿了？',
        '……我从窗户往外看了好几回了，一辆车都没有。',
        '……我闺女还在边上哭着呢，我一个人顾不过来。',
      ],
    },
  },
  lin_mei: { // 紧张但配合、主动补充观察细节
    verbosity: 1, rationality: 1, medicalLiteracy: 2,
    personality: { catchphrases: ['那个'], preciseHead: ['我看的情况大概是这样，', '我尽量客观地说，'] },
  },
  ma_tao: { // 焦急但克制、反复确认操作
    verbosity: 1, rationality: 1, medicalLiteracy: 1,
    personality: { echoes: true },
  },
  ye_xin: { // 语速极快、夹杂哭喊
    verbosity: 2, rationality: 0, medicalLiteracy: 1,
    personality: {
      panicTick: 'sob', interjects: true,
      rambleTails: [
        '……我手上全是血，擦都擦不干净……',
        '……你可别睡啊，跟我说话！',
        '……我按住呢我一直按着呢，我不会松手的。',
      ],
    },
  },
  lu_jie: { // 惊慌混乱、说不清细节
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'stammer', echoes: true,
      urges: ['我真的慌了，你别问了我答不上来！', '你们先来行不行，我脑子是空的！'],
    },
  },
  fang_yu: { // 不知所措、需要明确指令
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'stammer', interjects: true,
      rambleTails: [
        '……你就直接告诉我先干啥吧，我听你的。',
        '……我啥都不懂，你可别嫌我问得多。',
        '……旁边人七嘴八舌的，我也不知道听谁的。',
      ],
    },
  },

  // ===== 第三批 =====
  xu_dawei: { // 说话断断续续、疼得倒吸冷气
    verbosity: 0, rationality: 1, medicalLiteracy: 1,
    personality: { panicTick: 'stammer', catchphrases: ['哎哟', '嘶——'] },
  },
  song_na: { // 声音发抖语速极快、不停哭喊
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'sob', interjects: true,
      rambleTails: [
        '……出血了出血了，裤子都染红了……',
        '……那狗还在那儿呢，我不敢过去……',
        '……她疼得话都说不出来了……',
      ],
    },
  },
  he_lin: { // 语气犹豫、不太确定现场情况
    verbosity: 1, rationality: 1, medicalLiteracy: 0,
    personality: {
      catchphrases: ['呃', '那个'], echoes: true,
      urges: ['呃……我不太敢碰他，你们快来吧。'],
    },
  },
  tian_feng: { // 强忍疼痛、说话简短
    verbosity: 0, rationality: 1, medicalLiteracy: 1,
    personality: { panicTick: 'stammer' },
  },
  cheng_xin: { // 尖叫哭喊无法冷静
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'scream', interjects: true,
      rambleTails: [
        '……孩子脸都紫了！他刚才还好好儿的！',
        '……我叫他他都不应我了！',
        '……你们是不是在路上啊？你们说句话啊！',
      ],
    },
  },
  luo_wei: { // 声音急促慌乱、不断追问
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: {
      interjects: true,
      urges: ['他这眼睛到底能不能保住啊？你快说句话！', '你们到了吗？我这儿快撑不住了！'],
    },
  },
  gao_yan: { // 声音虚弱含混、话说不完整
    verbosity: 0, rationality: 1, medicalLiteracy: 0,
    personality: { panicTick: 'stammer', echoes: true },
  },
  fan_tao: { // 着急但能配合、描述状态变化
    verbosity: 1, rationality: 1, medicalLiteracy: 2,
    personality: { catchphrases: ['那个'], preciseHead: ['我尽量说全一点，', '我把变化捋一下——'] },
  },
  long_jie: { // 语气迷糊、说不清来龙去脉
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'stammer', echoes: true,
      urges: ['我脑子是懵的，你快来一趟吧……', '我也不知道咋回事儿，反正就是叫不醒了。'],
    },
  },
  deng_yu: { // 语气低沉克制、明显焦虑
    verbosity: 0, rationality: 2, medicalLiteracy: 1,
    personality: { panicTick: 'stammer' },
  },
  jiang_wen: { // 颤抖着压低声音
    verbosity: 0, rationality: 1, medicalLiteracy: 0,
    personality: {
      panicTick: 'stammer',
      urges: ['你们快点吧，我怕他们还没走远……'],
    },
  },
  han_lei: { // 语气冷静但很用力、扶住患者
    verbosity: 1, rationality: 2, medicalLiteracy: 1,
    personality: {},
  },
  xu_mei: { // 焦急但条理清楚、主动描述
    verbosity: 2, rationality: 2, medicalLiteracy: 1,
    personality: {
      catchphrases: ['这孩子'],
      rambleTails: [
        '……这孩子从小体质就弱，一病就得拖好几天。',
        '……我把他这几天的情形都跟你说了，你看看要不要紧。',
        '……我是不是说太多了？你别嫌我啰嗦。',
      ],
    },
  },

  // ===== 补充 =====
  lei_gang: { // 声音沙哑慌乱、大喊着描述
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      panicTick: 'shout', interjects: true,
      rambleTails: [
        '……我这儿机器还响着呢，你听得见吗！',
        '……工地上全围过来了，七嘴八舌的我也听不清！',
        '……你说我是不是该先把他抬出去啊！',
      ],
    },
  },
  zhong_qi: { // 压低声音、反复问要不要报警
    verbosity: 1, rationality: 1, medicalLiteracy: 0,
    personality: {
      catchphrases: ['要不要报警'],
      interjects: true,
      urges: ['你们先来，别的我一会儿再说，我不敢大声说话。'],
    },
  },
  wei_qiang: { // 焦急但配合、反复催促
    verbosity: 1, rationality: 1, medicalLiteracy: 0,
    personality: {
      interjects: true,
      urges: ['你们得快点，我这边实在喊不应了！', '到楼下了吗？我下去接你们！'],
    },
  },
  zheng_yu: { // 说话断断续续、需要引导
    verbosity: 0, rationality: 1, medicalLiteracy: 1,
    personality: { panicTick: 'stammer', catchphrases: ['嘶——'] },
  },
}

/** 缺省特质：一般、一般、一般 */
export const DEFAULT_VOICE: CallerVoice = { verbosity: 1, rationality: 1, medicalLiteracy: 1 }

export function getVoice(id: CallerId): CallerVoice {
  return CALLER_VOICES[id] ?? DEFAULT_VOICE
}

export const ALL_VOICES = CALLER_VOICES