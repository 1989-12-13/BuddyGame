import { StrictMode } from 'react'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStreamingQueue } from './useStreamingQueue'
import { Transcript } from '../Transcript'
import { createInitialState } from '../../../game/core/worldState'
import { worldReducer } from '../../../game/core/worldReducer'
import { DEFAULT_SHIFT_CONFIG, answerLine, createShiftState, focusedLine, shiftReducer, tickShift } from '../../../game/core/shift'
import type { WorldState } from '../../../game/types'

/** 一通已接听、但还没问任何问题的电话：对话流里只有系统行 + 来电者开场白 */
function answeredCall() {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: ['cardiac_arrest'] })
  return worldReducer(started, { type: 'ANSWER_CALL' })
}

/** 模拟 WorkbenchScreen 的做法：每播完一行就把进度写回这通电话的状态 */
function markStreamed(state: WorldState, index: number): WorldState {
  return worldReducer(state, { type: 'MARK_LINES_STREAMED', throughIndex: index })
}

/** 模拟「离屏期间这条线路又产生了新的一行」 */
function withExtraLine(state: WorldState, text: string): WorldState {
  return {
    ...state,
    dialogueLog: [...state.dialogueLog, { speaker: 'caller' as const, text, timestamp: state.shiftElapsed + 30 }],
  }
}

/** 开场白的字符数 */
function openingLength(state: WorldState) {
  return [...state.dialogueLog[1].text].length
}

/** 工作台里对话流那一小块的等价物：hook + Transcript */
function TranscriptHarness({ state, onStreamed }: { state: WorldState; onStreamed?: (index: number) => void }) {
  const { streamIdx, streamPos, pendingSet } = useStreamingQueue(state, onStreamed)
  return (
    <Transcript
      state={state}
      onReplay={() => {}}
      onStop={() => {}}
      streamIdx={streamIdx}
      streamPos={streamPos}
      pendingSet={pendingSet.current}
    />
  )
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useStreamingQueue · 开场白', () => {
  it('挂载时已在对话流里的开场白会自动开始逐字输出', () => {
    const state = answeredCall()
    const { result } = renderHook(() => useStreamingQueue(state))

    act(() => { vi.advanceTimersByTime(400) })

    expect(result.current.streamIdx).toBe(1)
    expect(result.current.streamPos).toBeGreaterThan(0)
  })

  it('受 React StrictMode 双挂载影响后，开场白仍然开始输出（开发模式回归）', () => {
    const state = answeredCall()
    const { result } = renderHook(() => useStreamingQueue(state), { wrapper: StrictMode })

    act(() => { vi.advanceTimersByTime(400) })

    expect(result.current.streamIdx).toBe(1)
    expect(result.current.streamPos).toBeGreaterThan(0)
    expect(result.current.pendingSet.current.has(1)).toBe(false)
  })

  it('播完一行会把进度写回这通电话的状态', () => {
    const state = answeredCall()
    const marked: number[] = []
    renderHook(() => useStreamingQueue(state, index => marked.push(index)))

    act(() => { vi.advanceTimersByTime(9000) })

    expect(marked).toContain(1)
  })
})

