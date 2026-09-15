import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createInitialState } from '../../game/core/worldState'
import { worldReducer } from '../../game/core/worldReducer'
import type { WorldState } from '../../game/types'
import { DispatchAction } from './DispatchAction'

/** 接听起来电，并按需要补齐登记表字段 */
function callState(patch: Partial<WorldState['terminal']> = {}): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: ['cardiac_arrest'] })
  const answered = worldReducer(started, { type: 'ANSWER_CALL' })
  return { ...answered, terminal: { ...answered.terminal, ...patch } }
}

const FULL = {
  address: '望京西园三区12号楼2单元501室',
  contact: '138****4321',
  conscious: false,
  breathing: false,
  determinant: 'ECHO' as const,
  triage: 'red' as const,
}

describe('派车入口', () => {
  it('条件齐备时给出可点的「规划救援路线」', () => {
    render(<DispatchAction state={callState(FULL)} onGoToTask={vi.fn()} onPlanRoute={vi.fn()} />)
    expect(screen.getByRole('button', { name: /规划救援路线/ })).toBeEnabled()
    expect(screen.queryByLabelText('还差什么')).toBeNull()
  })

  it('四项齐了但缺联系电话时，按钮置灰并说明「确认联系电话」', () => {
    // 这是心脏骤停最容易撞上的情况：判定码由判断题早早补齐，联系电话是最后一个问题。
    // 旧实现只检查「地点/意识/呼吸/判定码」，按钮亮着却点不动。
    const withoutContact = { ...FULL, contact: '' }
    render(<DispatchAction state={callState(withoutContact)} onGoToTask={vi.fn()} onPlanRoute={vi.fn()} />)

    expect(screen.getByRole('button', { name: /规划救援路线/ })).toBeDisabled()
    expect(screen.getByText('确认联系电话')).toBeInTheDocument()
  })

  it('患者已死亡 / 已派车这类终局状态下不再提示派车', () => {
    const state = callState(FULL)
    const dispatched = { ...state, dispatchSent: true }
    render(<DispatchAction state={dispatched} onGoToTask={vi.fn()} onPlanRoute={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /规划救援路线/ })).toBeNull()
  })
})
