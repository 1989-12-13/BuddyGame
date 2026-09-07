export function readStorage(key: string): string | null {
  try { return window.localStorage.getItem(key) } catch { return null }
}
export function writeStorage(key: string, value: string): boolean {
  try { window.localStorage.setItem(key, value); return true } catch { return false }
}
export function removeStorage(key: string): void {
  try { window.localStorage.removeItem(key) } catch { /* Private browsing can still play. */ }
}
