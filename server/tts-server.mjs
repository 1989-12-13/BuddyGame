// ============================================================
// 零点接线台 — 火山引擎 TTS 代理
// 用法: node server/tts-server.mjs
// 环境变量 (写入 .env.local):
//   VOLCANO_TTS_KEY        API key (必填)
//   VOLCANO_TTS_ENDPOINT   可选, 默认 https://openspeech.bytedance.com/api/v3/tts/unidirectional
//   VOLCANO_TTS_RESOURCE   可选, 默认 seed-tts-2.0
//   PORT                   可选, 默认 8787
// ============================================================

import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LRUCache } from './tts-cache.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ---- 加载 .env.local (简单解析, 不引依赖) ----
function loadEnv() {
  const path = resolve(ROOT, '.env.local')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx < 0) continue
    const k = line.slice(0, idx).trim()
    const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!(k in process.env)) process.env[k] = v
  }
}
loadEnv()

const PORT = Number(process.env.PORT ?? 8787)
const ENDPOINT = process.env.VOLCANO_TTS_ENDPOINT ?? 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
const RESOURCE_ID = process.env.VOLCANO_TTS_RESOURCE ?? 'seed-tts-2.0'
const API_KEY = process.env.VOLCANO_TTS_KEY ?? ''

if (!API_KEY) {
  console.error('[tts-server] VOLCANO_TTS_KEY 未设置, 请在 .env.local 中填入 API key')
}

// ---- LRU 缓存 (按 cacheKey 命中) ----
const cache = new LRUCache(200)

// ---- 情绪 → context_texts 映射 ----
const EMOTION_CONTEXTS = {
  // 镇定: 沉着、条理清晰
  calm: ['保持冷静、声音平稳、像受过训练的人那样配合调度员问询。'],
  // 紧张: 焦虑、语速偏快
  tense: ['声音紧张、语速偏快、明显焦虑, 但仍在努力配合调度员。'],
  // 恐慌: 颤抖、哭腔、急促
  panicked: ['声音发颤、带着哭腔、语速急促, 偶尔喘不上气。'],
  // 失控: 大喊、尖叫、语无伦次
  distressed: ['失控地大喊、带着哭腔、语无伦次, 反复呼叫求助。'],
}

// 系统播报: 平稳、机械感的调度中心女声
const SYSTEM_CONTEXTS = [
  '用平稳、专业的播报语气念出, 像调度中心系统的自动播报。',
]

// ---- 入参校验 ----
function validateBody(body) {
  if (!body || typeof body !== 'object') return 'body 必须是对象'
  if (typeof body.text !== 'string' || !body.text.trim()) return 'text 必填'
  if (body.text.length > 300) return 'text 太长 (>300 字符), 请拆分'
  if (body.emotion && !(body.emotion in EMOTION_CONTEXTS)) {
    return `emotion 必须是 ${Object.keys(EMOTION_CONTEXTS).join('/')}`
  }
  return null
}

// ---- 调用火山引擎 (流式, 累积 base64 chunk) ----
async function callVolcano(params) {
  const additions = {
    disable_markdown_filter: false,
    disable_emoji_filter: false,
    enable_latex_tn: true,
    context_texts: params.contextTexts,
  }

  const payload = {
    req_params: {
      text: params.text,
      speaker: params.speaker,
      additions: JSON.stringify(additions),
      audio_params: {
        format: 'mp3',
        sample_rate: 24000,
        enable_subtitle: false,
      },
    },
  }

  const headers = {
    'X-Api-Key': API_KEY,
    'X-Api-Resource-Id': RESOURCE_ID,
    'Content-Type': 'application/json',
    Connection: 'keep-alive',
  }

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 15_000)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    if (!res.ok || !res.body) {
      throw new Error(`upstream HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    const audioChunks = []
    let buf = ''
    let upstreamCode = 0
    let upstreamMsg = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      // 按行解析 (火山流式返回一行行 JSON)
      let nl
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line) continue
        let data
        try {
          data = JSON.parse(line)
        } catch {
          continue
        }
        const code = data.code ?? 0
        if (code === 0 && data.data) {
          const chunk = Buffer.from(data.data, 'base64')
          audioChunks.push(chunk)
        } else if (code === 20000000) {
          // 末尾包
          upstreamCode = code
          upstreamMsg = data.message ?? 'ok'
        } else if (code > 0 && code !== 20000000) {
          upstreamCode = code
          upstreamMsg = data.message ?? `upstream error code ${code}`
          break
        } else if (code === 0 && !data.data) {
          // 成功但无音频数据 — 多半是音色名不存在或文本被过滤，记录诊断信息
          console.warn(`[tts-server] upstream code=0 但 data 为空: speaker=${params.speaker} textLen=${params.text.length} payloadKeys=${Object.keys(data).join(',')}`)
        }
      }
    }

    if (audioChunks.length === 0) {
      throw new Error(`upstream 返回为空: code=${upstreamCode} msg=${upstreamMsg} speaker=${params.speaker}`)
    }
    return Buffer.concat(audioChunks)
  } finally {
    clearTimeout(timeout)
  }
}

// ---- HTTP 路由 ----
function send(res, status, body, contentType = 'application/json') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })
  res.end(body)
}

async function readJson(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return { __parseError: true }
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, 204, '')
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return send(res, 200, JSON.stringify({
      ok: !!API_KEY,
      resource: RESOURCE_ID,
      cacheSize: cache.size,
    }))
  }

  if (req.method !== 'POST' || req.url !== '/api/tts') {
    return send(res, 404, JSON.stringify({ error: 'not found' }))
  }

  if (!API_KEY) {
    return send(res, 500, JSON.stringify({ error: 'VOLCANO_TTS_KEY 未配置' }))
  }

  const body = await readJson(req)
  if (body.__parseError) {
    return send(res, 400, JSON.stringify({ error: 'JSON 解析失败' }))
  }
  const err = validateBody(body)
  if (err) return send(res, 400, JSON.stringify({ error: err }))

  const kind = body.kind === 'system' ? 'system' : 'caller'
  const emotion = body.emotion ?? 'tense'
  const speaker = body.speaker ?? process.env.VOLCANO_TTS_DEFAULT_SPEAKER ?? 'zh_female_vv_uranus_bigtts'
  const text = body.text.trim()

  // cacheKey: 同 kind+text+emotion+speaker 复用
  const cacheKey = body.cacheKey || `${kind}|${emotion}|${speaker}|${text}`
  const hit = cache.get(cacheKey)
  if (hit) {
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'X-Tts-Cache': 'HIT',
      'Access-Control-Allow-Origin': '*',
    })
    return res.end(hit)
  }

  const contextTexts = kind === 'system'
    ? SYSTEM_CONTEXTS
    : EMOTION_CONTEXTS[emotion]

  try {
    const mp3 = await callVolcano({ text, speaker, contextTexts })
    cache.set(cacheKey, mp3)
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': mp3.length,
      'X-Tts-Cache': 'MISS',
      'Access-Control-Allow-Origin': '*',
    })
    return res.end(mp3)
  } catch (e) {
    console.error('[tts-server] 合成失败:', e.message)
    return send(res, 502, JSON.stringify({ error: e.message }))
  }
})

server.listen(PORT, () => {
  console.log(`[tts-server] listening on http://127.0.0.1:${PORT}`)
  console.log(`[tts-server] resource=${RESOURCE_ID} key=${API_KEY ? '***' : '(缺失)'}`)
})