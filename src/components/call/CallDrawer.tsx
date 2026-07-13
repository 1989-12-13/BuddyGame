// ============================================================
// 零点接线台 — 右侧抽屉（折叠 72px / 展开 480px）
// 地图始终可见，对话/操作浮在右侧
// 宽度走 motion spring，内部折叠/展开态用 AnimatePresence 交叉淡入
// ============================================================

import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react'

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

export function CallDrawer({ open, onToggle, mini, children, title, active, historyBadge }: Props) {
  return (
    <motion.aside
      animate={{ width: open ? DRAWER_W_OPEN : DRAWER_W_CLOSED }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      style={styles.drawer}
    >
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
                      backgroundColor: active ? '#ff3b3b' : '#3a4452',
                      animation: active ? 'pulse-live 1s ease-in-out infinite' : 'none',
                    }}
                  />
                  <span style={styles.verticalText}>{title}</span>
                  <div style={styles.miniWrap}>{mini}</div>
                  <span style={styles.expandIcon}><ChevronLeft size={20} color="#8b949e" /></span>
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
              <div style={styles.expanded}>
                <header style={styles.header}>
                  <div style={styles.headerLeft}>
                    <Phone size={14} color={historyBadge ? '#fbbf24' : (active ? '#ff3b3b' : '#6e7681')} strokeWidth={2.5} />
                    <span style={styles.headerTitle}>{title}</span>
                    {historyBadge && (
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        background: 'rgba(251, 191, 36, 0.15)',
                        color: '#fbbf24',
                        border: '1px solid rgba(251, 191, 36, 0.4)',
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
                    <ChevronRight size={18} color="#8b949e" />
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
    overflow: 'hidden',
    zIndex: 50,
  },
  // 内部交叉淡入层：相对定位，子元素 absolute 重叠避免布局抖动
  swapLayer: {
    position: 'relative',
    width: '100%',
    height: '100%',
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
    color: '#8b949e',
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
    width: DRAWER_W_OPEN,
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
    color: '#e6edf3',
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: 1,
  },
  toggleBtn: {
    background: 'transparent',
    border: '1px solid #2a323e',
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
