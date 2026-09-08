import type { RoutePlan } from './routing'

/** Playable care windows, independent of speech length; all seconds use the world clock. */
export const CARE_WINDOWS: Record<string, number> = {
  falls_elderly: 135, chest_pain: 150, hemorrhage: 180, stroke: 180, cardiac_arrest: 210,
}
export function paceRoutes(routes: RoutePlan[], scenarioId: string): RoutePlan[] {
  const window = CARE_WINDOWS[scenarioId]
  if (!window || !routes.length) return routes
  const shortest = Math.min(...routes.map(route => route.totalEta))
  return routes.map(route => {
    const eta = window + route.totalEta - shortest
    return { ...route, totalEta: eta, scheduledUpdate: { ...route.scheduledUpdate, atSecond: Math.max(1, Math.round(route.scheduledUpdate.atSecond * eta / route.totalEta)) } }
  })
}
export function formatPlayTime(seconds: number): string {
  return `${Math.floor(seconds / 60)} 分 ${Math.floor(seconds % 60).toString().padStart(2, '0')} 秒`
}
