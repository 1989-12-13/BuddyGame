// ============================================================
// RescueProgressToast — 救护车救援闭环可视化（派车后顶部固定 toast）
// 显示：车辆信息 + 出发→现场 进度条 + ETA + 救治结果
// ============================================================

import { Truck, CheckCircle2, XCircle, MapPin, Building2 } from 'lucide-react'
import type { RescueState } from '../../game/types'
import { tierLabel } from '../../game/core/fleet'
import { C_SUCCESS, C_DARK_DANGER, C_DEEP_BLUE } from '../../game/core/colors'

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

  // 语义强调色随状态变化：边框/进度用 CSS 变量（双主题），图标用 colors.ts 语义常量（SVG stroke 兼容性）
  const accentColor = success ? 'var(--accent-green)' : failed ? 'var(--danger-red)' : 'var(--accent-cyan)'
  const accentSolid = success ? C_SUCCESS : failed ? C_DARK_DANGER : C_DEEP_BLUE

  return (
    <div style={{
      marginTop: 6,
      padding: '8px 12px',
      backgroundColor: 'var(--bg-surface)',
      border: `1px solid ${accentColor}`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      fontSize: 'var(--fs-caption)',
    }}>
      {/* 顶部行：标题 + 状态徽章 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Truck size={14} color={accentSolid} />
        <strong style={{ color: 'var(--text-primary)' }}>
          {rescue.vehicleName ?? '救护车'}
        </strong>
        {vehicleTier && (
          <span style={{
            padding: '1px 6px',
            backgroundColor: 'var(--accent-blue)',
            color: '#ffffff',
            borderRadius: 3,
            fontSize: 'var(--fs-micro)',
            fontWeight: 'var(--fw-bold)',
            border: '1px solid var(--accent-blue)',
          }}>
            {tierLabel(vehicleTier)}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: accentColor, fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-small)' }}>
          {success && '✓ 救治成功'}
          {failed && '✗ 救治失败'}
          {rescue.phase === 'enroute' && `ETA ${ambulanceRemaining}s`}
          {rescue.phase === 'arrived' && '已到达现场'}
        </span>
      </div>

      {/* 路径进度条 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
        <Building2 size={12} color="var(--text-secondary)" />
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
        <MapPin size={12} color="var(--danger-red)" />
      </div>

      {/* 底部：成功率 / 失败原因 */}
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-small)' }}>
        {success && <><CheckCircle2 size={11} color={accentSolid} /><span style={{ color: 'var(--accent-green)' }}>患者获救</span></>}
        {failed && <><XCircle size={11} color={accentSolid} /><span style={{ color: 'var(--danger-red)' }}>{rescue.failureReason ?? '现场救治未成功'}</span></>}
        {rescue.phase === 'enroute' && <span style={{ color: 'var(--text-secondary)' }}>正在赶往现场 · 患者仍在等待</span>}
        {rescue.phase === 'arrived' && <span style={{ color: 'var(--text-secondary)' }}>院前急救进行中…</span>}
        {rescue.successScore !== null && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            概率 {Math.round((rescue.successScore ?? 0) * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}
