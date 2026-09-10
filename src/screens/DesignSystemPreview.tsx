// ============================================================
// 120 调度台 — 设计令牌 v2 · 色板预览页
// 访问方式：http://localhost:5173/?preview=tokens
// 作用域 .dsg，零侵入现有游戏样式
// ============================================================

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import '../styles/design-system-preview.css'

type Theme = 'dark' | 'light'

interface TokenDef {
  token: string
  label: string
}

const SURFACE: TokenDef[] = [
  { token: '--bg', label: '页面背景' },
  { token: '--bg-surface', label: '面板' },
  { token: '--bg-raised', label: '浮层 / 卡片' },
  { token: '--bg-hover', label: '悬停 / 凹陷' },
  { token: '--bg-input', label: '输入框' },
]

const TEXT: TokenDef[] = [
  { token: '--text', label: '主文字' },
  { token: '--text-2', label: '次要文字' },
  { token: '--text-3', label: '辅助文字' },
  { token: '--text-dim', label: '禁用 / 占位' },
]

const LINE: TokenDef[] = [
  { token: '--line', label: '常规边框' },
  { token: '--line-soft', label: '浅边框' },
  { token: '--line-strong', label: '强调边框' },
]

const ACCENT: TokenDef[] = [
  { token: '--accent', label: '主色' },
  { token: '--accent-strong', label: '主色 · 强（悬停）' },
  { token: '--accent-dim', label: '主色 · 弱' },
  { token: '--accent-bg', label: '主色 · 底色' },
  { token: '--accent-line', label: '主色 · 描边' },
  { token: '--on-accent', label: '主色实底上的文字' },
]

const SEMANTICS: { title: string; tokens: TokenDef[] }[] = [
  {
    title: '成功 Success',
    tokens: [
      { token: '--success', label: '标准' },
      { token: '--success-strong', label: '强' },
      { token: '--success-dim', label: '弱' },
      { token: '--success-bg', label: '底色' },
      { token: '--success-line', label: '描边' },
    ],
  },
  {
    title: '警告 Warning',
    tokens: [
      { token: '--warning', label: '标准' },
      { token: '--warning-strong', label: '强' },
      { token: '--warning-dim', label: '弱' },
      { token: '--warning-bg', label: '底色' },
      { token: '--warning-line', label: '描边' },
    ],
  },
  {
    title: '危险 Danger',
    tokens: [
      { token: '--danger', label: '标准' },
      { token: '--danger-strong', label: '强' },
      { token: '--danger-dim', label: '弱' },
      { token: '--danger-bg', label: '底色' },
      { token: '--danger-line', label: '描边' },
    ],
  },
  {
    title: '信息 Info',
    tokens: [
      { token: '--info', label: '标准' },
      { token: '--info-strong', label: '强' },
      { token: '--info-dim', label: '弱' },
      { token: '--info-bg', label: '底色' },
      { token: '--info-line', label: '描边' },
    ],
  },
]

const SEVERITY: TokenDef[] = [
  { token: '--sev-1', label: '1 · 最佳 / 稳定 / ALPHA' },
  { token: '--sev-2', label: '2 · 良好 / 紧张 / BRAVO' },
  { token: '--sev-3', label: '3 · 一般 / CHARLIE' },
  { token: '--sev-4', label: '4 · 较差 / 恐慌 / DELTA' },
  { token: '--sev-5', label: '5 · 危急 / 失控 / ECHO' },
]

const TYPE_SCALE: { token: string; size: number; weight: number; sample: string }[] = [
  { token: '--fs-hero', size: 40, weight: 700, sample: '调度台' },
  { token: '--fs-heading-lg', size: 27, weight: 600, sample: '页面大标题' },
  { token: '--fs-heading', size: 23, weight: 600, sample: '区块标题' },
  { token: '--fs-subtitle', size: 16, weight: 600, sample: '面板副标题' },
  { token: '--fs-body-lg', size: 15, weight: 500, sample: '正文（大）' },
  { token: '--fs-body', size: 14, weight: 400, sample: '正文' },
  { token: '--fs-body-sm', size: 13, weight: 400, sample: '正文（小）/ 详情' },
  { token: '--fs-caption', size: 12, weight: 500, sample: '说明文字 / 徽章' },
  { token: '--fs-small', size: 11, weight: 500, sample: '标签 / 辅助' },
  { token: '--fs-micro', size: 10, weight: 500, sample: '角标 / 极次要' },
]

const SPACING: { token: string; px: number }[] = [
  { token: '--space-2xs', px: 2 },
  { token: '--space-xs', px: 4 },
  { token: '--space-sm', px: 8 },
  { token: '--space-md', px: 12 },
  { token: '--space-lg', px: 16 },
  { token: '--space-xl', px: 24 },
  { token: '--space-2xl', px: 32 },
  { token: '--space-3xl', px: 48 },
]

