// ============================================================
// 零点接线台 — 急救指导浮层
// 展开态：居中模态卡片（半透明遮罩，地图仍可见）
// 折叠态：左下角悬浮球（点击展开）
// 折叠时 children 仍 mount，由调用方传 paused 冻结小游戏
// ============================================================

import type { CSSProperties, ReactNode } from 'react'
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
  // 折叠态：左下角悬浮球
  if (collapsed) {
    return (
      <button
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
          <ChevronDown size={14} color="#8b949e" />
        </span>
      </button>
    )
  }

  // 展开态：居中模态
  return (
    <>
      {/* 半透明遮罩：地图仍可见但不交互 */}
      <div style={styles.backdrop} onClick={onToggle} />
      {/* 居中卡片 */}
      <div style={styles.card}>
        <header style={styles.header}>
          <span style={styles.headerTitle}>{title}</span>
          <button
            style={styles.collapseBtn}
            onClick={onToggle}
            title="折叠为悬浮球（小游戏暂停）"
            aria-label="折叠为悬浮球"
          >
            <ChevronDown size={16} color="#8b949e" />
          </button>
        </header>
        <div style={styles.body}>{children}</div>
      </div>
    </>
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
    backgroundColor: '#11151c',
    border: '1px solid #ff3b3b',
    borderRadius: 30,
    boxShadow: '0 6px 20px rgba(255,59,59,0.25), 0 2px 8px rgba(0,0,0,0.5)',
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
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 58,
    cursor: 'pointer',
  },
  card: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 60,
    width: 640,
    maxWidth: 'calc(100vw - 80px)',
    maxHeight: 'calc(100vh - 160px)',
    backgroundColor: '#11151c',
    border: '1px solid #2a323e',
    borderTop: '2px solid #ff3b3b',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
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
    backgroundColor: '#0a0e14',
    borderBottom: '1px solid #2a323e',
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
