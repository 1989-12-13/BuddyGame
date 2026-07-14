// ============================================================
// VehicleSelector — 派车时的车辆选择模态
// 玩家从可用车辆中根据速度/能力/tier 做取舍
// ============================================================

import { Truck, Zap, Shield, X } from 'lucide-react'
import type { FleetState, Ambulance } from '../../game/core/fleet'
import { tierLabel } from '../../game/core/fleet'

interface Props {
  fleet: FleetState
  onSelect: (vehicleId: string) => void
  onCancel: () => void
  /** 病种正确分诊等级，用于提示"建议能力" */
  suggestedCapability?: 'red' | 'yellow' | 'green' | 'black'
}

const TIER_COLOR: Record<Ambulance['tier'], string> = {
  MICU: '#7c3aed', // 装饰性 tier 色，两主题一致，无对应 token
  ALS: 'var(--danger-red)',
  BLS: 'var(--text-secondary)',
}

/** 图标/强调色不随主题变化，保留原语义色 */
const SPEED_COLOR = 'var(--accent-gold)'
const CAPABILITY_COLOR = 'var(--accent-cyan)'

export function VehicleSelector({ fleet, onSelect, onCancel, suggestedCapability }: Props) {
  const available = fleet.vehicles.filter(v => v.status === 'available')
  const suggestedTier: Ambulance['tier'] =
    suggestedCapability === 'red' ? 'MICU' :
    suggestedCapability === 'yellow' ? 'ALS' : 'BLS'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15,23,42,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 8,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: 'min(520px, 92vw)',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 头部 */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)' }}>选择救护车</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              建议：<span style={{ color: TIER_COLOR[suggestedTier], fontWeight: 'bold' }}>{tierLabel(suggestedTier)}</span>
              {' '}以上 · 共 {available.length} 辆可用
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* 车辆列表 */}
        <div style={{ padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {available.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              暂无可用救护车
            </div>
          )}
          {available.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onSelect={() => onSelect(v.id)}
              highlighted={v.tier === suggestedTier || (suggestedTier === 'MICU' && v.tier === 'ALS')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function VehicleCard({ vehicle, onSelect, highlighted }: { vehicle: Ambulance; onSelect: () => void; highlighted: boolean }) {
  const tierColor = TIER_COLOR[vehicle.tier]
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 6,
        border: `2px solid ${highlighted ? tierColor : 'var(--border)'}`,
        backgroundColor: highlighted ? `${tierColor}08` : 'var(--bg-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 36, height: 36,
        borderRadius: '50%',
        backgroundColor: `${tierColor}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Truck size={18} color={tierColor} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-primary)' }}>{vehicle.name}</span>
          <span style={{
            padding: '1px 6px',
            backgroundColor: `${tierColor}15`,
            color: tierColor,
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 'bold',
          }}>
            {tierLabel(vehicle.tier)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Zap size={10} color={SPEED_COLOR} /> 速度 {vehicle.speed}/3
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Shield size={10} color={CAPABILITY_COLOR} /> 能力 {vehicle.capability}/5
          </span>
        </div>
      </div>

      <div style={{
        fontSize: 11,
        color: 'var(--danger-red)',
        fontWeight: 'bold',
        padding: '4px 10px',
        backgroundColor: 'var(--danger-red-dim)',
        borderRadius: 4,
        border: '1px solid var(--danger-red)',
      }}>
        派出 →
      </div>
    </button>
  )
}
