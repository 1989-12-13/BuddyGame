// ============================================================
// stress 0-100 → TTS 情绪参数映射
// 与后端 EMOTION_CONTEXTS 保持 4 档对应
// ============================================================

import type { TtsEmotion } from './ttsClient'

export const EMOTION_LABELS: Record<TtsEmotion, string> = {
  calm: '镇定',
  tense: '紧张',
  panicked: '恐慌',
  distressed: '失控',
}

/** 来电者 stress 数值 → 情绪档位 (与后端 EMOTION_CONTEXTS key 一致) */
export function stressToEmotion(stress: number): TtsEmotion {
  if (stress >= 75) return 'distressed'
  if (stress >= 50) return 'panicked'
  if (stress >= 25) return 'tense'
  return 'calm'
}

/**
 * stress → 强度系数 (预留, 暂未透传给后端, 后续可作为 speed 参数)
 * 返回 0.8 ~ 1.3 之间
 */
export function stressToIntensity(stress: number): number {
  const s = Math.max(0, Math.min(100, stress))
  return 0.8 + (s / 100) * 0.5
}

/**
 * stress → 打字机逐字间隔 (ms/char)
 * 与 TTS 语速粗略对齐: calm 慢一点显得从容, distressed 接近原速显紧迫
 *   calm       → 120ms (8.3 字/秒)
 *   tense      → 100ms (10 字/秒)
 *   panicked   →  80ms (12.5 字/秒)
 *   distressed →  65ms (15.4 字/秒, 与原值一致)
 */
export function stressToTypewriterInterval(stress: number): number {
  if (stress >= 75) return 65
  if (stress >= 50) return 80
  if (stress >= 25) return 100
  return 120
}