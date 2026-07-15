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
  // 派车启用条件：意识 + 呼吸 + 判定码 全部设置
  const canDispatch =
    terminal.conscious !== null &&
    terminal.breathing !== null &&
    !!terminal.determinant

  // 各必填项状态（用于显示提示）
  const missing: string[] = []
  if (terminal.conscious === null) missing.push('意识状态')
  if (terminal.breathing === null) missing.push('呼吸状态')
  if (!terminal.determinant) missing.push('MPDS 判定码')

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
                  ...(!canDispatch ? styles.modalDispatchBtnDisabled : {}),
                }}
                onClick={onDispatch}
                disabled={!canDispatch}
                title={
                  canDispatch
                    ? '进入节点式路线规划'
                    : `请先设置 ${missing.join(' / ')}`
                }
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
