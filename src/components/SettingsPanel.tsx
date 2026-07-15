// ============================================================
// 设置面板 — 左上角齿轮按钮 + 调度卡垂直快捷入口（参照右侧 CollapsedDrawer 风格）
// 内含回到主菜单/音量/主题
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Settings, Home, Volume2, Moon, Sun, AlertTriangle, ChevronRight } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAudio } from '../audio/AudioContext'
import { useDispatchCard } from '../contexts/DispatchCardContext'
import { Z_SETTINGS } from '../game/core/zIndex'

interface Props {
  /** 回到主菜单回调 */
  onNavigate?: (target: 'title') => void
}

const PILL_W = 64
const PILL_H = 320

export function SettingsPanel({ onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { theme, toggle } = useTheme()
  const { volume, setVolume } = useAudio()
  const dispatchCard = useDispatchCard()

  // 点击面板外部关闭 + Escape 关闭
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const menuItemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    border: 'none',
    background: 'none',
    color: 'var(--text-primary)',
    fontSize: 'var(--fs-body)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
  }

  const handleOpenDispatch = () => {
    if (!dispatchCard?.isAvailable) return
    dispatchCard.open()
    setOpen(false)
  }

  // 状态语义
  const hasTriage = !!dispatchCard?.hasTriage
  const isAvailable = !!dispatchCard?.isAvailable

  // 状态条填充比例：未分诊=35%（红色警示），已分诊=100%（绿色）
  const statusFillRatio = !isAvailable ? 0 : hasTriage ? 1 : 0.35
  const statusColor = !isAvailable
    ? 'var(--text-muted)'
    : hasTriage
      ? 'var(--accent-green)'
      : 'var(--danger-red)'
  const dotColor = !isAvailable
    ? 'var(--border-bright)'
    : hasTriage
      ? 'var(--accent-green)'
      : '#ff3b3b'

  return (
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: 85, left: 16, zIndex: Z_SETTINGS, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* 齿轮按钮 */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="设置"
        style={{
          width: 36,
          height: 36,
          fontSize: 'var(--fs-title)',
          border: '1px solid var(--glass-border)',
          borderRadius: 8,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        <Settings size={18} />
      </button>

      {/* 调度卡垂直快捷入口（仿右侧 CollapsedDrawer 风格） */}
      <button
        onClick={handleOpenDispatch}
        title={
          !isAvailable
            ? '调度卡（等待通话）'
            : hasTriage
              ? '打开调度卡'
              : '调度卡未分诊，点击打开'
        }
        disabled={!isAvailable}
        style={{
          width: PILL_W,
          height: PILL_H,
          padding: 0,
          border: '1px solid var(--glass-border)',
          borderRadius: 10,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
          color: 'var(--text-primary)',
          cursor: isAvailable ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          opacity: isAvailable ? 1 : 0.6,
          animation: isAvailable && !hasTriage ? 'pulse-alert 1.8s ease-in-out infinite' : 'none',
        }}
      >
        <div style={styles.verticalStack}>
          {/* 顶部状态点 */}
          <span
            style={{
              ...styles.liveDot,
              backgroundColor: dotColor,
              animation: isAvailable && !hasTriage ? 'pulse-live 1s ease-in-out infinite' : 'none',
            }}
          />
          {/* 竖排"调度卡" */}
          <span style={styles.verticalText}>调度卡</span>
          {/* 状态条 */}
          <div style={styles.statusBar}>
            <div
              style={{
                ...styles.statusBarFill,
                height: `${statusFillRatio * 100}%`,
                backgroundColor: statusColor,
              }}
            />
          </div>
          {/* 提示箭头 */}
          <span style={styles.expandIcon}>
            <ChevronRight size={20} color="var(--text-secondary)" />
          </span>
        </div>
      </button>

      {/* 下拉面板 */}
      <AnimatePresence>
        {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.12 }}
          style={{
            position: 'absolute',
            top: 44,
            left: 0,
            width: 220,
            padding: '8px 0',
            border: '1px solid var(--border)',
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            transformOrigin: 'top left',
          }}
        >
          {/* 调度卡入口（同时放在下拉菜单里，方便文字说明） */}
          <button
            onClick={handleOpenDispatch}
            disabled={!isAvailable}
            style={{
              ...menuItemBase,
              color: !isAvailable
                ? 'var(--text-muted)'
                : hasTriage
                  ? 'var(--accent-green)'
                  : 'var(--danger-red)',
              fontWeight: 'var(--fw-bold)',
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              opacity: isAvailable ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (isAvailable) e.currentTarget.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <AlertTriangle size={16} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span>调度卡</span>
              <span style={{ fontSize: 'var(--fs-micro)', color: !isAvailable ? 'var(--text-muted)' : hasTriage ? 'var(--accent-green)' : 'var(--danger-soft)' }}>
                {!isAvailable ? '等待通话' : hasTriage ? '已分诊' : '未分诊'}
              </span>
            </span>
          </button>
          <div style={{ height: 1, margin: '4px 16px', backgroundColor: 'var(--border)' }} />

          {/* 回到主菜单 */}
          <button
            onClick={() => {
              setOpen(false)
              onNavigate?.('title')
            }}
            style={menuItemBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <Home size={16} /> 回到主菜单
          </button>

          <div style={{ height: 1, margin: '4px 16px', backgroundColor: 'var(--border)' }} />

          {/* 音量调节 */}
          <div style={{ padding: '10px 16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <Volume2 size={16} />
              <span style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-body)' }}>
                音量 {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <div style={{ height: 1, margin: '4px 26px', backgroundColor: 'var(--border)' }} />

          {/* 主题切换 */}
          <button
            onClick={toggle}
            style={menuItemBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? '切换深色主题' : '切换浅色主题'}
          </button>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  verticalStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    height: '100%',
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
    fontSize: 'var(--fs-small)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 2,
    fontWeight: 'var(--fw-bold)',
  },
  statusBar: {
    width: 8,
    height: 140,
    backgroundColor: 'var(--border)',
    borderRadius: 4,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  statusBarFill: {
    width: '100%',
    borderRadius: 4,
    transition: 'height 0.4s ease, background-color 0.3s ease',
  },
  expandIcon: {
    marginTop: 'auto',
    display: 'flex',
  },
}
