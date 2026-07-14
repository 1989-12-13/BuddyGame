// ============================================================
// 零点接线台 — 右侧抽屉（折叠 72px / 展开 600px 可拖拽调宽度）
// 地图始终可见，对话/操作浮在右侧
// 宽度走 motion spring，内部折叠/展开态用 AnimatePresence 交叉淡入
// 展开态左侧 4px 拖拽手柄可调宽度（380-820px）
// ============================================================

import { useState, useRef, useCallback, useEffect, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Phone, GripVertical } from 'lucide-react'

interface Props {
  open: boolean
  onToggle: () => void
  /** 折叠态迷你信息（竖向）：通话计时、生命条等 */
  mini: ReactNode
  /** 展开态完整内容（PhoneHeader/对话/问询/指导） */
  children: ReactNode
  /** 顶部标题（如"通话中 02:34"），无通话时用于提示 */
  title: string
  /** 是否在通话中（控制折叠态指示灯颜色） */
  active: boolean
  /** 历史任务徽章（如"历史任务"），覆盖 active 颜色提示 */
  historyBadge?: string
}

const DRAWER_W_OPEN = 600
const DRAWER_W_CLOSED = 72
const DRAWER_W_MIN = 380
const DRAWER_W_MAX = 820

export function CallDrawer({ open, onToggle, mini, children, title, active, historyBadge }: Props) {
  // 用户可调宽度（持久于本地存储）
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return DRAWER_W_OPEN
    const saved = Number(window.localStorage.getItem('buddy-game-drawer-w'))
    return Number.isFinite(saved) && saved >= DRAWER_W_MIN && saved <= DRAWER_W_MAX ? saved : DRAWER_W_OPEN
  })
  const [resizeHover, setResizeHover] = useState(false)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('buddy-game-drawer-w', String(drawerWidth))
  }, [drawerWidth])

  const handleResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { startX: e.clientX, startW: drawerWidth }
    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return
      // drawer 在右边 → 拖左 = 拉宽 = 增加宽度 = -dx
      const dx = ev.clientX - dragRef.current.startX
      const newW = Math.max(DRAWER_W_MIN, Math.min(DRAWER_W_MAX, dragRef.current.startW - dx))
      setDrawerWidth(newW)
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
  }, [drawerWidth])

  return (
    <motion.aside
      animate={{ width: open ? drawerWidth : DRAWER_W_CLOSED }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      style={styles.drawer}
    >
      {/* 左侧拖拽手柄（仅展开态可见） */}
      {open && (
        <div
          onPointerDown={handleResizeDown}
          onPointerEnter={() => setResizeHover(true)}
          onPointerLeave={() => setResizeHover(false)}
          onDoubleClick={() => setDrawerWidth(DRAWER_W_OPEN)}
          title="拖拽调整宽度 · 双击重置"
          style={{
            ...styles.resizeHandle,
            backgroundColor: resizeHover ? 'var(--accent-blue)' : 'transparent',
          }}
        >
          <span style={{
            ...styles.resizeGrip,
            opacity: resizeHover ? 1 : 0.35,
          }}>
            <GripVertical size={10} color="currentColor" strokeWidth={2.5} />
          </span>
        </div>
      )}
      <div style={styles.swapLayer}>
        <AnimatePresence initial={false}>
          {!open ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={styles.swapChild}
            >
              <button style={styles.collapsedBar} onClick={onToggle} title="展开通话面板">
                <div style={styles.verticalStack}>
                  <span
                    style={{
                      ...styles.liveDot,
                      backgroundColor: active ? '#ff3b3b' : 'var(--border-bright)',
                      animation: active ? 'pulse-live 1s ease-in-out infinite' : 'none',
                    }}
                  />
                  <span style={styles.verticalText}>{title}</span>
                  <div style={styles.miniWrap}>{mini}</div>
                  <span style={styles.expandIcon}><ChevronLeft size={20} color="var(--text-secondary)" /></span>
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={styles.swapChild}
            >
              <div style={{ ...styles.expanded, width: drawerWidth }}>
                <header style={styles.header}>
                  <div style={styles.headerLeft}>
                    <Phone size={14} color={historyBadge ? 'var(--accent-gold)' : (active ? '#ff3b3b' : 'var(--text-muted)')} strokeWidth={2.5} />
                    <span style={styles.headerTitle}>{title}</span>
                    {historyBadge && (
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        background: 'var(--accent-gold-bg)',
                        color: 'var(--accent-gold)',
                        border: '1px solid var(--accent-gold-border)',
                        borderRadius: 3,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}>
                        {historyBadge}
                      </span>
                    )}
                  </div>
                  <button style={styles.toggleBtn} onClick={onToggle} title="折叠（保留通话）">
                    <ChevronRight size={18} color="var(--text-secondary)" />
                  </button>
                </header>
                <div style={styles.body}>{children}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

const styles: Record<string, CSSProperties> = {
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    borderLeft: '1px solid var(--glass-border)',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
    overflow: 'visible',
    zIndex: 50,
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -2,
    width: 4,
    cursor: 'col-resize',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  },
  resizeGrip: {
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
  },
  // 内部交叉淡入层：相对定位，子元素 absolute 重叠避免布局抖动
  swapLayer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 'inherit',
  },
  swapChild: {
    position: 'absolute',
    inset: 0,
  },
  // ---------- 折叠态 ----------
  collapsedBar: {
    width: '100%',
    height: '100%',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: 'inherit',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '12px 4px',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  },
  verticalText: {
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    letterSpacing: 1,
    fontWeight: 700,
    maxHeight: 200,
  },
  miniWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  expandIcon: {
    marginTop: 'auto',
    display: 'flex',
  },
  // ---------- 展开态 ----------
  expanded: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: 1,
  },
  toggleBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    cursor: 'pointer',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
}