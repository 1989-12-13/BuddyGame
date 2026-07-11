// ============================================================
// 零点接线台 — 标题画面
// ============================================================

import { useState, useEffect } from 'react'

interface Props {
  onStart: (debugScenarioId?: string) => void
  onLevelSelect?: () => void
}

export function TitleScreen({ onStart, onLevelSelect }: Props) {
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 800)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={styles.container}>
      {/* 微弱的光 */}
      <div style={styles.glow} />

      <div style={styles.content}>
        {/* 图标 */}
        <div style={styles.icon}>📞</div>

        {/* 标题 */}
        <h1 style={styles.title}>零点接线台</h1>
        <p style={styles.subtitle}>Zero-Hour Dispatch</p>

        <div style={styles.divider} />

        {/* 描述 */}
        <div style={styles.desc}>
          <p>你是一名<b>120急救调度中心</b>的接线员。</p>
          <p>深夜的来电铃声响起——</p>
          <p>
            每一次接听都意味着一场与时间的赛跑。
          </p>
          <p>
            <b>1分钟内</b>必须完成派车。
          </p>
          <p>
            在慌乱的通话中快速抓取<b>地址、电话、病情、诉求</b>四个关键信息。
          </p>
          <p>
            用<b>MPDS标准化问询</b>判断事件的紧急等级。
          </p>
          <p>
            在救护车赶来的<b>黄金4分钟</b>内，指导现场急救。
          </p>
        </div>

        <div style={styles.divider} />

        {/* 提示 */}
        <div style={styles.tips}>
          <p>📋 左侧电话接听 — 问询、聆听、判断</p>
          <p>💻 右侧调度终端 — 登记、分诊、派车</p>
          <p>⏱ 计时器每时每刻都在走 — 你有多快，生命就离你多近</p>
        </div>

        {/* 按钮区 */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <button
            style={{
              ...styles.startBtn,
              marginTop: 0,
              opacity: blink ? 1 : 0.6,
            }}
            onClick={() => onStart()}
          >
            开始值班
          </button>
          {onLevelSelect && (
            <button
              onClick={onLevelSelect}
              style={styles.levelSelectBtn}
            >
              📋 选关
            </button>
          )}
        </div>

        <p style={styles.version}>v1.0 — 急救调度模拟</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a1a',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 400,
    height: 400,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(231, 76, 60, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
    maxWidth: 520,
    padding: '20px',
    maxHeight: '100vh',
    overflowY: 'auto',
  },
  icon: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ecf0f1',
    margin: 0,
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(231, 76, 60, 0.3)',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    margin: 0,
    letterSpacing: 6,
    textTransform: 'uppercase' as const,
  },
  divider: {
    width: 200,
    height: 1,
    backgroundColor: '#2c3e50',
    margin: '8px 0',
  },
  desc: {
    textAlign: 'center' as const,
    color: '#bdc3c7',
    fontSize: 14,
    lineHeight: 1.8,
  },
  tips: {
    textAlign: 'center' as const,
    color: '#7f8c8d',
    fontSize: 12,
    lineHeight: 2,
  },
  startBtn: {
    marginTop: 12,
    padding: '14px 56px',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 2,
    boxShadow: '0 4px 20px rgba(231, 76, 60, 0.3)',
    transition: 'all 0.5s',
  },
  levelSelectBtn: {
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e2e8f0',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid #334155',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  version: {
    fontSize: 11,
    color: '#444',
    marginTop: 16,
  },
}
