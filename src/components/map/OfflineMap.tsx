import { MapPin, WifiOff } from 'lucide-react'
import type { WorldState } from '../../game/types'

// 离线地图为固定深色底图（不随主题切换），色值统一取自设计令牌的深色档：
//   底 #0a141a(--bg-deep) · 区块 #1e3340(--map-grid) · 路网 #2b4450(--map-road)
//   主色 #8bd4bc(--accent) · 暖点 #e7bd82(--warning) · 文字 #a9bcb8(--text-2)
export function OfflineMap({ state, onRetry }: { state: WorldState; onRetry: () => void }) {
  const known = state.callerState?.revealedInfo.address !== 'none'
  return <div className="offline-map"><svg viewBox="0 0 600 360" role="img" aria-label="城市救援离线示意图，非真实导航">
    <defs><pattern id="offline-blocks" width="100" height="80" patternUnits="userSpaceOnUse"><rect width="74" height="54" x="13" y="13" rx="7" fill="#1e3340"/><path d="M0 0H100V80" fill="none" stroke="#2b4450" strokeWidth="3"/></pattern></defs>
    <rect width="600" height="360" fill="#0a141a"/><rect width="600" height="360" fill="url(#offline-blocks)"/>
    <path d="M430 0C340 110 510 250 470 360" stroke="#2b4450" strokeWidth="48" fill="none"/>
    {known && <path d="M115 260H300V100H390" fill="none" stroke="#8bd4bc" strokeWidth="4" strokeDasharray="8 6"/>}
    <circle cx="115" cy="260" r="20" fill="#8bd4bc"/><path d="M104 260H126M115 249V271" stroke="#0d2c24" strokeWidth="4"/>
    <text x="76" y="300" fill="#a9bcb8" fontSize="14">急救站</text>
    {known && <><circle cx="390" cy="100" r="16" fill="#e7bd82"/><circle cx="390" cy="100" r="5" fill="#72562d"/><text x="360" y="72" fill="#eef2ef" fontSize="14">事发区域</text></>}
  </svg><div className="offline-map-note"><span><WifiOff size={15} /> 离线示意图 · 不影响路线规划</span><button className="text-button" onClick={onRetry}>重试在线地图</button></div><div className="offline-map-address"><MapPin size={16} />{state.terminal.address || '等待确认事发地址'}</div></div>
}
