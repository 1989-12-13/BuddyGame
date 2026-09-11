// ============================================================
// RescueProgressToast — 救护车救援闭环可视化（派车后顶部固定 toast）
// 显示：车辆信息 + 出发→现场 进度条 + ETA + 救治结果
// ============================================================

import { Truck, CheckCircle2, XCircle, MapPin, Building2 } from 'lucide-react'
import type { RescueState } from '../../game/types'

interface Props {
  rescue: RescueState
  ambulanceRemaining: number
}

export function RescueProgressToast({ rescue, ambulanceRemaining }: Props) {
  if (rescue.phase === 'idle') return null

  const arrived = rescue.phase === 'arrived' || rescue.phase === 'success' || rescue.phase === 'failed'
  const progress = arrived ? 100 : Math.max(0, Math.min(100, (1 - ambulanceRemaining / Math.max(1, rescue.etaTotal)) * 100))
  const success = rescue.phase === 'success'
  const failed = rescue.phase === 'failed'

  // 语义强调色随状态变化，统一走设计令牌（双主题自适应）
  const accentColor = success ? 'var(--success)' : failed ? 'var(--danger)' : 'var(--accent)'

  return (
    <div style={{
      marginTop: 6,
      padding: '8px 12px',
      backgroundColor: 'var(--bg-surface)',
      border: `1px solid ${accentColor}`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: 6,
      boxShadow: 'var(--shadow-sm)',
      fontSize: 'var(--fs-caption)',
    }}>
      {/* 顶部行：标题 + 状态徽章 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Truck size={14} style={{ color: accentColor }} />
        <strong style={{ color: 'var(--text)' }}>
          {rescue.vehicleName ?? '救护车'}
        </strong>
        <span style={{ marginLeft: 'auto', color: accentColor, fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-small)' }}>
          {success && '✓ 救治成功'}
          {failed && '✗ 救治失败'}
          {rescue.phase === 'enroute' && `ETA ${ambulanceRemaining}s`}
          {rescue.phase === 'arrived' && '已到达现场'}
        </span>
      </div>

      {/* 路径进度条 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
        <Building2 size={12} color="var(--text-2)" />
        <div style={{
          flex: 1,
          height: 6,
          backgroundColor: 'var(--bg-hover)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${progress}%`,
            backgroundColor: accentColor,
            transition: 'width 0.3s linear',
          }} />
          {/* 车辆图标位置 */}
          <div style={{
            position: 'absolute',
            left: `calc(${progress}% - 7px)`,
            top: -4,
            transition: 'left 0.3s linear',
            fontSize: 'var(--fs-micro)',
          }}>
            🚐
          </div>
        </div>
        <MapPin size={12} color="var(--danger)" />
      </div>

      {/* 底部：成功率 / 失败原因 */}
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-small)' }}>
        {success && <><CheckCircle2 size={11} style={{ color: accentColor }} /><span style={{ color: 'var(--success)' }}>患者获救</span></>}
        {failed && <><XCircle size={11} style={{ color: accentColor }} /><span style={{ color: 'var(--danger)' }}>{rescue.failureReason ?? '现场救治未成功'}</span></>}
        {rescue.phase === 'enroute' && <span style={{ color: 'var(--text-2)' }}>正在赶往现场 · 患者仍在等待</span>}
        {rescue.phase === 'arrived' && <span style={{ color: 'var(--text-2)' }}>院前急救进行中…</span>}
        {rescue.successScore !== null && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            概率 {Math.round((rescue.successScore ?? 0) * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}
