// ============================================================
// 零点接线台 — 右侧抽屉（折叠 72px / 展开 480px）
// 地图始终可见，对话/操作浮在右侧
// ============================================================

import type { CSSProperties, ReactNode } from 'react'
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
}

export function CallDrawer({ open, onToggle, mini, children, title, active }: Props) {
  return (
    <aside
      style={{
        ...styles.drawer,
        width: open ? 480 : 72,
      }}
    >
      {/* 折叠态：竖向窄条 */}
      {!open && (
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
      )}

      {/* 展开态：完整面板 */}
      {open && (
        <div style={styles.expanded}>
          <header style={styles.header}>
            <div style={styles.headerLeft}>
              <Phone size={14} color={active ? '#ff3b3b' : '#6e7681'} strokeWidth={2.5} />
              <span style={styles.headerTitle}>{title}</span>
            </div>
            <button style={styles.toggleBtn} onClick={onToggle} title="折叠（保留通话）">
              <ChevronRight size={18} color="#8b949e" />
            </button>
          </header>
          <div style={styles.body}>{children}</div>
        </div>
      )}
    </aside>
  )
}

const styles: Record<string, CSSProperties> = {
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#11151c',
    borderLeft: '1px solid #2a323e',
    boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
    transition: 'width 0.25s ease',
    overflow: 'hidden',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
  },
  // ---------- 折叠态 ----------
  collapsedBar: {
    width: 72,
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
    width: 480,
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #2a323e',
    backgroundColor: '#0a0e14',
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
