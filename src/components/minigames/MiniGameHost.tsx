// ============================================================
// MiniGameHost — 按 kind 分发到对应小游戏引擎
// ============================================================

import type { MiniGameSpec } from '../../game/types'
import { RhythmPress } from './engines/RhythmPress'
import { QuickChoice } from './engines/QuickChoice'
import { HoldPressure } from './engines/HoldPressure'
import { PositionDrag } from './engines/PositionDrag'
import { StepOrder } from './engines/StepOrder'
import { LocationSelect } from './engines/LocationSelect'
import { CprGame } from './engines/CprGame'

interface Props {
  spec: MiniGameSpec
  onComplete: (score: number, passed: boolean) => void
  /** 折叠/遮罩时暂停计时与输入 */
  paused?: boolean
}

const SHELL: React.CSSProperties = {
  borderTop: '2px solid var(--accent-blue)',
  padding: '12px 14px',
  backgroundColor: 'transparent',
  overflowY: 'auto',
  boxShadow: '0 1px 0 0 var(--accent-blue), var(--shadow-md)',
}

const TITLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 'bold',
  color: 'var(--accent-blue)',
  marginBottom: 2,
  letterSpacing: 0.3,
}

const INSTR: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 10,
  lineHeight: 1.5,
  paddingLeft: 2,
}

export function MiniGameHost({ spec, onComplete, paused }: Props) {
  return (
    <div style={SHELL}>
      <div style={TITLE}>◆ {spec.title}</div>
      <div style={INSTR}>{spec.instruction}</div>
      {spec.kind === 'rhythmPress' && <RhythmPress spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'quickChoice' && <QuickChoice spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'holdPressure' && <HoldPressure spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'positionDrag' && <PositionDrag spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'stepOrder' && <StepOrder spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'locationSelect' && <LocationSelect spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'cpr' && <CprGame spec={spec} onComplete={onComplete} paused={paused} />}
    </div>
  )
}
