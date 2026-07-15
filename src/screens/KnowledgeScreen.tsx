// ============================================================
// MPDS 知识库 — 科普 MPDS 医疗优先调度系统
// ============================================================

import { useMemo, useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAudio } from '../audio/AudioContext'


import { SCENARIOS, SCENARIO_IDS } from '../game/events/templates'
import type { EmergencyScenario, MpdsDeterminant } from '../game/types'
import { MPDS_DETERMINANT_INFO } from '../game/types'
import { SCENARIO_EXAMPLES, DISPATCHER_NOTES, GUIDANCE_DETAILS } from '../game/knowledge'
import { styles } from './KnowledgeScreen.styles'

interface Props {
  onBack: () => void
}

const DET_ORDER: MpdsDeterminant[] = ['ECHO', 'DELTA', 'CHARLIE', 'BRAVO', 'ALPHA']

/** 从 determinantCode（如 "9-E-1"）中提取判定等级 */
function parseDeterminant(code: string): MpdsDeterminant {
  const map: Record<string, MpdsDeterminant> = { E: 'ECHO', D: 'DELTA', C: 'CHARLIE', B: 'BRAVO', A: 'ALPHA' }
  const parts = code.split('-')
  return map[parts[1]?.[0]?.toUpperCase() ?? ''] ?? 'ALPHA'
}



