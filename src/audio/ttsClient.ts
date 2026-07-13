// ============================================================
// 火山引擎 TTS 前端 client
// 通过 Vite proxy (/api) → server/tts-server.mjs → 火山引擎
// ============================================================

export type TtsEmotion = 'calm' | 'tense' | 'panicked' | 'distressed'
export type TtsKind = 'caller' | 'system'

export interface TtsRequest {
  text: string
  kind: TtsKind
  /** caller 用, system 默认中性 */
  emotion?: TtsEmotion
  /** 覆盖默认 speaker, 默认值由后端 .env 控制 */
  speaker?: string
  /** 显式指定缓存键, 缺省时后端按 kind+emotion+text 拼 */
  cacheKey?: string
}

export interface TtsResult {
  blob: Blob
  url: string
  cacheHit: boolean
}

export class TtsError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TtsError'
    this.status = status
  }
}

export async function synthesizeSpeech(
  req: TtsRequest,
  signal?: AbortSignal,
): Promise<TtsResult> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) msg = data.error
    } catch {
      /* ignore */
    }
    throw new TtsError(msg, res.status)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const cacheHit = res.headers.get('X-Tts-Cache') === 'HIT'
  return { blob, url, cacheHit }
}