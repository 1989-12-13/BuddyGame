// ============================================================
// 设置面板 — 左上角齿轮按钮
// 内含回到主菜单/音量/主题
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Settings, Home, Volume2, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAudio } from '../audio/AudioContext'
import { Z_SETTINGS } from '../game/core/zIndex'

interface Props {
  /** 回到主菜单回调 */
  onNavigate?: (target: 'title') => void
}

export function SettingsPanel({ onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { theme, toggle } = useTheme()
  const { volume, setVolume } = useAudio()

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
