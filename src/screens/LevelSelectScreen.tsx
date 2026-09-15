// ============================================================
// 120调度台 — 选关画面
// ============================================================

import { useState, useMemo, useCallback } from 'react'
import { useAudio } from '../audio/AudioContext'
import { LEVEL_CATALOG, type LevelEntry } from '../game/events/levelCatalog'
import { CATEGORY_ORDER, TAGS } from '../game/events/categories'
import { styles } from './LevelSelectScreen.styles'

interface Props {
  onStart: (scenarioId?: string) => void
  onBack: () => void
}

/** 选关条目统一由 game/events/levelCatalog 派生，本文件不再自己拼列表 */
type ScenarioEntry = LevelEntry
const ALL_SCENARIOS: ScenarioEntry[] = LEVEL_CATALOG

export function LevelSelectScreen({ onStart, onBack }: Props) {
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const audio = useAudio()

  const handleBack = useCallback(() => {
    audio.play('confirm')
    onBack()
  }, [audio, onBack])

  const handleScenarioClick = useCallback((scenarioId: string) => {
    audio.play('connect')
    onStart(scenarioId)
  }, [audio, onStart])

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_SCENARIOS
    const q = search.toLowerCase()
    return ALL_SCENARIOS.filter(s =>
      s.title.includes(q) || s.desc.includes(q) || s.id.includes(q) || String(s.num).includes(q)
    )
  }, [search])

  const grouped = useMemo(() => {
    const map = new Map<string, ScenarioEntry[]>()
    for (const s of filtered) {
      const cat = s.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(s)
    }
    return map
  }, [filtered])

  const sortedCategories = CATEGORY_ORDER.filter(c => grouped.has(c))

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backBtn}>← 返回</button>
        <h1 style={styles.title}>场景选择</h1>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.searchBar}>
        <input
          style={styles.searchInput}
          placeholder="搜索场景名称/编号..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      <div style={styles.legendBar}>
        <span style={styles.legendTitle}>小游戏类型：</span>
        {Object.entries(TAGS).map(([emoji, label]) => (
          <span key={emoji} style={styles.legendItem}>
            <span style={{ marginRight: 'var(--space-2)'}}>{emoji}</span>
            <span style={{ fontSize: 'var(--fs-small)' }}>{label}</span>
          </span>
        ))}
      </div>

      <div style={styles.scrollArea}>
        {sortedCategories.map(cat => (
          <div key={cat} style={styles.categorySection}>
            <h2 style={styles.categoryTitle}>{cat}</h2>
            <div style={styles.grid}>
              {grouped.get(cat)!.map(s => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`练习${s.title}`}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleScenarioClick(s.id) } }}
                  style={{
                    ...styles.card,
                    borderColor: hoveredId === s.id ? 'var(--warning)' : 'var(--line)',
                    transform: hoveredId === s.id ? 'translateY(-2px)' : 'none',
                  }}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleScenarioClick(s.id)}
                >
                  <div style={styles.cardHeader}>
                    <span style={styles.protocolNum}>#{s.num}</span>
                    <span style={styles.cardTag}>{s.tag}</span>
                  </div>
                  <div style={styles.cardTitle}>{s.title}</div>
                  <div style={styles.cardDesc}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