describe('useStreamingQueue · 线路之间来回切换', () => {
  it('进度经 shiftReducer 落到线路自己的世界状态里', () => {
    let shift = createShiftState(DEFAULT_SHIFT_CONFIG)
    for (let i = 0; i < 6 && !shift.lines.some(line => line.phase === 'ringing'); i++) shift = tickShift(shift)
    const ringing = shift.lines.find(line => line.phase === 'ringing')!
    const answered = answerLine(shift, ringing.id)
    expect(focusedLine(answered)!.world.streamedLines).toBe(0)

    const marked = shiftReducer(answered, { type: 'MARK_LINES_STREAMED', throughIndex: 1 })

    expect(focusedLine(marked)!.world.streamedLines).toBe(2)
  })

  it('切走再切回：历史直接完整显示，只补播离屏期间的新行', () => {
    const state = answeredCall()
    const marked: number[] = []
    const first = renderHook(() => useStreamingQueue(state, index => marked.push(index)))
    act(() => { vi.advanceTimersByTime(9000) })   // 开场白播完
    first.unmount()

    const resumed = withExtraLine(markStreamed(state, marked[0]), '他还说头有点晕，想吐')
    const second = renderHook(() => useStreamingQueue(resumed))
    act(() => { vi.advanceTimersByTime(200) })

    // 历史行不再排队重播，只有离屏期间的新行在流式
    expect(second.result.current.pendingSet.current.has(1)).toBe(false)
    expect(second.result.current.streamIdx).toBe(2)
  })

  it('StrictMode 双挂载下切回来也不重播历史（开发模式回归）', () => {
    // 开场白已经播过：世界状态里记着 streamedLines = 2
    const resumed = withExtraLine(markStreamed(answeredCall(), 1), '他还说头有点晕')
    const { result } = renderHook(() => useStreamingQueue(resumed), { wrapper: StrictMode })

    act(() => { vi.advanceTimersByTime(200) })

    // 只补播新行，历史行不再入队
    expect(result.current.pendingSet.current.has(1)).toBe(false)
    expect(result.current.streamIdx).toBe(2)
  })

  it('切走时那一行只播了一半：切回来后从头重新流式', () => {
    const state = answeredCall()
    const marked: number[] = []
    const first = renderHook(() => useStreamingQueue(state, index => marked.push(index)))
    act(() => { vi.advanceTimersByTime(150) })
    expect(first.result.current.streamPos).toBeGreaterThan(0)
    expect(first.result.current.streamPos).toBeLessThan(openingLength(state))
    first.unmount()

    // 没播完 → 没记账 → 切回来应从头重播
    expect(marked).toEqual([])
    const second = renderHook(() => useStreamingQueue(state))
    act(() => { vi.advanceTimersByTime(150) })

    expect(second.result.current.streamIdx).toBe(1)
    expect(second.result.current.streamPos).toBeGreaterThan(0)
    expect(second.result.current.streamPos).toBeLessThan(openingLength(state))
  })

  it('切走再切回且期间没有新行：不重播，也不进入流式状态', () => {
    const state = answeredCall()
    const marked: number[] = []
    const first = renderHook(() => useStreamingQueue(state, index => marked.push(index)))
    act(() => { vi.advanceTimersByTime(9000) })
    first.unmount()

    const second = renderHook(() => useStreamingQueue(markStreamed(state, marked[0])))
    act(() => { vi.advanceTimersByTime(400) })

    expect(second.result.current.streamIdx).toBe(-1)
    expect(second.result.current.isStreaming).toBe(false)
  })

  it('下一通电话从头开始流式（世界重建后进度归零）', () => {
    const state = answeredCall()
    const marked: number[] = []
    const first = renderHook(() => useStreamingQueue(state, index => marked.push(index)))
    act(() => { vi.advanceTimersByTime(9000) })
    first.unmount()

    const nextCall = worldReducer(
      worldReducer(markStreamed(state, marked[0]), { type: 'START_SHIFT', forceScenarios: ['stroke'] }),
      { type: 'ANSWER_CALL' },
    )
    const second = renderHook(() => useStreamingQueue(nextCall))
    act(() => { vi.advanceTimersByTime(400) })

    expect(second.result.current.streamIdx).toBe(1)
    expect(second.result.current.streamPos).toBeGreaterThan(0)
  })
})

describe('useStreamingQueue · 字幕实际渲染', () => {
  it('切回来的一瞬间，看过的历史就是完整文本，只有新行在排队', () => {
    let world = answeredCall()
    const opening = world.dialogueLog[1].text
    const mark = (index: number) => { world = markStreamed(world, index) }

    const first = render(<StrictMode><TranscriptHarness state={world} onStreamed={mark} /></StrictMode>)
    act(() => { vi.advanceTimersByTime(9000) })
    expect(document.querySelector('.message-caller p')?.textContent).toBe(opening)
    first.unmount()

    // 离屏期间这条线路又产生一行
    world = withExtraLine(world, '他还说头有点晕')
    render(<StrictMode><TranscriptHarness state={world} /></StrictMode>)

    const bubbles = document.querySelectorAll('.message-caller')
    expect(bubbles).toHaveLength(2)
    // 看过的历史：直接是完整文本，既不在排队也不在逐字打
    expect(bubbles[0].querySelector('p')?.textContent).toBe(opening)
    expect(bubbles[0].className).not.toContain('is-streaming')
    expect(bubbles[0].className).not.toContain('is-queued')
    // 离屏期间的新行：还在往外蹦，没有整句亮相
    expect(bubbles[1].textContent).not.toContain('他还说头有点晕')
  })
})