const RADII: { token: string; px: number }[] = [
  { token: '--radius-xs', px: 3 },
  { token: '--radius-sm', px: 4 },
  { token: '--radius-md', px: 6 },
  { token: '--radius-lg', px: 8 },
  { token: '--radius-xl', px: 10 },
  { token: '--radius-2xl', px: 14 },
]

const ALL_TOKENS = [
  ...SURFACE,
  ...TEXT,
  ...LINE,
  ...ACCENT,
  ...SEMANTICS.flatMap((s) => s.tokens),
  ...SEVERITY,
].map((t) => t.token)

export function DesignSystemPreview() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [values, setValues] = useState<Record<string, string>>({})
  const rootRef = useRef<HTMLDivElement>(null)

  // 直接驱动全局 data-theme，使本页展示的就是 tokens.css 的真实令牌
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const cs = getComputedStyle(el)
    const next: Record<string, string> = {}
    for (const token of ALL_TOKENS) next[token] = cs.getPropertyValue(token).trim()
    setValues(next)
  }, [theme])

  const val = (token: string) => values[token] || '—'

  const back = () => {
    window.location.search = ''
  }

  return (
    <div className="dsg" ref={rootRef}>
      <div className="dsg-shell">
        <header className="dsg-head">
          <div>
            <div className="dsg-eyebrow">Design Tokens v2 · Preview</div>
            <h1 className="dsg-title">120 调度台 · 设计令牌方案</h1>
            <p className="dsg-desc">
              写实 DOC / 应急指挥中心风格，主色为深青绿调度台色板。本页仅展示令牌与组件规范，用于确认配色方向；
              全部变量限定在 <code>.dsg</code> 作用域内，尚未改动现有游戏样式。专业感 : 可玩性 = 7:3。
            </p>
          </div>
          <div className="dsg-head-actions">
            <button
              className="dsg-btn dsg-btn--secondary"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '切换浅色主题' : '切换深色主题'}
            </button>
            <button className="dsg-btn dsg-btn--ghost" onClick={back}>
              返回游戏
            </button>
          </div>
        </header>

        {/* ---------- 表面 ---------- */}
        <Section title="表面 Surface" note="页面层级由深到浅，共 5 档">
          <div className="dsg-grid">
            {SURFACE.map((t) => (
              <Swatch key={t.token} def={t} value={val(t.token)} />
            ))}
          </div>
        </Section>

        {/* ---------- 文字 & 边框 ---------- */}
        <Section title="文字 Text / 边框 Line" note="4 档文字层级 + 3 档边框">
          <div className="dsg-grid">
            {TEXT.map((t) => (
              <Swatch key={t.token} def={t} value={val(t.token)} />
            ))}
            {LINE.map((t) => (
              <Swatch key={t.token} def={t} value={val(t.token)} />
            ))}
          </div>
        </Section>

        {/* ---------- 主色 ---------- */}
        <Section title="主色 Accent · 深青绿" note="品牌主色，用于主按钮、选中态、强调数据">
          <div className="dsg-grid">
            {ACCENT.map((t) => (
              <Swatch
                key={t.token}
                def={t}
                value={val(t.token)}
                chipStyle={
                  t.token === '--on-accent'
                    ? { background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center' }
                    : undefined
                }
                chipContent={t.token === '--on-accent' ? 'Aa' : undefined}
              />
            ))}
          </div>
        </Section>

        {/* ---------- 语义色 ---------- */}
        {SEMANTICS.map((group) => (
          <Section key={group.title} title={`语义色 · ${group.title}`} note="标准 / 强 / 弱 / 底色 / 描边 五件套">
            <div className="dsg-grid">
              {group.tokens.map((t) => (
                <Swatch key={t.token} def={t} value={val(t.token)} />
              ))}
            </div>
          </Section>
        ))}

        {/* ---------- 分级色阶 ---------- */}
        <Section
          title="分级色阶 Severity"
          note="统一用于玩家评级 / 来电者情绪 / 患者稳定度 / MPDS 判定级"
        >
          <div className="dsg-sev-bar">
            {SEVERITY.map((t) => (
              <div
                key={t.token}
                className="dsg-sev-cell"
                style={{ background: `var(${t.token})`, color: 'var(--on-accent)' }}
              >
                {t.token.replace('--sev-', '')}
              </div>
            ))}
          </div>
          <div className="dsg-row" style={{ marginTop: 'var(--space-md)' }}>
            {SEVERITY.map((t) => (
              <span
                key={t.token}
                className="dsg-pill"
                style={{
                  background: `color-mix(in srgb, var(${t.token}) 14%, transparent)`,
                  borderColor: `color-mix(in srgb, var(${t.token}) 38%, transparent)`,
                  color: `var(${t.token})`,
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </Section>

        {/* ---------- 排版 ---------- */}
        <Section title="排版 Typography" note="统一字体族；数据 / 终端 / 计时固定使用等宽字体">
          <div className="dsg-card">
            {TYPE_SCALE.map((t) => (
              <div className="dsg-type-row" key={t.token}>
                <span
                  style={{
                    fontSize: `var(${t.token})`,
                    fontWeight: t.weight,
                    lineHeight: 1.2,
                    letterSpacing: t.size >= 27 ? '-0.01em' : undefined,
                  }}
                >
                  {t.sample}
                </span>
                <span className="dsg-type-tag">
                  {t.token} · {t.size}px / {t.weight}
                </span>
              </div>
            ))}
          </div>
          <div className="dsg-row" style={{ marginTop: 'var(--space-md)' }}>
            <div className="dsg-card" style={{ flex: '1 1 260px' }}>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-3)', marginBottom: 'var(--space-sm)' }}>
                等宽 · 数据 / 计时 / 地址
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-body)', letterSpacing: '0.02em' }}>
                12:04:37 · ETA 06:12 · ECHO-27A1
              </div>
            </div>
            <div className="dsg-card" style={{ flex: '1 1 260px' }}>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-3)', marginBottom: 'var(--space-sm)' }}>
                正文 · 对话 / 说明
              </div>
              <div style={{ fontSize: 'var(--fs-body)' }}>
                您好，这里是 120 急救中心，请问患者是否有意识？
              </div>
            </div>
          </div>
        </Section>

        {/* ---------- 间距 / 圆角 / 阴影 ---------- */}
        <Section title="间距 · 圆角 · 阴影" note="密度较现状收紧，新增 2px 档与 12px 档">
          <div className="dsg-row" style={{ alignItems: 'flex-start', gap: 'var(--space-xl)' }}>
            <div className="dsg-card" style={{ flex: '1 1 320px' }}>
              <div className="dsg-section-note" style={{ marginBottom: 'var(--space-md)' }}>
                间距 Space
              </div>
              {SPACING.map((s) => (
                <div className="dsg-space-row" key={s.token}>
                  <span className="dsg-space-tag">{s.token}</span>
                  <span className="dsg-space-block" style={{ width: `${s.px * 3}px` }} />
                  <span className="dsg-space-tag" style={{ width: 'auto' }}>
                    {s.px}px
                  </span>
                </div>
              ))}
            </div>

            <div className="dsg-card" style={{ flex: '1 1 320px' }}>
              <div className="dsg-section-note" style={{ marginBottom: 'var(--space-md)' }}>
                圆角 Radius
              </div>
              <div className="dsg-row">
                {RADII.map((r) => (
                  <div
                    key={r.token}
                    style={{
                      width: 82,
                      height: 62,
                      borderRadius: `var(${r.token})`,
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--line-strong)',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--fs-micro)',
                      color: 'var(--text-2)',
                    }}
                  >
                    {r.px}px
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dsg-shadow-grid" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="dsg-shadow-box" style={{ boxShadow: 'var(--shadow-sm)' }}>
              --shadow-sm
            </div>
            <div className="dsg-shadow-box" style={{ boxShadow: 'var(--shadow-md)' }}>
              --shadow-md
            </div>
            <div className="dsg-shadow-box" style={{ boxShadow: 'var(--shadow-lg)' }}>
              --shadow-lg
            </div>
            <div className="dsg-shadow-box" style={{ boxShadow: 'var(--shadow-glow-accent)' }}>
              --shadow-glow-accent
            </div>
            <div className="dsg-shadow-box" style={{ boxShadow: 'var(--shadow-glow-danger)' }}>
              --shadow-glow-danger
            </div>
          </div>
        </Section>

        {/* ---------- 组件 ---------- */}
        <Section title="组件 Components" note="按钮 / 徽章 / 卡片 / 玻璃拟态 / 进度条 / 输入框">
          <div className="dsg-card" style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            <div>
              <div className="dsg-section-note" style={{ marginBottom: 'var(--space-sm)' }}>
                按钮 Button
              </div>
              <div className="dsg-row">
                <button className="dsg-btn dsg-btn--primary">主按钮</button>
                <button className="dsg-btn dsg-btn--secondary">次按钮</button>
                <button className="dsg-btn dsg-btn--danger">危险</button>
                <button className="dsg-btn dsg-btn--ghost">幽灵</button>
                <button className="dsg-btn dsg-btn--primary" disabled>
                  禁用
                </button>
              </div>
            </div>

            <div>
              <div className="dsg-section-note" style={{ marginBottom: 'var(--space-sm)' }}>
                徽章 / 分诊标签 Pill
              </div>
              <div className="dsg-row">
                <span className="dsg-pill" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-line)', color: 'var(--success)' }}>
                  绿色 · 轻症
                </span>
                <span className="dsg-pill" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-line)', color: 'var(--warning)' }}>
                  黄色 · 急症
                </span>
                <span className="dsg-pill" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-line)', color: 'var(--danger)' }}>
                  红色 · 危重
                </span>
                <span className="dsg-pill" style={{ background: 'var(--info-bg)', borderColor: 'var(--info-line)', color: 'var(--info)' }}>
                  蓝色 · 信息
                </span>
                <span className="dsg-pill" style={{ background: 'var(--bg-hover)', borderColor: 'var(--line)', color: 'var(--text-2)' }}>
                  黑色 · 死亡
                </span>
              </div>
            </div>

            <div>
              <div className="dsg-section-note" style={{ marginBottom: 'var(--space-sm)' }}>
                进度条 ProgressBar
              </div>
              <div style={{ display: 'grid', gap: 'var(--space-sm)', maxWidth: 460 }}>
                <div className="dsg-bar">
                  <span style={{ width: '86%', background: 'var(--success)' }} />
                </div>
                <div className="dsg-bar">
                  <span style={{ width: '54%', background: 'var(--warning)' }} />
                </div>
                <div className="dsg-bar">
                  <span style={{ width: '28%', background: 'var(--danger)' }} />
                </div>
              </div>
            </div>

            <div>
              <div className="dsg-section-note" style={{ marginBottom: 'var(--space-sm)' }}>
                输入框 Input
              </div>
              <input className="dsg-input" placeholder="请输入患者地址 / 主诉…" style={{ maxWidth: 460 }} />
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="dsg-card" style={{ background: 'var(--bg-raised)' }}>
                <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-xs)' }}>普通卡片</div>
                <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-2)' }}>
                  实底表面 + 细边框，用于信息分组。
                </div>
              </div>
              <div
                className="dsg-glass"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, var(--accent-bg), transparent 60%), radial-gradient(circle at 80% 20%, var(--info-bg), transparent 55%)',
                }}
              >
                <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-xs)' }}>玻璃拟态 Glass</div>
                <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-2)' }}>
                  半透明 + 背景模糊，浮层 / 弹窗使用。
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ---------- 动效 ---------- */}
        <Section title="动效 Motion" note="统一时长与缓动曲线">
          <div className="dsg-card" style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <AnimTrack label="--dur-fast 120ms · --ease-out" dotClass="" duration="120ms" easing="var(--ease-out)" />
            <AnimTrack label="--dur-base 200ms · --ease-in-out" dotClass="dsg-anim-dot--slow" duration="200ms" easing="var(--ease-in-out)" />
            <AnimTrack label="--dur-slow 320ms · --ease-spring" dotClass="dsg-anim-dot--spring" duration="320ms" easing="var(--ease-spring)" />
            <div className="dsg-section-note" style={{ marginTop: 'var(--space-xs)' }}>
              危险告警（红闪 / 心跳）与成功反馈（绿脉冲）统一走慢时长 + 心跳节奏；沉浸动效（深呼吸 / CPR）保持现状。
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="dsg-section">
      <div className="dsg-section-head">
        <h2 className="dsg-section-title">{title}</h2>
        {note && <span className="dsg-section-note">{note}</span>}
      </div>
      {children}
    </section>
  )
}

