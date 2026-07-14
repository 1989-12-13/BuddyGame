import { Phone } from 'lucide-react'
import { styles } from '../styles'

/** 等待接听界面 */
export function CallWaiting({
  callIndex,
  totalCalls,
  onAnswer,
  shiftElapsed,
  totalScore,
  lastScore,
}: {
  callIndex: number
  totalCalls: number
  onAnswer: () => void
  shiftElapsed: number
  totalScore: number
  lastScore?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        lineHeight: 1,
        marginBottom: 8,
        animation: 'call-incoming 1.2s ease-in-out infinite',
      }}>
        <Phone size={64} color="var(--danger-red)" strokeWidth={1.8} />
      </div>
      <h2 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: 18 }}>
        第 {callIndex + 1}/{totalCalls} 通来电
      </h2>
      <p style={{ color: 'var(--danger-red)', fontWeight: 'bold', margin: '0 0 8px', fontSize: 13 }}>
        线路接通中...
      </p>
      {lastScore !== undefined && (
        <p style={{ color: 'var(--accent-green)', fontWeight: 'bold', margin: '0 0 12px' }}>
          上一通得分：{lastScore}/100
        </p>
      )}
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 12 }}>
        班次运行 {Math.floor(shiftElapsed / 60)}分{shiftElapsed % 60}秒 | 累计 {totalScore}分
      </p>
      <button style={styles.answerBtn} onClick={onAnswer}>
        接 听 电 话
      </button>
    </div>
  )
}
