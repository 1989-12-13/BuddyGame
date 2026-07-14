import type { TerminalState } from '../../../game/types'
import { PROTOCOL_REF, TRIAGE_LABELS, TRIAGE_COLORS } from '../../../game/types'
import { styles } from '../styles'

/** 收尾面板 */
export function ClosingPanel({
  guidance,
  ambulanceRemaining,
  terminal,
  onEndCall,
}: {
  guidance: boolean
  ambulanceRemaining: number
  terminal: TerminalState
  onEndCall: () => void
}) {
  const arrived = ambulanceRemaining <= 0
  const protocolEntry = PROTOCOL_REF.find(([n]) => n === terminal.protocolNumber)
  const triageLabel = terminal.triage ? TRIAGE_LABELS[terminal.triage] : '—'

  const triageColor = terminal.triage ? TRIAGE_COLORS[terminal.triage] : 'var(--text-muted)'

  return (
    <div style={styles.closingPanel}>
      {/* 状态卡片 */}
      <div style={styles.closingStatusCard}>
        <div style={{ fontSize: 'var(--fs-score)', marginBottom: 8, filter: arrived ? 'none' : 'brightness(1.2)', animation: arrived ? 'none' : 'pulse 1.5s ease-in-out infinite' }}>
          🚑
        </div>
        <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 4 }}>
          {arrived ? '救护车已到达现场' : '等待救护车到达'}
        </div>
        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 12 }}>
          {arrived ? '急救人员正在接手处理' : guidance ? '急救指导已完成' : '派车指令已发出'}
        </div>
        {!arrived && (
          <>
            <div style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              backgroundColor: 'var(--border)',
              overflow: 'hidden',
              marginBottom: 6,
            }}>
              <div style={{
                height: '100%',
                borderRadius: 3,
                width: `${Math.max(5, (45 - ambulanceRemaining) / 45 * 100)}%`,
                background: ambulanceRemaining > 10
                  ? 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))'
                  : 'linear-gradient(90deg, var(--warning-amber), var(--danger-red))',
                transition: 'width 1s linear',
              }} />
            </div>
            <div style={{ fontSize: 'var(--fs-heading)', fontWeight: 'var(--fw-bold)', color: ambulanceRemaining > 10 ? 'var(--accent-blue)' : 'var(--danger-red)' }}>
              {ambulanceRemaining}s
            </div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>预计到达时间</div>
          </>
        )}
        {arrived && (
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--success-green)' }}>
            ✓ 任务完成
          </div>
        )}
      </div>

      {/* 通话摘要 */}
      <div style={styles.closingSummaryGrid}>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>📍 地址</div>
          <div style={styles.closingSummaryValue}>
            {terminal.address ? '已确认' : '待确认'}
          </div>
        </div>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>📋 协议</div>
          <div style={styles.closingSummaryValue}>
            {protocolEntry ? `${protocolEntry[0]}·${protocolEntry[1]}` : '—'}
          </div>
        </div>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>🏥 分诊</div>
          <div style={{ ...styles.closingSummaryValue, color: triageColor }}>
            {terminal.triage ? triageLabel : '未分诊'}
          </div>
        </div>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>🚨 响应</div>
          <div style={styles.closingSummaryValue}>
            {terminal.determinant
              ? `${terminal.determinant}${terminal.determinantSubcode ? `-${terminal.determinantSubcode}` : ''}`
              : '—'}
          </div>
        </div>
      </div>

      {/* 挂断按钮 */}
      <button
        style={styles.endCallBtn}
        onClick={onEndCall}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--danger-red)'; e.currentTarget.style.transform = 'scale(1.02)' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--danger-red)'; e.currentTarget.style.transform = 'scale(1)' }}
      >
        <span>📞</span>
        <span>结束通话</span>
      </button>
    </div>
  )
}
