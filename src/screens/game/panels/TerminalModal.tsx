import { motion } from 'motion/react'
import type { TerminalState, MpdsDeterminant } from '../../../game/types'
import type { TerminalField } from '../../../game/core/actions'
import { styles } from '../styles'
import { TerminalForm } from './TerminalForm'

/** MPDS 调度卡 leftsider（替代 popup，自动展开动画） */
export function TerminalModal({
  terminal,
  dispatchSent,
  ambulanceRemaining,
  onChange,
  onSetStatus,
  onSetDeterminant,
  onSetDeterminantSubcode,
  onSetProtocol,
  onDispatch,
  onClose,
  onEndCall,
}: {
  terminal: TerminalState
  dispatchSent: boolean
  ambulanceRemaining: number
  onChange: (field: TerminalField, value: string) => void
  onSetStatus: (field: 'conscious' | 'breathing', value: boolean) => void
  onSetDeterminant: (d: MpdsDeterminant) => void
  onSetDeterminantSubcode: (subcode: number) => void
  onSetProtocol: (protocol: number) => void
  onDispatch: () => void
  onClose: () => void
  onEndCall: () => void
}) {
  return (
    <motion.aside
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 240, damping: 30 }}
      style={styles.modalOverlay}
    >
      <div style={styles.modalCard}>
        {/* sider 头部 */}
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderLeft}>
            <span style={styles.mpdsModalBadge}>
              协议 {terminal.protocolNumber ?? '?'}
            </span>
            <div>
              <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                MPDS 调度终端
              </div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                判定码：{terminal.determinant
                  ? `${terminal.protocolNumber ?? '?'}-${terminal.determinant[0]}-${terminal.determinantSubcode ?? '?'}`
                  : '未选择'}
              </div>
            </div>
          </div>
          <div style={styles.modalHeaderRight}>
            <button style={styles.modalCloseBtn} onClick={onClose} title="关闭调度卡">
              ✕
            </button>
          </div>
        </div>

        {/* sider 内容 */}
        <div style={styles.modalBody}>
          {/* 终端登记表单 */}
          <div style={{ marginTop: 8 }}>
            <TerminalForm
              terminal={terminal}
              onChange={onChange}
              onSetStatus={onSetStatus}
              onSetDeterminant={onSetDeterminant}
              onSetDeterminantSubcode={onSetDeterminantSubcode}
              onSetProtocol={onSetProtocol}
            />
          </div>
        </div>

        {!dispatchSent && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 16px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--accent-blue-dim)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            lineHeight: 1.5,
          }}>
            <strong style={{ color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>下一步 · 路线规划</strong>
            <span>系统自动匹配救护车后，你需要沿相邻节点选择完整路线。</span>
          </div>
        )}

        {/* sider 底部 — 操作按钮 */}
        <div style={styles.modalFooter}>
          {!dispatchSent ? (
            <>
              <button style={styles.modalEndCallBtn} onClick={onEndCall}>
                ✕ 挂断
              </button>
              <div style={{ flex: 1 }} />
              <button style={styles.modalSaveBtn} onClick={onClose}>
                ≡ 暂存
              </button>
              <button
                style={{
                  ...styles.modalDispatchBtn,
                  ...(!terminal.determinant ? styles.modalDispatchBtnDisabled : {}),
                }}
                onClick={onDispatch}
                disabled={!terminal.determinant}
                title={terminal.determinant ? '进入节点式路线规划' : '请先在调度卡中选择 MPDS 判定码'}
              >
                ▸ 进入路线规划
              </button>
            </>
          ) : (
            <div style={styles.dispatchSent}>
              <span style={{ fontSize: 'var(--fs-subtitle)' }}>▸</span>
              <div>
                <div style={{ fontWeight: 'var(--fw-bold)', color: 'var(--success-green-dim)' }}>救护车已派出</div>
                {ambulanceRemaining > 0 ? (
                  <div style={{ color: 'var(--danger-red)', fontSize: 'var(--fs-caption)' }}>
                    预计 {ambulanceRemaining} 秒后到达现场
                  </div>
                ) : (
                  <div style={{ color: 'var(--accent-green)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)' }}>
                    救护车已到达现场！
                  </div>
                )}
              </div>
              <button style={styles.modalCloseBtn} onClick={onClose}>✕ 关闭</button>
            </div>
          )}
        </div>


      </div>
    </motion.aside>
  )
}
