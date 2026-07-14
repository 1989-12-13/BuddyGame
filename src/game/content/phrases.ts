// ============================================================
// 零点接线台 — 可复用短语/反馈模板
// 消除 33 张卡片重复书写相同模式的反馈文案
// 使用 {pronoun}/{gender} 插值由调用方统一替换
// ============================================================

import { getPronoun } from './pronouns'
import type { PatientGender } from './pronouns'

export { getPronoun }
export type { PatientGender }

/** 标准协议步骤定义 — 与 askQuestion.ts 的 5 步协议一一对应 */
export const PROTOCOL_STEPS = [
  { step: 1, id: 'step1_location', icon: '◉', label: '位置确认', qText: '请问事发的确切地址是哪里？', desc: '派车根本依据' },
  { step: 2, id: 'step2_event', icon: '≡', label: '事件简述', qText: '好的，请告诉我具体发生了什么事？', desc: '获取主诉入口' },
  { step: 3, id: 'step3_age', icon: '○', label: '患者年龄', qText: '患者多大年龄了？', desc: '关键救治因素' },
] as const

/** 步骤4（意识与呼吸）含动态人称，传入 gender 获取正确的问题 */
export function getVitalsStepQText(gender: PatientGender | string): string {
  const pronoun = getPronoun(gender)
  return `患者清醒吗？${pronoun}还有呼吸吗？`
}

/**
 * 通用常用短语/提示模板
 * 注：不直接插入代词——调用方传递已处理好的字符串
 */
export const COMMON_PHRASES = {
  /** 正确反馈模板（技术判定用） */
  correct: {
    generic: '正确！',
    cpr: '正确！标准CPR是深度5-6cm，频率100-120次/分钟。',
    heimlich: '正确！请立即执行！',
    bandage: '正确！加压包扎可以持续止血。',
    sideLie: '正确，侧卧可以防止分泌物堵塞气道。',
    seal: '正确。三边封闭形成活瓣，允许胸腔内气体排出但阻止空气进入。',
  },

  /** 错误反馈模板（技术判定用） */
  incorrect: {
    generic: '不对。',
    cpr: '不对。按压力度不够或太快太慢都会影响效果。标准是5cm深度，100-120次/分钟。',
    heimlich: '不对。完全性气道梗阻必须持续急救，不能等待。继续腹部冲击！',
    bandage: '不对。创可贴太小，止血药粉也不适合动脉出血。需要用绷带或布条紧紧缠绕。',
    sideLie: '不对，平躺可能导致分泌物堵塞气道。',
    seal: '不对。纱布塞入伤口会让异物进入胸腔，且无法密封。应使用不透气材料三边封闭。',
  },

  /** 来电者做对了某事的常见反应模式 */
  callerCorrect: {
    generic: '好的！我照做了！',
  },

  /** 来电者做错了某事的常见反应模式 */
  callerIncorrect: {
    generic: '啊？我是不是做错了？',
  },

  /** 步骤提示前缀 */
  stepPrompt: (n: number, label: string) => `第${stepNumberChinese(n)}步：${label}`,
  /** 实操提示前缀 */
  gamePrompt: (label: string) => `实操环节：${label}`,

  /** 通用开场指导语前缀 */
  guidanceIntro: (patientDesc: string) => `救护车已经在路上了。在救护车到达之前，请您按照我的指令来帮助${patientDesc}。`,

  /** "正确/不对" 简评 + 补充说明 */
  judgeResult: (isCorrect: boolean, detail: string) => isCorrect ? `正确！${detail}` : `不对。${detail}`,
} as const

function stepNumberChinese(n: number): string {
  const map = ['', '一', '二', '三', '四', '五', '六', '七']
  return map[n] ?? String(n)
}
