import { AlertTriangle, Navigation } from 'lucide-react'
import type { Dispatch } from 'react'
import type { GameAction } from '../../game/core/actions'
import type { WorldState } from '../../game/types'

export function ReroutePanel({ state, dispatch }: { state: WorldState; dispatch: Dispatch<GameAction> }) {
  const prompt = state.pendingReroute
  if (!prompt) return null
  return <section className="reroute-panel" aria-label="途中路况选择">
    <header><AlertTriangle size={22} /><div><span className="eyebrow">途中路况更新</span><h2>是否调整救援路线？</h2></div></header>
    <p>{prompt.message}。车辆会继续沿当前路线行驶，你可以进行一次改道。</p>
    <div className="reroute-options">{prompt.options.map(route => {
      const current = route.id === prompt.currentRouteId
      return <button key={route.id} className={current ? 'secondary' : 'primary'} onClick={() => dispatch({ type: 'REROUTE_AMBULANCE', callInstanceId: state.callInstanceId, routeId: route.id })}>
        <Navigation size={18} /><span><strong>{current ? '保持当前路线' : '改走备选路线'}</strong><small>全程参考 {route.totalEta} 秒 · {route.risk === 'high' ? '高变化' : route.risk === 'medium' ? '需关注' : '较稳定'}</small></span>
      </button>
    })}</div>
  </section>
}
