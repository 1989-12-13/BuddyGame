// ============================================================
// 120调度台 — 来电者回答的排版工具
//
// 一个 MPDSQuestion 有四段回答（平静 / 模糊 / 絮叨 / 失真）。手写时最容易
// 每段都写成同一种腔调，读起来就像同一个人念稿。answerSet 把四段并排放在
// 一起，逼着写的人给每一段不同的说话状态；回答仍然由 writer 完全掌控。
// ============================================================

import type { MPDSQuestion } from '../../types'

export type AnswerSet = Pick<
  MPDSQuestion,
  'answer' | 'answerVague' | 'ramblingAnswer' | 'panickedAnswer'
>

/**
 * @param clear    镇定时的完整回答 —— 说清事实，句子完整
 * @param vague    紧张时的模糊回答 —— 词不达意，回避核心
 * @param ramble   絮叨版 —— 跑题、自我更正、夹杂无关信息
 * @param panic    高压失真版 —— 语无伦次、重复、说不下去
 */
export function answerSet(clear: string, vague: string, ramble: string, panic: string): AnswerSet {
  return { answer: clear, answerVague: vague, ramblingAnswer: ramble, panickedAnswer: panic }
}

/** 无絮叨素材时的兜底：把清晰回答重复一遍，避免出现空字符串 */
export function terseAnswer(clear: string, vague: string, panic: string): AnswerSet {
  return answerSet(clear, vague, clear, panic)
}
