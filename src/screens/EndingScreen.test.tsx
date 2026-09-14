import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CallEvaluation, DimensionEvaluation, EvaluationDimensionKey, ShiftEvaluation } from '../game/types'
import { EndingScreen } from './EndingScreen'

vi.mock('../audio/AudioContext', () => ({ useAudio: () => ({ play: vi.fn() }) }))

const labels: Record<EvaluationDimensionKey, string> = {
  attitude: '接线态度', guidance: '指导技术', knowledge: '知识储备', timing: '时间把控', outcome: '救援成效',
}

function dimension(key: EvaluationDimensionKey, grade: DimensionEvaluation['grade']): DimensionEvaluation {
  return { key, label: labels[key], grade, evidence: [`${labels[key]}证据`], improvement: null }
}

const dimensions: ShiftEvaluation['dimensions'] = {
  attitude: dimension('attitude', 'A'),
  guidance: dimension('guidance', 'S'),
  knowledge: dimension('knowledge', 'B'),
  timing: dimension('timing', 'C'),
  outcome: dimension('outcome', 'S'),
}

const call: CallEvaluation = {
  callInstanceId: 1,
  scenarioId: 'test',
  scenarioTitle: '多人事故',
  isPrank: false,
  vehicleDispatched: true,
  patientCount: 3,
  activeSeconds: 42,
  outcome: 'rescued',
  outcomeLabel: '成功救治',
  arrivalNarrative: '救护车抵达现场时，三名患者均已得到初步处置。',
  dimensions,
  overallGrade: 'B',
  profile: { id: 'qualified', title: '守住了基本盘', subtitle: '仍有提升空间', description: '画像评价', badge: 'B · 合格' },
  reviewPoints: [],
  safetyViolation: false,
  criticalPatientRescued: false,
}

const evaluation: ShiftEvaluation = {
  calls: [call], completedCallCount: 1, dimensions, overallGrade: 'B', profile: call.profile,
  rescuedCount: 3, worsenedCount: 1, deathCount: 0, transferredCount: 1, unresolvedCount: 0,
  prankCount: 0, missedCount: 1, missedCalls: [{ scenarioId: 'missed', title: '未接病例' }],
  activeSeconds: 42, endingNarrative: '班次平稳结束。', narrative: '共处理 1 通。', incidents: [],
}

describe('EndingScreen 五维结算', () => {
  it('展示人数、画像、雷达图和逐病例叙事，不显示旧分数', () => {
    const { container } = render(<EndingScreen evaluation={evaluation} onRestart={vi.fn()} />)
    expect(screen.getByLabelText('综合评级 B')).toBeInTheDocument()
    expect(screen.getByText('本班完成')).toBeInTheDocument()
    expect(screen.getByText('1', { selector: '.completed-total strong' })).toBeInTheDocument()
    expect(screen.getByText('本班次确认救治')).toBeInTheDocument()
    expect(screen.getByText('3', { selector: '.saved-total strong' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('五维评价雷达图')).not.toHaveLength(0)
    expect(screen.getByText(call.arrivalNarrative)).toBeInTheDocument()
    expect(screen.getByText('未接病例')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/总分|得分|\/100/)
  })
})
