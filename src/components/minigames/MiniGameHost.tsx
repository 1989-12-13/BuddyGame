// ============================================================
// MiniGameHost — 按 kind 分发到对应小游戏引擎
// 使用 lookup map 替代 if-else 链
// ============================================================

import type { ComponentType } from 'react'
import { Component } from 'react'
import type { MiniGameSpec, MiniGameKind } from '../../game/types'
import { RhythmPress } from './engines/RhythmPress'
import { QuickChoice } from './engines/QuickChoice'
import { StepOrder } from './engines/StepOrder'
import { LocationSelect } from './engines/LocationSelect'
import { CprGame } from './engines/CprGame'

interface Props {
  spec: MiniGameSpec
  onComplete: (score: number, passed: boolean) => void
  /** 折叠/遮罩时暂停计时与输入 */
  paused?: boolean
}

// ---- Error Boundary ----
interface EBState { hasError: boolean; errorMsg: string }
class MiniGameErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, errorMsg: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 16, borderRadius: 8, backgroundColor: 'var(--danger-red-bg)',
          border: '1px solid var(--danger-red)', fontSize: 'var(--fs-body-sm)', color: 'var(--danger-red)',
        }}>
          <strong>小游戏渲染异常</strong>
          <p style={{ fontSize: 'var(--fs-small)', marginTop: 4, opacity: 0.8 }}>{this.state.errorMsg}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            style={{ marginTop: 8, padding: '6px 14px', cursor: 'pointer' }}
          >重试</button>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Lookup map ----
const ENGINE_MAP: Record<MiniGameKind, ComponentType<{ spec: MiniGameSpec; onComplete: Props['onComplete']; paused?: boolean }>> = {
  rhythmPress: RhythmPress,
  quickChoice: QuickChoice,
  stepOrder: StepOrder,
  locationSelect: LocationSelect,
  cpr: CprGame,
}

const SHELL: React.CSSProperties = {
  borderTop: '2px solid var(--accent-blue)',
  padding: '12px 14px',
  backgroundColor: 'transparent',
  overflowY: 'auto',
  boxShadow: '0 1px 0 0 var(--accent-blue), var(--shadow-md)',
}

const TITLE: React.CSSProperties = {
  fontSize: 'var(--fs-body-lg)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--accent-blue)',
  marginBottom: 2,
  letterSpacing: 0.3,
}

const INSTR: React.CSSProperties = {
  fontSize: 'var(--fs-caption)',
  color: 'var(--text-secondary)',
  marginBottom: 10,
  lineHeight: 1.5,
  paddingLeft: 2,
}

export function MiniGameHost({ spec, onComplete, paused }: Props) {
  const Engine = ENGINE_MAP[spec.kind]

  return (
    <MiniGameErrorBoundary>
      <div style={SHELL}>
        <div style={TITLE}>◆ {spec.title}</div>
        <div style={INSTR}>{spec.instruction}</div>
        {Engine && <Engine spec={spec} onComplete={onComplete} paused={paused} />}
      </div>
    </MiniGameErrorBoundary>
  )
}
