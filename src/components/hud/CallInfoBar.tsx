// ============================================================
// 120调度台 — 通话信息条（HUD 第二行）
// 通话中显示：地址、电话、生命体征、情绪、ETA 等动态字段
// 折叠 drawer 时同步折叠隐藏（节省屏幕空间）
// 信息字段随游戏进展分阶段渐入（"提取中..." → 信息完善 → 完成）
// ============================================================

import { motion, AnimatePresence } from 'motion/react'
import type { CSSProperties } from 'react'
import { MapPin, Phone, Activity, HeartPulse, Clock } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { TRIAGE_LABELS } from '../../game/types'
import { C_DANGER, C_WARNING, C_SUCCESS } from '../../game/core/colors'

interface Props {
  state: WorldState
  /** drawer 折叠时整体隐藏，节省屏幕顶部空间 */
  visible: boolean
}

const SIZE = 13

function pillStyle(detail: { color?: string; muted?: boolean } = {}): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid var(--line)',
    background: detail.muted ? 'var(--bg-raised)' : 'var(--bg-hover)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
    minHeight: 24,
    fontSize: 12,
    color: detail.muted ? 'var(--text-3)' : 'var(--text)',
  }
}

function PillIcon({ children, color = 'var(--text-2)' }: { children: React.ReactNode; color?: string }) {
  return <span style={{ display: 'flex', color }}>{children}</span>
}

/** 单一字段信息条单元 — 信息"渐入"动效：null/空 → 占位 → 填充值 */
function Field({
  icon,
  label,
  value,
  hint,
  color,
  revealed,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
  hint?: string
  color?: string
  /** false 表示信息尚未从对话中提取出来，显示占位 */
  revealed: boolean
}) {
  return (
    <motion.div
      style={pillStyle({ color, muted: !revealed })}
      initial={false}
      animate={{
        opacity: revealed ? 1 : 0.55,
        scale: revealed ? 1 : 0.98,
      }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      title={hint ?? label}
    >
      <PillIcon color={color ?? 'var(--text-2)'}>{icon}</PillIcon>
      <span style={{
        fontSize: 10,
        color: 'var(--text-3)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
      }}>
        {label}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {revealed && value ? (
          <motion.span
            key="filled"
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.18 }}
            style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--text)' }}
          >
            {value}
          </motion.span>
        ) : (
          <motion.span
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ fontStyle: 'italic', color: 'var(--text-3)' }}
          >
            —
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function CallInfoBar({ state, visible }: Props) {
  if (!state.currentCall || !state.callerState) return null

  const call = state.currentCall
  const cs = state.callerState
  const ps = state.patientStatus

  const addressRevealed = cs.revealedInfo.address !== 'none'
  const addressValue = addressRevealed ? (state.terminal.address || '…提取中') : null

  const triageValue = state.terminal.triage ? TRIAGE_LABELS[state.terminal.triage] : null

  const callElapsed = state.shiftElapsed - state.callStartTime
  const mm = String(Math.floor(callElapsed / 60)).padStart(2, '0')
  const ss = String(callElapsed % 60).padStart(2, '0')
  const callTimeColor = callElapsed > 60 ? C_DANGER : callElapsed > 43 ? C_WARNING : C_SUCCESS

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="callinfo"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            overflow: 'hidden',
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
            borderBottom: '1px solid var(--line-soft)',
          }}
        >
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            padding: '6px 16px',
          }}>
            {/* 通话计时 */}
            <motion.div
              style={{ ...pillStyle(), borderColor: `color-mix(in srgb, ${callTimeColor} 25%, transparent)` }}
              animate={{ borderColor: `color-mix(in srgb, ${callTimeColor} 25%, transparent)` }}
            >
              <PillIcon color={callTimeColor}>
                <Clock size={SIZE} strokeWidth={2.5} />
              </PillIcon>
              <span style={lblStyle}>通话</span>
              <span style={{ ...valStyle, color: callTimeColor, fontSize: 13 }}>{mm}:{ss}</span>
            </motion.div>

            {/* 电话 */}
            <Field
              icon={<Phone size={SIZE} strokeWidth={2.5} />}
              label="电话"
              value={call.phoneNumber}
              revealed
              color="var(--accent)"
              hint={call.phoneNumber}
            />

            {/* 地址 */}
            <Field
              icon={<MapPin size={SIZE} strokeWidth={2.5} />}
              label="地址"
              value={addressValue}
              revealed={addressRevealed}
              color="var(--warning)"
              hint={addressValue ?? '尚未确认地址'}
            />

            {/* 生命体征 */}
            {ps && (
              <Field
                icon={<HeartPulse size={SIZE} strokeWidth={2.5} />}
                label="体征"
                value={`${Math.round(ps.stability)}% ${ps.died ? '· 死亡' : ''}`}
                color={ps.died ? 'var(--text-3)' : ps.stability < 30 ? 'var(--danger)' : ps.stability < 60 ? 'var(--warning)' : 'var(--success)'}
                revealed
              />
            )}

            {/* 意识/呼吸 */}
            {state.terminal.conscious !== null && (
              <Field
                icon={<Activity size={SIZE} strokeWidth={2.5} />}
                label="状态"
                value={`${state.terminal.conscious ? '有意识' : '无意识'}${state.terminal.breathing !== null ? (state.terminal.breathing ? '·呼吸正常' : '·呼吸异常') : ''}`}
                color={state.terminal.conscious && state.terminal.breathing ? 'var(--success)' : 'var(--danger)'}
                revealed
              />
            )}

            {/* 分诊 */}
            {triageValue && (
              <Field
                icon={<HeartPulse size={SIZE} strokeWidth={2.5} />}
                label="分诊"
                value={triageValue.split(' — ')[0]}
                color={state.terminal.triage === 'red' ? 'var(--danger)' : state.terminal.triage === 'yellow' ? 'var(--warning)' : state.terminal.triage === 'green' ? 'var(--success)' : 'var(--text-3)'}
                revealed
              />
            )}

            {/* 救护车 ETA */}
            {state.dispatchSent && state.ambulanceRemaining > 0 && (
              <Field
                icon={<HeartPulse size={SIZE} strokeWidth={2.5} />}
              label="ETA"
              value={`${state.ambulanceRemaining}s`}
              color="var(--danger)"
              revealed
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const lblStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--text-3)',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
}

const valStyle: CSSProperties = {
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
}
