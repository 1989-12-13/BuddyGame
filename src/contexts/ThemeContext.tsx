// ============================================================
// 主题上下文 — 浅色 / 深色切换 + 语义色板
// 使用方式：const { theme, colors, toggle } = useTheme()
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import {
  C_SUCCESS,
  C_DANGER,
  C_DARK_DANGER,
  C_WARNING,
  C_AMBER,
  C_INFO,
  C_DEEP_BLUE,
} from '../game/core/colors'

type Theme = 'light' | 'dark'

/** 主题色板 — 所有组件应通过此对象获取颜色，而非硬编码 */
export interface ThemeColors {
  // 功能色
  success: string
  danger: string
  darkDanger: string
  warning: string
  amber: string
  info: string
  deepBlue: string

  // 表面色（主题相关）
  bg: string
  bgElevated: string
  bgSurface: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  borderLight: string
}

const lightColors: ThemeColors = {
  success: C_SUCCESS,
  danger: C_DANGER,
  darkDanger: C_DARK_DANGER,
  warning: C_WARNING,
  amber: C_AMBER,
  info: C_INFO,
  deepBlue: C_DEEP_BLUE,
  bg: '#eff6f9',
  bgElevated: '#f8fafc',
  bgSurface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
}

const darkColors: ThemeColors = {
  ...lightColors,
  bg: '#0a0e14',
  bgElevated: '#1a1f29',
  bgSurface: '#11151c',
  text: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  border: '#2a323e',
  borderLight: '#1e252e',
}

interface ThemeCtx {
  theme: Theme
  colors: ThemeColors
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  colors: lightColors,
  toggle: () => {},
  setTheme: () => {},
})

const STORAGE_KEY = 'buddy-game-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light'
  })

  const colors = useMemo(() => theme === 'dark' ? darkColors : lightColors, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, colors, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
