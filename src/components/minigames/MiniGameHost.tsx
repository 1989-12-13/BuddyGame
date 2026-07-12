// ============================================================
// MiniGameHost — 按 kind 分发到对应小游戏引擎
// ============================================================

import type { MiniGameSpec } from '../../game/types'
import { RhythmPress } from './engines/RhythmPress'
import { AimForce } from './engines/AimForce'
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
  borderTop: '2px solid #58a6ff',
  padding: '12px 14px',
  backgroundColor: 'transparent',
  overflowY: 'auto',
}

const TITLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 'bold',
  color: '#58a6ff',
  marginBottom: 4,
}

const INSTR: React.CSSProperties = {
  fontSize: 12,
  color: '#8b949e',
  marginBottom: 10,
  lineHeight: 1.5,
}

export function MiniGameHost({ spec, onComplete, paused }: Props) {
  return (
    <div style={SHELL}>
      <div style={TITLE}>◆ {spec.title}</div>
      <div style={INSTR}>{spec.instruction}</div>
      {spec.kind === 'rhythmPress' && <RhythmPress spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'aimForce' && <AimForce spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'holdPressure' && <HoldPressure spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'positionDrag' && <PositionDrag spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'stepOrder' && <StepOrder spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'locationSelect' && <LocationSelect spec={spec} onComplete={onComplete} paused={paused} />}
      {spec.kind === 'cpr' && <CprGame spec={spec} onComplete={onComplete} paused={paused} />}
    </div>
  )
}
