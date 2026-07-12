// ============================================================
// MPDS 知识库 — 科普 MPDS 医疗优先调度系统
// ============================================================

import { useMemo, useState, useCallback } from 'react'
import { useAudio } from '../audio/AudioContext'
import { SCENARIOS, SCENARIO_IDS } from '../game/events/templates'
import type { EmergencyScenario, MpdsDeterminant } from '../game/types'
import { MPDS_DETERMINANT_INFO } from '../game/types'
import { SCENARIO_EXAMPLES, DISPATCHER_NOTES, GUIDANCE_DETAILS } from '../game/knowledge'

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
        <div style={{ width: 60 }} />
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
      {selected && selectedNotes && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
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
              <DetailSection icon="📋" title="病情概述">
                <p style={styles.paragraph}>{selectedNotes.description}</p>
              </DetailSection>

              {/* 现场案例 */}
              {(() => {
                const ex = SCENARIO_EXAMPLES[selected.id]
                if (!ex) return null
                return (
                  <DetailSection icon="🚑" title="典型现场案例">
                    <p style={{ ...styles.paragraph, fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                      ⭐ 粗体为游戏中本协议所采用的案例
                    </p>
                    <ul style={styles.list}>
                      {ex.examples.map((e, i) => (
                        <li key={i} style={{
                          ...styles.listItem,
                          fontWeight: i === ex.gameIndex ? 700 : 400,
                          color: i === ex.gameIndex ? '#1e293b' : '#475569',
                        }}>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </DetailSection>
                )
              })()}

              <DetailSection icon="🔍" title="常见原因">
                <ul style={styles.list}>
                  {selectedNotes.commonCauses.map((c, i) => (
                    <li key={i} style={styles.listItem}>{c}</li>
                  ))}
                </ul>
              </DetailSection>

              <DetailSection icon="💡" title="调度员注意事项">
                <ul style={styles.list}>
                  {selectedNotes.dispatcherTips.map((t, i) => (
                    <li key={i} style={styles.listItem}>{t}</li>
                  ))}
                </ul>
              </DetailSection>

              <DetailSection icon="❓" title="MPDS 关键问询">
                <ul style={styles.list}>
                  {selected.mpdsCard.keyQuestions.map((q, i) => (
                    <li key={i} style={styles.listItem}>{q}</li>
                  ))}
                </ul>
              </DetailSection>

              {selected.guidance && (() => {
                const detail = GUIDANCE_DETAILS[selected.id]
                return (
                <DetailSection icon="🩺" title={`急救指导案例`}>
                  <p style={{ ...styles.paragraph, fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                    ⭐ 以下为游戏中本协议所采用的急救方案及临床分析
                  </p>
                  <p style={{ ...styles.paragraph, fontWeight: 600, marginBottom: 4 }}>{selected.guidance.title}</p>
                  <p style={styles.paragraph}>{selected.guidance.intro}</p>
                  <ol style={styles.list}>
                    {(detail?.steps ?? selected.guidance.steps).map((step: any, i: number) => {
                      const isDetailed = 'explanation' in step
                      return (
                        <li key={i} style={{ marginBottom: 10, lineHeight: 1.7 }}>
                          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#334155' }}>{step.prompt}</div>
                          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                            {step.options.map((o: string, j: number) => {
                              const isCorrect = j === step.correctIndex
                              return (
                                <span key={j} style={{
                                  display: 'inline-block',
                                  padding: '1px 6px',
                                  margin: '1px 2px',
                                  borderRadius: 3,
                                  backgroundColor: isCorrect ? '#dcfce7' : '#f8fafc',
                                  border: `1px solid ${isCorrect ? '#16a34a' : '#e2e8f0'}`,
                                  color: isCorrect ? '#166534' : '#64748b',
                                  fontWeight: isCorrect ? 600 : 400,
                                  fontSize: 12,
                                }}>
                                  {isCorrect ? '✅ ' : ''}{o}
                                </span>
                              )
                            })}
                          </div>
                          {isDetailed && (
                            <>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>
                                <span style={{ fontWeight: 'bold', color: '#475569' }}>临床分析：</span>
                                {step.explanation}
                              </div>
                              <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
                                {(step.optionAnalysis as string[]).map((oa: string, j: number) => (
                                  <div key={j} style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginTop: 1 }}>
                                    {j === step.correctIndex ? '✅' : '❌'} {oa}
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

              <DetailSection icon="🏷️" title="判定信息">
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>判定码</span>
                  <span style={{ ...styles.infoValue, fontFamily: 'monospace', fontWeight: 'bold', color: MPDS_DETERMINANT_INFO[parseDeterminant(selected.mpdsCard.determinantCode)].color }}>
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
          </div>
        </div>
      )}
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f0f4f8',
    display: 'flex',
    flexDirection: 'column',
    color: '#334155',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    padding: '6px 14px',
    fontSize: 13,
    color: '#64748b',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    letterSpacing: 2,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '10px 20px',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    color: '#334155',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 20px',
    flexWrap: 'wrap',
    fontSize: 11,
  },
  legendTitle: { color: '#94a3b8', marginRight: 4, fontWeight: 'bold' },
  legendTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 30px',
  },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    margin: '0 0 8px',
    paddingLeft: 10,
    borderLeft: '3px solid',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 6,
  },
  card: {
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
  },
  cardBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  cardMiddle: {
    flex: 1,
  },
  protocolBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    padding: '2px 8px',
    borderRadius: 4,
  },
  detBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    padding: '2px 6px',
    borderRadius: 4,
  },
  chiefComplaint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 1.4,
  },

  // ---------- 弹窗 ----------
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
  },
  modal: {
    width: 560,
    maxHeight: '85vh',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    backgroundColor: '#f8fafc',
    borderBottom: '3px solid',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  modalProtocolBadge: {
    fontSize: 18,
    fontWeight: 900,
    fontFamily: 'monospace',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    padding: '4px 10px',
    borderRadius: 6,
    lineHeight: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
  },
  modalBody: {
    flex: 1,
    padding: '14px 18px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },

  // ---------- 详情区块 ----------
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: 3,
  },
  paragraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.8,
    margin: 0,
  },
  list: {
    margin: 0,
    paddingLeft: 18,
  },
  listItem: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.7,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '2px 0',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    minWidth: 64,
  },
  infoValue: {
    fontSize: 13,
    color: '#475569',
  },
}