export function KnowledgeScreen({ onBack }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const audio = useAudio()

  const handleBack = useCallback(() => {
    audio.play('confirm')
    onBack()
  }, [audio, onBack])

  const handleScenarioClick = useCallback((id: string) => {
    audio.play('question')
    setSelectedId(id)
  }, [audio])

  const handleCloseModal = useCallback(() => {
    audio.play('confirm')
    setSelectedId(null)
  }, [audio])

  // Escape 关闭弹窗
  useEffect(() => {
    if (!selectedId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, handleCloseModal])

  const scenarios = useMemo(() => {
    const list = SCENARIO_IDS
      .map((id) => SCENARIOS[id])
      .filter((s) => !s.isPrank)
      .sort((a, b) => a.mpdsCard.number - b.mpdsCard.number)

    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (s) =>
        s.title.includes(q) ||
        s.mpdsCard.title.includes(q) ||
        s.mpdsCard.chiefComplaint.includes(q) ||
        String(s.mpdsCard.number).includes(q) ||
        SCENARIO_EXAMPLES[s.id]?.examples.some((e) => e.includes(q)),
    )
  }, [search])

  const grouped = useMemo(() => {
    const groups: Record<string, EmergencyScenario[]> = {}
    for (const det of DET_ORDER) groups[det] = []
    for (const s of scenarios) {
      const det = parseDeterminant(s.mpdsCard.determinantCode)
      if (groups[det]) groups[det].push(s)
    }
    return groups
  }, [scenarios])

  // 当前选中的场景（用于弹窗）
  const selected = selectedId ? SCENARIOS[selectedId] ?? null : null
  const selectedNotes = selected ? DISPATCHER_NOTES[selected.id] ?? null : null

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backBtn}>← 返回</button>
        <h1 style={styles.title}>MPDS 知识库</h1>
      </div>

      {/* 搜索 */}
      <div style={styles.searchBar}>
        <input
          style={styles.searchInput}
          placeholder="搜索协议编号、名称、主诉..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* 判定等级图例 */}
      <div style={styles.legend}>
        <span style={styles.legendTitle}>MPDS 判定等级：</span>
        {DET_ORDER.map((det) => {
          const info = MPDS_DETERMINANT_INFO[det]
          return (
            <span key={det} style={{ ...styles.legendTag, color: info.color, borderColor: info.color }}>
              ● {det[0]}{det.slice(1).toLowerCase()} {info.label.split('—')[1]?.trim()}
            </span>
          )
        })}
      </div>

      {/* 场景列表 */}
      <div style={styles.scrollArea}>
        {DET_ORDER.map((det) => {
          const items = grouped[det] ?? []
          if (items.length === 0) return null
          const info = MPDS_DETERMINANT_INFO[det]
          return (
            <div key={det} style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: info.color, borderLeftColor: info.color }}>
                {det[0]}-{det.slice(1).toLowerCase()} {info.label}
              </h2>
              <div style={styles.cardGrid}>
                {items.map((s) => (
                  <div
                    key={s.id}
                    style={styles.card}
                    onClick={() => handleScenarioClick(s.id)}
                  >
                    <div style={styles.cardTitle}>{s.mpdsCard.title}</div>
                    <div style={styles.cardBottom}>
                      <span style={{ ...styles.protocolBadge, backgroundColor: `${info.color}15`, color: info.color }}>
                        #{s.mpdsCard.number}
                      </span>
                      <span style={styles.cardMiddle} />
                      <span style={{ ...styles.detBadge, backgroundColor: info.color, color: '#fff' }}>
                        {s.mpdsCard.determinantCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ====== 详情弹窗 ====== */}
      <AnimatePresence>
        {selected && selectedNotes && (
        <motion.div
          key="knowledge-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={styles.modalOverlay}
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.15 }}
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div style={{ ...styles.modalHeader, borderBottomColor: MPDS_DETERMINANT_INFO[parseDeterminant(selected.mpdsCard.determinantCode)].color }}>
              <div style={styles.modalHeaderLeft}>
                <span style={styles.modalProtocolBadge}>#{selected.mpdsCard.number}</span>
                <div>
                  <div style={styles.modalTitle}>{selected.mpdsCard.title}</div>
                  <div style={styles.modalSubtitle}>{selected.title} · {selected.mpdsCard.chiefComplaint}</div>
                </div>
              </div>
              <button style={styles.modalCloseBtn} onClick={handleCloseModal}>✕</button>
            </div>

            {/* 弹窗内容 */}
            <div style={styles.modalBody}>
              <DetailSection icon="≡" title="病情概述">
                <p style={styles.paragraph}>{selectedNotes.description}</p>
              </DetailSection>

              {/* 现场案例 */}
              {(() => {
                const ex = SCENARIO_EXAMPLES[selected.id]
                if (!ex) return null
                return (
                  <DetailSection icon="▸" title="典型现场案例">
                    <p style={{ ...styles.paragraph, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 4 }}>
                      ★ 粗体为游戏中本协议所采用的案例
                    </p>
                    <ul style={styles.list}>
                      {ex.examples.map((e, i) => (
                        <li key={i} style={{
                          ...styles.listItem,
                          fontWeight: i === ex.gameIndex ? 700 : 400,
                          color: i === ex.gameIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </DetailSection>
                )
              })()}

              <DetailSection icon="◆" title="常见原因">
                <ul style={styles.list}>
                  {selectedNotes.commonCauses.map((c, i) => (
                    <li key={i} style={styles.listItem}>{c}</li>
                  ))}
                </ul>
              </DetailSection>

              <DetailSection icon="◆" title="调度员注意事项">
                <ul style={styles.list}>
                  {selectedNotes.dispatcherTips.map((t, i) => (
                    <li key={i} style={styles.listItem}>{t}</li>
                  ))}
                </ul>
              </DetailSection>

              <DetailSection icon="?" title="MPDS 关键问询">
                <ul style={styles.list}>
                  {selected.mpdsCard.keyQuestions.map((q, i) => (
                    <li key={i} style={styles.listItem}>{q}</li>
                  ))}
                </ul>
              </DetailSection>

              {selected.guidance && (() => {
                const detail = GUIDANCE_DETAILS[selected.id]
                return (
                <DetailSection icon="♥" title={`急救指导案例`}>
                  <p style={{ ...styles.paragraph, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>
                    ★ 以下为游戏中本协议所采用的急救方案及临床分析
                  </p>
                  <p style={{ ...styles.paragraph, fontWeight: 'var(--fw-semibold)', marginBottom: 4 }}>{selected.guidance.title}</p>
                  <p style={styles.paragraph}>{selected.guidance.intro}</p>
                  <ol style={styles.list}>
                    {selected.guidance.steps.map((step, i) => {
                      const stepDetail = detail?.steps[i]
                      const merged = { ...step, ...stepDetail }
                      const isDetailed = !!stepDetail
                      return (
                        <li key={i} style={{ marginBottom: 10, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-primary)' }}>{merged.prompt}</div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {merged.options.map((o: string, j: number) => {
                              const isCorrect = j === merged.correctIndex
                              return (
                                <span key={j} style={{
                                  display: 'inline-block',
                                  padding: '1px 6px',
                                  margin: '1px 2px',
                                  borderRadius: 3,
                                  backgroundColor: isCorrect ? 'var(--success-green-bg)' : 'var(--bg-surface)',
                                  border: `1px solid ${isCorrect ? 'var(--accent-green)' : 'var(--border)'}`,
                                  color: isCorrect ? 'var(--accent-green)' : 'var(--text-secondary)',
                                  fontWeight: isCorrect ? 'var(--fw-semibold)' : 'var(--fw-normal)',
                                  fontSize: 'var(--fs-caption)',
                                }}>
                                  {isCorrect ? '✓ ' : ''}{o}
                                </span>
                              )
                            })}
                          </div>
                          {isDetailed && (
                            <>
                              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
                                <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-secondary)' }}>临床分析：</span>
                                {merged.explanation}
                              </div>
                              <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
                                {(merged.optionAnalysis as string[]).map((oa: string, j: number) => (
                                  <div key={j} style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 1 }}>
                                    {j === merged.correctIndex ? '✓' : '✕'} {oa}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </DetailSection>
                )
              })()}

              <DetailSection icon="#" title="判定信息">
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>判定码</span>
                  <span style={{ ...styles.infoValue, fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-bold)', color: MPDS_DETERMINANT_INFO[parseDeterminant(selected.mpdsCard.determinantCode)].color }}>
                    {selected.mpdsCard.determinantCode}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>协议编号</span>
                  <span style={styles.infoValue}>{selected.mpdsCard.number}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>分诊建议</span>
                  <span style={styles.infoValue}>{MPDS_DETERMINANT_INFO[parseDeterminant(selected.mpdsCard.determinantCode)].label}</span>
                </div>
              </DetailSection>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={styles.detailSection}>
      <div style={styles.detailSectionTitle}>{icon} {title}</div>
      {children}
    </div>
  )
}

