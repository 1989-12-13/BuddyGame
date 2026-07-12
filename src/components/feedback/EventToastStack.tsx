// ============================================================
// EventToastStack — 顶部即时反馈 toast 堆叠
// 每个 PatientEvent 自动 3.5s 后建议 dismiss（由父组件计时）
// ============================================================

import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react'
import type { PatientEvent } from '../../game/types'

interface Props {
  events: PatientEvent[]
  onDismiss: (eventId: string) => void
  /** 同时最多显示几个 toast */
  maxVisible?: number
}

const KIND_STYLE: Record<PatientEvent['kind'], { color: string; bg: string; Icon: typeof Info }> = {
  good: { color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 },
  warn: { color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle },
  bad:  { color: '#dc2626', bg: '#fef2f2', Icon: XCircle },
  info: { color: '#2563eb', bg: '#eff6ff', Icon: Info },
}

export function EventToastStack({ events, onDismiss, maxVisible = 4 }: Props) {
  // 最新的在底部（贴近游戏内容），只显示最后 maxVisible 个
  const visible = events.slice(-maxVisible)

  return (
    <div style={{
      position: 'fixed',
      top: 50,           // HUD 下方
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      zIndex: 200,
      pointerEvents: 'none',
      maxWidth: 340,
    }}>
      {visible.map(e => (
        <ToastItem key={e.id} event={e} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ event, onDismiss }: { event: PatientEvent; onDismiss: (id: string) => void }) {
  const style = KIND_STYLE[event.kind]
  const { Icon } = style

  // 自动 3.5s 后消失（good/info 更快）
  useEffect(() => {
    const ttl = event.kind === 'good' || event.kind === 'info' ? 2800 : 4500
    const id = setTimeout(() => onDismiss(event.id), ttl)
    return () => clearTimeout(id)
  }, [event.id, event.kind, onDismiss])

  return (
    <div style={{
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
      color: '#1e293b',
      animation: 'slide-in-right 0.25s ease-out',
      pointerEvents: 'auto',
    }}>
      <Icon size={14} color={style.color} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>{event.text}</span>
      <button
        onClick={() => onDismiss(event.id)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 2,
          cursor: 'pointer',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="关闭"
      >
        <X size={12} />
      </button>
    </div>
  )
}
