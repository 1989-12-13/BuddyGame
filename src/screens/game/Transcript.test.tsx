import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createInitialState } from '../../game/core/worldState'
import { worldReducer } from '../../game/core/worldReducer'
import { getCaller } from '../../game/npc/personas'
import { Transcript } from './Transcript'

function beginCall(scenarioId = 'falls_elderly') {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [scenarioId] })
  return worldReducer(started, { type: 'ANSWER_CALL' })
}

const noop = () => {}

describe('Transcript · 来电实录顶栏', () => {
  it('顶栏同时承载来电者身份与登记完成度', () => {
    const state = beginCall()
    const caller = getCaller(state.currentCall!.callerId)
    render(<Transcript state={state} onReplay={noop} onStop={noop} />)

    const bar = document.querySelector('.transcript-bar') as HTMLElement
    expect(bar).toBeTruthy()

    // 谁在电话那头
    const callerChip = bar.querySelector('.tb-caller') as HTMLElement
    expect(callerChip.textContent).toContain(caller.name)
    expect(callerChip.textContent).toContain(caller.relationship)
    expect(callerChip.textContent).toContain('情绪')

    // 登记还差什么
    const checks = within(bar).getByLabelText('登记完成度')
    for (const label of ['地点', '意识', '呼吸', '判定码']) {
      expect(checks.textContent).toContain(label)
    }

    // 回声与记录工具仍在
    expect(within(bar).getByLabelText('重播上一句')).toBeTruthy()
    expect(within(bar).getByLabelText('停止语音')).toBeTruthy()
  })

  it('不再渲染已删除的信息状态条', () => {
    render(<Transcript state={beginCall()} onReplay={noop} onStop={noop} />)

    expect(document.querySelector('.fact-strip')).toBeNull()
    expect(screen.queryByLabelText('信息状态')).not.toBeInTheDocument()
  })

  it('顶栏不再有「来电实录」标题与图标', () => {
    render(<Transcript state={beginCall()} onReplay={noop} onStop={noop} />)

    expect(document.querySelector('.tb-title')).toBeNull()
    expect(screen.queryByRole('heading', { name: '来电实录' })).not.toBeInTheDocument()
  })

  it('对话流里不展示系统提示，但系统提示仍留在数据层', () => {
    const state = beginCall()
    // 接听会写入一条系统提示（来电号码 / 基站定位 / 情绪）
    expect(state.dialogueLog.some(line => line.speaker === 'system')).toBe(true)

    render(<Transcript state={state} onReplay={noop} onStop={noop} />)

    expect(document.querySelectorAll('.message-system')).toHaveLength(0)
    expect(document.querySelector('.transcript-scroll')!.textContent).not.toContain('基站定位')
    // 来电者的开场白仍然要显示
    expect(document.querySelector('.message-caller')!.textContent).toContain(state.currentCall!.openingLine)
  })

  it('登记四项齐备后，完成度全部标记为已完成', () => {
    const base = beginCall()
    const state = {
      ...base,
      terminal: {
        ...base.terminal,
        address: '望江路 128 号',
        conscious: true,
        breathing: true,
        determinant: 'CHARLIE' as const,
        triage: 'yellow' as const,
      },
    }
    render(<Transcript state={state} onReplay={noop} onStop={noop} />)

    expect(screen.getByLabelText('登记完成度').querySelectorAll('li.done')).toHaveLength(4)
  })
})
