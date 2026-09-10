import { readStorage, writeStorage } from '../utils/storage'
// ============================================================
// 主题上下文 — 浅色 / 深色切换 + 语义色板
// 使用方式：const { theme, colors, toggle } = useTheme()
//
// 注意：colors 提供的是**真实色值**（hex），专供 Leaflet pathOptions、
// Canvas 等无法使用 CSS 变量的场景。其取值与 src/styles/tokens.css
// 的设计令牌一一对应，改动令牌时需同步此处维护。
// 常规 DOM 样式请直接使用 CSS 变量（var(--accent) 等），不要用本对象。
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

/** 主题色板 — 供需要真实色值的渲染层（地图 / Canvas）获取颜色 */
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

/** 浅色主题色值（镜像 tokens.css [data-theme='light']） */
const lightColors: ThemeColors = {
  success: '#1a8a52',
  danger: '#b0413a',
  darkDanger: '#8f302a',
  warning: '#9a6a1e',
  amber: '#9a6a1e',
  info: '#2a6f8f',
  deepBlue: '#1f556f',
  bg: '#e8eeeb',
  bgElevated: '#eef3ef',
  bgSurface: '#fbfbf6',
  text: '#1e332e',
  textSecondary: '#4d655f',
  textMuted: '#6d847e',
  border: '#c9d6d0',
  borderLight: '#dde6e1',
}

/** 深色主题色值（镜像 tokens.css [data-theme='dark']） */
const darkColors: ThemeColors = {
  success: '#5fd39a',
  danger: '#ef8a80',
  darkDanger: '#f7b3ab',
  warning: '#e7bd82',
  amber: '#e7bd82',
  info: '#7cc4e0',
  deepBlue: '#a8dbf0',
  bg: '#0e1a20',
  bgElevated: '#1e2f38',
  bgSurface: '#16242c',
  text: '#eef2ef',
  textSecondary: '#a9bcb8',
  textMuted: '#7d938f',
  border: '#2b3f47',
  borderLight: '#22333b',
}

interface ThemeCtx {
  theme: Theme
  colors: ThemeColors
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  colors: darkColors,
  toggle: () => {},
  setTheme: () => {},
})

const STORAGE_KEY = 'buddy-game-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return readStorage(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  })

  const colors = useMemo(() => (theme === 'dark' ? darkColors : lightColors), [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    writeStorage(STORAGE_KEY, theme)
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
