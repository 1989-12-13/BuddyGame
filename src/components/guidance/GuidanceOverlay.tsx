// ============================================================
// 零点接线台 — 急救指导浮层
// 展开态：居中模态卡片（半透明遮罩，地图仍可见）
// 折叠态：左下角悬浮球（点击展开）
// 折叠时 children 仍 mount，由调用方传 paused 冻结小游戏
// FAB↔Modal 通过 AnimatePresence mode="wait" 做 morph 过渡
// ============================================================

import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, HeartPulse } from 'lucide-react'

interface Props {
  /** 是否折叠为悬浮球 */
  collapsed: boolean
  /** 切换折叠/展开 */
  onToggle: () => void
  /** 卡片标题（如"♥ 心肺复苏 - CPR 指导"） */
  title: string
  /** 折叠球上的副信息（如"步骤 2/5"） */
  subtitle?: string
  /** 展开态完整内容（GuidancePanel） */
  children: ReactNode
}

export function GuidanceOverlay({ collapsed, onToggle, title, subtitle, children }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {collapsed ? (
        <motion.button
          key="fab"
          type="button"
          initial={{ opacity: 0, scale: 0.5, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.4, y: 16 }}
          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
          style={styles.fab}
          onClick={onToggle}
          title="展开急救指导"
          aria-label="展开急救指导"
        >
          <span style={styles.fabRing}>
            <HeartPulse size={22} color="#ff5454" strokeWidth={2.5} />
          </span>
          <span style={styles.fabText}>
            <span style={styles.fabTitle}>{title}</span>
            {subtitle && <span style={styles.fabSub}>{subtitle}</span>}
          </span>
          <span style={styles.fabHint}>
            <ChevronDown size={14} color="var(--text-muted)" />
          </span>
        </motion.button>
      ) : (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={styles.modalStage}
        >
          {/* 半透明遮罩：地图仍可见但不交互 */}
          <div style={styles.backdrop} onClick={onToggle} />
          {/* 居中卡片容器（flex 居中，子卡片走 motion scale） */}
          <div style={styles.cardCenter}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.04 }}
              style={styles.card}
            >
              <header style={styles.header}>
                <span style={styles.headerTitle}>{title}</span>
                <button
                  style={styles.collapseBtn}
                  onClick={onToggle}
                  title="折叠为悬浮球（小游戏暂停）"
                  aria-label="折叠为悬浮球"
                >
                  <ChevronDown size={16} color="var(--text-muted)" />
                </button>
              </header>
              <div style={styles.body}>{children}</div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles: Record<string, CSSProperties> = {
  // ---------- 折叠态：左下角悬浮球 ----------
  fab: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    zIndex: 55,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 14px 8px 8px',
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    border: '1px solid #ff3b3b',
    borderRadius: 30,
    boxShadow: '0 6px 24px rgba(255,59,59,0.3), 0 2px 8px rgba(0,0,0,0.5)',
    cursor: 'pointer',
    color: 'inherit',
    fontFamily: 'monospace',
    maxWidth: 280,
  },
  fabRing: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,59,59,0.12)',
    border: '1px solid rgba(255,59,59,0.4)',
    animation: 'pulse-live 1.4s ease-in-out infinite',
  },
  fabText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  fabTitle: {
    fontSize: 12,
    color: '#e6edf3',
    fontWeight: 700,
    letterSpacing: 0.5,
    maxWidth: 200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fabSub: {
    fontSize: 10,
    color: '#ffb000',
    fontWeight: 700,
  },
  fabHint: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 2,
  },
  // ---------- 展开态：居中模态 ----------
  modalStage: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 58,
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  cardCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  card: {
    pointerEvents: 'auto',
    zIndex: 60,
    width: 640,
    maxWidth: 'calc(100vw - 80px)',
    maxHeight: 'calc(100vh - 160px)',
    backgroundColor: 'var(--glass-bg-elevated)',
    backdropFilter: 'blur(calc(var(--glass-blur) + 4px)) saturate(150%)',
    WebkitBackdropFilter: 'blur(calc(var(--glass-blur) + 4px)) saturate(150%)',
    border: '1px solid var(--glass-border)',
    borderTop: '2px solid #ff3b3b',
    boxShadow: '0 24px 70px rgba(0,0,0,0.7), 0 0 40px rgba(255,59,59,0.05)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderBottom: '1px solid var(--glass-border)',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 14,
    color: '#ff5454',
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: 1,
  },
  collapseBtn: {
    background: 'transparent',
    border: '1px solid #2a323e',
    borderRadius: 4,
    cursor: 'pointer',
    padding: '4px 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 16px',
    minHeight: 0,
  },
}
