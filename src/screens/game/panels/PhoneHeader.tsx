import { ChevronRight } from 'lucide-react'
import type { CalleeStressLevel } from '../../../game/types'
import { styles } from '../styles'
import { useDispatchCard } from '../../../contexts/DispatchCardContext'

/** 电话面板顶部 — LIVE 指示器 + 通话计时 + 超时警告 + 调度卡入口 + 收起按钮 */
export function PhoneHeader({
  elapsed,
  stressLevel,
  onToggle,
}: {
  phoneNumber: string
  baseStation: string
  callerName: string
  relationship: string
  callPhase: string
  elapsed: number
  stressLevel: CalleeStressLevel
  stress: number
  onToggle?: () => void
}) {
  const mm = Math.floor(elapsed / 60)
  const ss = elapsed % 60
  const urgent = elapsed >= 45
  const dispatchCard = useDispatchCard()

  return (
    <div style={styles.phoneHeader}>
      {/* 第一行：LIVE指示器 + 通话计时 + 调度卡入口 + 收起 */}
      <div style={styles.callLiveBar}>
        <span style={styles.liveDot}>●</span>
        <span style={styles.liveLabel}>LIVE</span>
        <span style={{
          ...styles.callTimer,
          color: urgent ? 'var(--danger)' : 'var(--warning)',
          fontWeight: urgent ? 'var(--fw-black)' : 'var(--fw-bold)',
        }}>
          通话 {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-6)'}}>
          {/* 目标派车计时徽章 */}
          <span style={{
            ...styles.targetBadge,
            color: urgent ? 'var(--danger)' : 'var(--warning)',
            borderColor: urgent ? 'var(--danger)' : 'var(--warning)',
          }}>
            {urgent ? '⚠ 超时' : '目标 60秒派车'}
          </span>

          {/* 调度卡入口 — 通话中且未打开时显示 */}
          {dispatchCard?.isAvailable && !dispatchCard?.isOpen && (
            <button
              onClick={dispatchCard.open}
              title="打开调度卡"
              style={{
                padding: 'var(--space-2) var(--space-12)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line-strong)',
                backgroundColor: 'var(--accent-dim)',
                color: 'var(--accent)',
                fontSize: 'var(--fs-small)',
                fontWeight: 'var(--fw-bold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onPointerEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)' }}
              onPointerLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent-dim)' }}
            >
              ▣ 调度卡
            </button>
          )}

          {/* 收起按钮 */}
          {onToggle && (
            <button
              onClick={onToggle}
              title="折叠通话面板"
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                padding: 'var(--space-2) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-2)',
              }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 来电者情绪失控警告 */}
      {stressLevel === '失控' && (
        <div style={styles.callPhaseTag}>
          <span style={{ color: 'var(--danger)' }}>来电者情绪失控</span>
        </div>
      )}
    </div>
  )
}
