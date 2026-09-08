/** Game tolerance around a one-second breath; not a measure of clinical ability. */
export function scoreBreath(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0.5 || seconds > 1.8) return 0
  if (seconds >= 0.8 && seconds <= 1.2) return 1
  return 0.5
}
