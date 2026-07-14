// ============================================================
// judgments 判断验证测试
// ============================================================

import { describe, it, expect } from 'vitest'
import { isPrankVerified } from './judgments'
import type { JudgmentPrompt } from '../types'

// ============================================================
// isPrankVerified
// ============================================================
describe('isPrankVerified', () => {
  const correctOption = { index: 0, label: '恶作剧/虚假报警', isCorrect: true }
  const wrongOption = { index: 1, label: '真实报警', isCorrect: false }

  it('正确识别恶作剧（chosenOptionIndex 指向 isCorrect=true）', () => {
    const judgments: JudgmentPrompt[] = [
      {
        id: 'j1',
        questionId: 'mpds_prank_patient',
        dialogueIndex: 0,
        options: [correctOption, wrongOption],
        chosenOptionIndex: 0,
      },
    ]
    expect(isPrankVerified(judgments)).toBe(true)
  })

  it('错误判断（选了 isCorrect=false）→ false', () => {
    const judgments: JudgmentPrompt[] = [
      {
        id: 'j1',
        questionId: 'mpds_prank_patient',
        dialogueIndex: 0,
        options: [correctOption, wrongOption],
        chosenOptionIndex: 1,
      },
    ]
    expect(isPrankVerified(judgments)).toBe(false)
  })

  it('未作答（chosenOptionIndex=null）→ false', () => {
    const judgments: JudgmentPrompt[] = [
      {
        id: 'j1',
        questionId: 'mpds_prank_patient',
        dialogueIndex: 0,
        options: [correctOption, wrongOption],
        chosenOptionIndex: null,
      },
    ]
    expect(isPrankVerified(judgments)).toBe(false)
  })

  it('空判定数组 → false', () => {
    expect(isPrankVerified([])).toBe(false)
  })

  it('无恶作剧相关判定（其他类型）→ false', () => {
    const judgments: JudgmentPrompt[] = [
      {
        id: 'j1',
        questionId: 'other_question',
        dialogueIndex: 0,
        options: [correctOption],
        chosenOptionIndex: 0,
      },
    ]
    expect(isPrankVerified(judgments)).toBe(false)
  })

  it('多个判定中有一个恶作剧正确即可', () => {
    const judgments: JudgmentPrompt[] = [
      {
        id: 'j1',
        questionId: 'other_question',
        dialogueIndex: 0,
        options: [wrongOption],
        chosenOptionIndex: 0,
      },
      {
        id: 'j2',
        questionId: 'mpds_prank_patient',
        dialogueIndex: 1,
        options: [correctOption, wrongOption],
        chosenOptionIndex: 0,
      },
    ]
    expect(isPrankVerified(judgments)).toBe(true)
  })
})