function Swatch({
  def,
  value,
  chipStyle,
  chipContent,
}: {
  def: TokenDef
  value: string
  chipStyle?: CSSProperties
  chipContent?: string
}) {
  return (
    <div className="dsg-swatch">
      <div className="dsg-swatch-chip" style={{ background: `var(${def.token})`, ...chipStyle }}>
        {chipContent}
      </div>
      <div className="dsg-swatch-meta">
        <div className="dsg-swatch-name">{def.token}</div>
        <div className="dsg-swatch-value">{value}</div>
        <div className="dsg-swatch-label">{def.label}</div>
      </div>
    </div>
  )
}

function AnimTrack({
  label,
  dotClass,
  duration,
  easing,
}: {
  label: string
  dotClass: string
  duration: string
  easing: string
}) {
  const [run, setRun] = useState(false)
  return (
    <div>
      <div className="dsg-section-note" style={{ marginBottom: 'var(--space-xs)' }}>
        {label}
      </div>
      <div className="dsg-anim-track" onClick={() => setRun((r) => !r)} style={{ cursor: 'pointer' }}>
        <span
          className={`dsg-anim-dot ${dotClass}`}
          style={{
            left: run ? 'calc(100% - 26px)' : '4px',
            transition: `left ${duration} ${easing}`,
          }}
        />
      </div>
    </div>
  )
}

export default DesignSystemPreview
