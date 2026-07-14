// ============================================================
// EventToastStack — 顶部即时反馈 toast 堆叠
// 每个 PatientEvent 自动 3.5s 后建议 dismiss（由父组件计时）
// ============================================================

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react'
import type { PatientEvent } from '../../game/types'
import { C_SUCCESS, C_WARNING, C_DARK_DANGER, C_DEEP_BLUE } from '../../game/core/colors'
import { slideInDown, DUR_NORMAL } from '../animations/presets'

interface Props {
  events: PatientEvent[]
  onDismiss: (eventId: string) => void
  /** 同时最多显示几个 toast */
  maxVisible?: number
}

const KIND_STYLE: Record<PatientEvent['kind'], { color: string; bg: string; Icon: typeof Info }> = {
  good: { color: C_SUCCESS, bg: 'var(--success-green-bg)', Icon: CheckCircle2 },
  warn: { color: C_WARNING, bg: 'var(--warning-amber-bg)', Icon: AlertTriangle },
  bad:  { color: C_DARK_DANGER, bg: 'var(--danger-red-bg)', Icon: XCircle },
  info: { color: C_DEEP_BLUE, bg: 'var(--info-cyan-bg)', Icon: Info },
}

/** Toast 自动消失时长（毫秒） */
const TOAST_TTL: Record<PatientEvent['kind'], number> = {
  good: 2800,
  warn: 4500,
  bad: 4500,
  info: 2800,
}

export function EventToastStack({ events, onDismiss, maxVisible = 4 }: Props) {
  // 最新的在底部（贴近游戏内容），只显示最后 maxVisible 个
  const visible = events.slice(-maxVisible)

  return (
    <div style={{
      position: 'fixed',
      top: 56,                                // Hud 下方留 8px 呼吸空间
      left: '50%',
      transform: 'translateX(-50%)',          // 水平居中
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      zIndex: 200,
      pointerEvents: 'none',
      width: 360,
      // 避免与左侧调度卡（420px）+ 右侧 drawer（600px+）重叠；
      // 视口窄于 1080px 时 toast 自动缩窄
      maxWidth: 'min(360px, calc(100vw - 1080px))',
    }}>
      <AnimatePresence mode="popLayout">
        {visible.map(e => (
          <ToastItem key={e.id} event={e} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ event, onDismiss }: { event: PatientEvent; onDismiss: (id: string) => void }) {
  const style = KIND_STYLE[event.kind]
  const { Icon } = style

  useEffect(() => {
    const ttl = TOAST_TTL[event.kind]
    const id = setTimeout(() => onDismiss(event.id), ttl)
    return () => clearTimeout(id)
  }, [event.id, event.kind, onDismiss])

  return (
    <motion.div
      variants={slideInDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: DUR_NORMAL }}
      layout
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        backgroundColor: style.bg,
        border: `1px solid ${style.color}40`,
        borderLeft: `3px solid ${style.color}`,
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: 12,
        color: 'var(--text-primary)',
        pointerEvents: 'auto',
      }}
    >
      <Icon size={14} color={style.color} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>{event.text}</span>
      <button
        onClick={() => onDismiss(event.id)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 2,
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="关闭"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}
