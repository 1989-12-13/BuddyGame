// 小游戏 HUD 读数组件（标签 + 数值），供各引擎复用
export function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 50 }}>
      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, textShadow: `0 0 8px ${color}55` }}>{value}</div>
    </div>
  )
}
