// ============================================================
// 主题切换按钮 — 浅色/深色一键切换
// ============================================================

import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? '切换深色主题' : '切换浅色主题'}
      style={{
        position: 'fixed',
        top: 26,
        right: 16,
        zIndex: 1000,
        padding: '6px 10px',
        fontSize: 16,
        lineHeight: 1,
        border: '1px solid var(--border)',
        borderRadius: 6,
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
