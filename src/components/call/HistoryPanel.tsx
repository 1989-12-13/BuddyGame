// ============================================================
// 零点接线台 — 历史任务对话面板
// 玩家点击地图上的救护车时，drawer 整体切换为该任务的对话快照
// ============================================================

import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { X, Clock, MapPin, Truck, Star, History } from 'lucide-react'
import type { CallHistoryEntry, DialogueLine } from '../../game/types'
import { TRIAGE_LABELS } from '../../game/types'

interface Props {
  entry: CallHistoryEntry
  onClose: () => void
}

const SIZE = 13

export function HistoryPanel({ entry, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [streamingIdx, setStreamingIdx] = useState(-1)
  const [streamingPos, setStreamingPos] = useState(0)
  const timerRef = useRef<number | null>(null)

  // 流式重新播放对话（点击查看历史时也给"重新播放"的反馈）
  useEffect(() => {
    let i = 0
    const advance = () => {
      if (i >= entry.dialogueLog.length) {
        setStreamingIdx(-1)
        setStreamingPos(0)
        return
      }
      const line = entry.dialogueLog[i]
      if (line.speaker === 'system') {
        setStreamingIdx(i)
        setStreamingPos(line.text.length)
        i += 1
        setTimeout(advance, 60)
      } else {
        setStreamingIdx(i)
        setStreamingPos(0)
        const chars = [...line.text]
        let pos = 0
        const tick = () => {
          pos += 1
          setStreamingPos(pos)
          if (pos >= chars.length) {
            i += 1
            timerRef.current = window.setTimeout(advance, 240)
          } else {
            timerRef.current = window.setTimeout(tick, 22)
          }
        }
        tick()
      }
    }
    advance()
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [entry.dialogueLog])

  // 自动滚动到底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [streamingIdx, streamingPos])

  const outcomeInfo = (() => {
    switch (entry.outcome) {
      case 'success': return { label: '✓ 救治成功', color: '#16a34a' }
      case 'failed': return { label: '✗ 救治失败', color: '#dc2626' }
      case 'pending': return { label: '⋯ 救护车仍在途中', color: '#d97706' }
      case 'no_dispatch': return { label: '未派车', color: '#6e7681' }
    }
  })()

  return (
    <div style={styles.container}>
      {/* 标题条 */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <History size={14} color="#fbbf24" strokeWidth={2.5} />
          <span style={styles.titleText}>历史任务</span>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            title="回到当前通话"
          >
            <X size={14} color="#8b949e" />
          </button>
        </div>
        <div style={styles.summary}>{entry.shortSummary}</div>
        <div style={styles.metaRow}>
          <span style={styles.metaItem}>
            <Truck size={SIZE} color="#8b949e" /> {entry.vehicleName ?? '—'}
          </span>
          {entry.triage && (
            <span style={{ ...styles.metaItem, color: '#fbbf24' }}>
              分诊: {TRIAGE_LABELS[entry.triage].split(' — ')[0]}
            </span>
          )}
          <span style={{ ...styles.metaItem, color: outcomeInfo.color, fontWeight: 700 }}>
            {outcomeInfo.label}
          </span>
        </div>
        {entry.score != null && (
          <div style={styles.scoreRow}>
            <Star size={SIZE} color="#d97706" strokeWidth={2.5} />
            <span style={styles.scoreLabel}>得分</span>
            <span style={styles.scoreValue}>{entry.score}/100</span>
          </div>
        )}
        {entry.addressResolved && (
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>
              <MapPin size={SIZE} color="#8b949e" /> {entry.addressResolved}
            </span>
            <span style={styles.metaItem}>
              <Clock size={SIZE} color="#8b949e" />
              {fmtDuration(entry.endShiftTime - entry.startShiftTime)}
              {entry.dispatchTime != null && ` · 派车 ${entry.dispatchTime}s`}
            </span>
          </div>
        )}
      </div>

      {/* 完整对话 */}
      <div ref={scrollRef} style={styles.dialogue}>
        {entry.dialogueLog.map((line, i) => (
          <DialogueRow
            key={i}
            line={line}
            streaming={i === streamingIdx}
            streamedChars={i === streamingIdx ? streamingPos : line.text.length}
          />
        ))}
      </div>
    </div>
  )
}

function DialogueRow({
  line,
  streaming,
  streamedChars,
}: {
  line: DialogueLine
  streaming: boolean
  streamedChars: number
}) {
  const styleBySpeaker: Record<DialogueLine['speaker'], CSSProperties> = {
    operator: { color: '#60a5fa', borderLeft: '2px solid #60a5fa' },
    caller: { color: '#e6edf3', borderLeft: '2px solid #d97706' },
    system: { color: '#8b949e', fontStyle: 'italic', opacity: 0.85 },
  }
  const speakerLabel: Record<DialogueLine['speaker'], string> = {
    operator: '接线员',
    caller: '来电者',
    system: '系统',
  }
  const showText = streaming ? line.text.slice(0, streamedChars) : line.text
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        ...styles.line,
        ...styleBySpeaker[line.speaker],
      }}
    >
      <span style={styles.speakerLabel}>{speakerLabel[line.speaker]}</span>
      <span style={styles.lineText}>{showText}{streaming && streamedChars < line.text.length && '▌'}</span>
    </motion.div>
  )
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  header: {
    padding: '12px 14px 10px',
    background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.04), transparent)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    flexShrink: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 11,
    color: '#fbbf24',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid #2a323e',
    borderRadius: 4,
    cursor: 'pointer',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    fontSize: 13,
    color: '#e6edf3',
    marginBottom: 6,
    fontFamily: 'var(--font-mono)',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: '#8b949e',
    fontFamily: 'var(--font-mono)',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    background: 'rgba(217, 119, 6, 0.08)',
    border: '1px solid rgba(217, 119, 6, 0.3)',
    borderRadius: 4,
    width: 'fit-content',
    marginTop: 6,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
  },
  scoreValue: {
    fontSize: 14,
    color: '#d97706',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
  },
  dialogue: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 0,
  },
  line: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12.5,
    lineHeight: 1.6,
  },
  speakerLabel: {
    fontSize: 9.5,
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    marginRight: 6,
  },
  lineText: {
    fontFamily: 'var(--font-mono)',
  },
}
