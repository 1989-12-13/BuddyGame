// ============================================================
// MiniGameHost — 按 kind 分发到对应小游戏引擎
// ============================================================

import type { MiniGameSpec } from '../../game/types'
import { RhythmPress } from './engines/RhythmPress'
import { BlowInflate } from './engines/BlowInflate'
import { AimForce } from './engines/AimForce'
import { HoldPressure } from './engines/HoldPressure'
import { PositionDrag } from './engines/PositionDrag'
import { TimedShock } from './engines/TimedShock'

interface Props {
  spec: MiniGameSpec
  onComplete: (score: number, passed: boolean) => void
}

const SHELL: React.CSSProperties = {
  borderTop: '2px solid #38bdf8',
  padding: '12px 14px',
  backgroundColor: '#0a0f1f',
  maxHeight: 360,
  overflowY: 'auto',
}

const TITLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 'bold',
  color: '#38bdf8',
  marginBottom: 4,
}

const INSTR: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  marginBottom: 10,
  lineHeight: 1.5,
}

export function MiniGameHost({ spec, onComplete }: Props) {
  return (
    <div style={SHELL}>
      <div style={TITLE}>🎮 {spec.title}</div>
      <div style={INSTR}>{spec.instruction}</div>
      {spec.kind === 'rhythmPress' && <RhythmPress spec={spec} onComplete={onComplete} />}
      {spec.kind === 'blowInflate' && <BlowInflate spec={spec} onComplete={onComplete} />}
      {spec.kind === 'aimForce' && <AimForce spec={spec} onComplete={onComplete} />}
      {spec.kind === 'holdPressure' && <HoldPressure spec={spec} onComplete={onComplete} />}
      {spec.kind === 'positionDrag' && <PositionDrag spec={spec} onComplete={onComplete} />}
      {spec.kind === 'timedShock' && <TimedShock spec={spec} onComplete={onComplete} />}
    </div>
  )
}
