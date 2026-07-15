import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { GripVertical } from 'lucide-react'
import type { TerminalState, MpdsDeterminant } from '../../../game/types'
import type { TerminalField } from '../../../game/core/actions'
import { styles } from '../styles'
import { TerminalForm } from './TerminalForm'

const TERMINAL_W_DEFAULT = 420
const TERMINAL_W_MIN = 320
const TERMINAL_W_MAX = 560

/** MPDS 调度卡 leftsider（替代 popup，自动展开动画）
 * v2 重构：宽度可拖拽（320-560px），持久化到 localStorage */
export function TerminalModal({
  terminal,
  dispatchSent,
  ambulanceRemaining,
  onChange,
  onSetStatus,
  onSetDeterminant,
  onSetDeterminantSubcode,
  onSetProtocol,
  onDispatch,
  onClose,
  onEndCall,
}: {
  terminal: TerminalState
  dispatchSent: boolean
  ambulanceRemaining: number
  onChange: (field: TerminalField, value: string) => void
  onSetStatus: (field: 'conscious' | 'breathing', value: boolean) => void
  onSetDeterminant: (d: MpdsDeterminant) => void
  onSetDeterminantSubcode: (subcode: number) => void
  onSetProtocol: (protocol: number) => void
  onDispatch: () => void
  onClose: () => void
  onEndCall: () => void
}) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return TERMINAL_W_DEFAULT
    const saved = Number(window.localStorage.getItem('buddy-game-terminal-w'))
    return Number.isFinite(saved) && saved >= TERMINAL_W_MIN && saved <= TERMINAL_W_MAX
      ? saved
      : TERMINAL_W_DEFAULT
  })
  const [hover, setHover] = useState(false)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('buddy-game-terminal-w', String(width))
  }, [width])

  const handleResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { startX: e.clientX, startW: width }
    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return
      // sider 在左边 → 拖右 = 拉宽 = 增加宽度 = +dx
      const dx = ev.clientX - dragRef.current.startX
      const newW = Math.max(TERMINAL_W_MIN, Math.min(TERMINAL_W_MAX, dragRef.current.startW + dx))
      setWidth(newW)
    }
    const onUp = () => {
      dragRef.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [width])

  return (
    <motion.aside
      initial={{ x: '-100%' }}
      animate={{ x: 0, width }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 240, damping: 30 }}
      style={styles.modalOverlay}
    >
      {/* 右侧拖拽手柄 */}
      <div
        onPointerDown={handleResizeDown}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onDoubleClick={() => setWidth(TERMINAL_W_DEFAULT)}
        title="拖拽调整宽度 · 双击重置"
        style={{
          ...resizeHandleStyle,
          backgroundColor: hover ? 'var(--accent-blue)' : 'transparent',
        }}
      >
        <span style={{ ...resizeGripStyle, opacity: hover ? 1 : 0.35 }}>
          <GripVertical size={10} color="currentColor" strokeWidth={2.5} />
        </span>
      </div>

      <div style={styles.modalCard}>
        {/* sider 头部 */}
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderLeft}>
            <span style={styles.mpdsModalBadge}>
              协议 {terminal.protocolNumber ?? '?'}
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                MPDS 调度终端
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                判定码：{terminal.determinant
                  ? `${terminal.protocolNumber ?? '?'}-${terminal.determinant[0]}-${terminal.determinantSubcode ?? '?'}`
                  : '未选择'}
              </div>
            </div>
          </div>
          <div style={styles.modalHeaderRight}>
            <button style={styles.modalCloseBtn} onClick={onClose} title="关闭调度卡">
              ✕
            </button>
          </div>
        </div>

        {/* sider 内容 */}
        <div style={styles.modalBody}>
          {/* 终端登记表单 */}
          <div style={{ marginTop: 8 }}>
            <TerminalForm
              terminal={terminal}
              onChange={onChange}
              onSetStatus={onSetStatus}
              onSetDeterminant={onSetDeterminant}
              onSetDeterminantSubcode={onSetDeterminantSubcode}
              onSetProtocol={onSetProtocol}
            />
          </div>
        </div>

        {!dispatchSent && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 16px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--accent-blue-dim)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            lineHeight: 1.5,
          }}>
            <strong style={{ color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>下一步 · 路线规划</strong>
            <span>系统自动匹配救护车后，你需要沿相邻节点选择完整路线。</span>
          </div>
        )}

        {/* sider 底部 — 操作按钮 */}
        <div style={styles.modalFooter}>
          {!dispatchSent ? (
            <>
              <button style={styles.modalEndCallBtn} onClick={onEndCall}>
                ✕ 挂断
              </button>
              <div style={{ flex: 1 }} />
              <button style={styles.modalSaveBtn} onClick={onClose}>
                ≡ 暂存
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  下一步 · 路线规划
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  沿相邻节点选择完整路线，确认抵达事件点
                </span>
                <button
                  style={{
                    ...styles.modalDispatchBtn,
                    ...(!terminal.determinant ? styles.modalDispatchBtnDisabled : {}),
                  }}
                  onClick={onDispatch}
                  disabled={!terminal.determinant}
                  title={terminal.determinant ? '进入路线规划：沿相邻节点选择完整路线后确认派车' : '请先在调度卡中选择 MPDS 判定码'}
                >
                  ▸ 进入路线规划
                </button>
              </div>
            </>
          ) : (
            <div style={styles.dispatchSent}>
              <span style={{ fontSize: 20 }}>▸</span>
              <div>
                <div style={{ fontWeight: 'bold', color: '#15803d' }}>救护车已派出</div>
                {ambulanceRemaining > 0 ? (
                  <div style={{ color: 'var(--danger-red)', fontSize: 12 }}>
                    预计 {ambulanceRemaining} 秒后到达现场
                  </div>
                ) : (
                  <div style={{ color: 'var(--accent-green)', fontSize: 12, fontWeight: 'bold' }}>
                    救护车已到达现场！
                  </div>
                )}
              </div>
              <button style={styles.modalCloseBtn} onClick={onClose}>✕ 关闭</button>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}

const resizeHandleStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: -2,
  width: 4,
  cursor: 'col-resize',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s',
}

const resizeGripStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 16,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 3,
  color: 'var(--text-secondary)',
  pointerEvents: 'none',
  transition: 'opacity 0.15s',
}
