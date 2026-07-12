// ============================================================
// RescueProgressToast — 救护车救援闭环可视化（派车后顶部固定 toast）
// 显示：车辆信息 + 出发→现场 进度条 + ETA + 救治结果
// ============================================================

import { Truck, CheckCircle2, XCircle, MapPin, Building2 } from 'lucide-react'
import type { RescueState } from '../../game/types'
import { tierLabel } from '../../game/core/fleet'

interface Props {
  rescue: RescueState
  ambulanceRemaining: number
  /** 派车时记录的车辆 tier 字符串（用于显示 ALS/BLS/MICU） */
  vehicleTier?: 'BLS' | 'ALS' | 'MICU'
}

export function RescueProgressToast({ rescue, ambulanceRemaining, vehicleTier }: Props) {
  if (rescue.phase === 'idle') return null

  const arrived = rescue.phase === 'arrived' || rescue.phase === 'success' || rescue.phase === 'failed'
  const progress = arrived ? 100 : Math.max(0, Math.min(100, (1 - ambulanceRemaining / Math.max(1, rescue.etaTotal)) * 100))
  const success = rescue.phase === 'success'
  const failed = rescue.phase === 'failed'

  const accentColor = success ? '#16a34a' : failed ? '#dc2626' : '#2563eb'

  return (
    <div style={{
      marginTop: 6,
      padding: '8px 12px',
      backgroundColor: '#ffffff',
      border: `1px solid ${accentColor}40`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      fontSize: 12,
    }}>
      {/* 顶部行：标题 + 状态徽章 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Truck size={14} color={accentColor} />
        <strong style={{ color: '#1e293b' }}>
          {rescue.vehicleName ?? '救护车'}
        </strong>
        {vehicleTier && (
          <span style={{
            padding: '1px 6px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 'bold',
            border: '1px solid #bfdbfe',
          }}>
            {tierLabel(vehicleTier)}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: accentColor, fontWeight: 'bold', fontSize: 11 }}>
          {success && '✓ 救治成功'}
          {failed && '✗ 救治失败'}
          {rescue.phase === 'enroute' && `ETA ${ambulanceRemaining}s`}
          {rescue.phase === 'arrived' && '已到达现场'}
        </span>
      </div>

      {/* 路径进度条 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
        <Building2 size={12} color="#64748b" />
        <div style={{
          flex: 1,
          height: 6,
          backgroundColor: '#f1f5f9',
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
            fontSize: 10,
          }}>
            🚐
          </div>
        </div>
        <MapPin size={12} color="#dc2626" />
      </div>

      {/* 底部：成功率 / 失败原因 */}
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        {success && <><CheckCircle2 size={11} color="#16a34a" /><span style={{ color: '#16a34a' }}>患者获救</span></>}
        {failed && <><XCircle size={11} color="#dc2626" /><span style={{ color: '#dc2626' }}>{rescue.failureReason ?? '现场救治未成功'}</span></>}
        {rescue.phase === 'enroute' && <span style={{ color: '#64748b' }}>正在赶往现场 · 患者仍在等待</span>}
        {rescue.phase === 'arrived' && <span style={{ color: '#64748b' }}>院前急救进行中…</span>}
        {rescue.successScore !== null && (
          <span style={{ marginLeft: 'auto', color: '#94a3b8', fontFamily: 'monospace' }}>
            概率 {Math.round((rescue.successScore ?? 0) * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}
