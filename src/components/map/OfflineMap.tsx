import { MapPin, WifiOff } from 'lucide-react'
import type { WorldState } from '../../game/types'
export function OfflineMap({ state, onRetry }: { state: WorldState; onRetry: () => void }) {
  const known = state.callerState?.revealedInfo.address !== 'none'
  return <div className="offline-map"><svg viewBox="0 0 600 360" role="img" aria-label="城市救援离线示意图，非真实导航">
    <defs><pattern id="offline-blocks" width="100" height="80" patternUnits="userSpaceOnUse"><rect width="74" height="54" x="13" y="13" rx="7" fill="#264047"/><path d="M0 0H100V80" fill="none" stroke="#58706e" strokeWidth="3"/></pattern></defs>
    <rect width="600" height="360" fill="#172d36"/><rect width="600" height="360" fill="url(#offline-blocks)"/>
    <path d="M430 0C340 110 510 250 470 360" stroke="#224c59" strokeWidth="48" fill="none"/>
    {known && <path d="M115 260H300V100H390" fill="none" stroke="#8bd4bc" strokeWidth="4" strokeDasharray="8 6"/>}
    <circle cx="115" cy="260" r="20" fill="#8bd4bc"/><path d="M104 260H126M115 249V271" stroke="#153b30" strokeWidth="4"/>
    <text x="76" y="300" fill="#c9ded4" fontSize="14">急救站</text>
    {known && <><circle cx="390" cy="100" r="16" fill="#e7bd82"/><circle cx="390" cy="100" r="5" fill="#72562d"/><text x="360" y="72" fill="#f0eee7" fontSize="14">事发区域</text></>}
  </svg><div className="offline-map-note"><span><WifiOff size={15} /> 离线示意图 · 不影响路线规划</span><button className="text-button" onClick={onRetry}>重试在线地图</button></div><div className="offline-map-address"><MapPin size={16} />{state.terminal.address || '等待确认事发地址'}</div></div>
}
