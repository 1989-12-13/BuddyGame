// ============================================================
// 零点接线台 — 选关画面
// ============================================================

import { useState, useMemo, useCallback } from 'react'
import { useAudio } from '../audio/AudioContext'

interface Props {
  onStart: (scenarioId?: string) => void
  onBack: () => void
}

interface ScenarioEntry {
  id: string
  num: number
  title: string
  desc: string
  category: string
  tag: string        // mini-game type indicator
}

const ALL_SCENARIOS: ScenarioEntry[] = [
  // 心肺复苏
  { id: 'cardiac_arrest', num: 9, title: '心脏骤停', desc: 'CPR 30:2 循环', category: '心肺复苏', tag: '♥' },
  // 呼吸系统
  { id: 'choking',        num: 11, title: '气道异物窒息', desc: '海姆立克腹部冲击疗法', category: '呼吸系统', tag: '◎' },
  { id: 'drowning',       num: 6, title: '溺水', desc: 'CPR 30:2', category: '呼吸系统', tag: '♥' },
  { id: 'asthma',         num: 2, title: '哮喘发作', desc: '辅助呼吸胸外按压', category: '呼吸系统', tag: '○' },
  { id: 'carbon_monoxide', num: 26, title: '一氧化碳中毒', desc: '复苏体位步骤排序', category: '呼吸系统', tag: '#' },
  // 创伤出血
  { id: 'hemorrhage',     num: 21, title: '刀割伤大出血', desc: '近心端止血点选择', category: '创伤出血', tag: '◉' },
  { id: 'stab_gunshot',   num: 18, title: '刀刺/枪伤', desc: '近心端止血点选择', category: '创伤出血', tag: '◉' },
  { id: 'trauma_car',     num: 4, title: '严重车祸', desc: '近心端止血点选择', category: '创伤出血', tag: '◉' },
  { id: 'trauma',         num: 17, title: '高处坠落伤', desc: '急救指导', category: '创伤出血', tag: '◆' },
  { id: 'animal_bite',    num: 3, title: '狗咬伤', desc: '近心端止血点选择', category: '创伤出血', tag: '◉' },
  { id: 'assault',        num: 5, title: '暴力袭击', desc: '近心端止血点选择', category: '创伤出血', tag: '◉' },
  // 神经系统
  { id: 'stroke',         num: 28, title: '脑卒中', desc: 'FAST 识别 + 复苏体位步骤', category: '神经系统', tag: '#' },
  { id: 'seizure',        num: 12, title: '癫痫发作', desc: '复苏体位步骤排序', category: '神经系统', tag: '#' },
  { id: 'unconscious_fainting', num: 31, title: '晕厥/意识丧失', desc: '复苏体位步骤排序', category: '神经系统', tag: '#' },
  { id: 'severe_headache', num: 27, title: '剧烈头痛', desc: '急救指导', category: '神经系统', tag: '◆' },
  // 心血管
  { id: 'chest_pain',     num: 10, title: '疑似心梗', desc: '胸外按压训练', category: '心血管', tag: '○' },
  { id: 'heart_problems', num: 19, title: '心律失常', desc: '胸外按压训练', category: '心血管', tag: '○' },
  { id: 'electrocution',  num: 15, title: '触电', desc: 'CPR 30:2', category: '心血管', tag: '♥' },
  // 消化与泌尿
  { id: 'abdominal_pain', num: 1, title: '急性腹痛', desc: '急救指导', category: '消化泌尿', tag: '◆' },
  { id: 'back_pain',      num: 13, title: '急性腰扭伤', desc: '急救指导', category: '消化泌尿', tag: '◆' },
  { id: 'urinary',        num: 33, title: '肾绞痛', desc: '急救指导', category: '消化泌尿', tag: '◆' },
  // 内分泌与过敏
  { id: 'diabetic',       num: 25, title: '低血糖昏迷', desc: '复苏体位步骤排序', category: '内分泌过敏', tag: '#' },
  { id: 'anaphylaxis',    num: 20, title: '过敏性休克', desc: '肾上腺素注射定位', category: '内分泌过敏', tag: '◎' },
  { id: 'heat_stroke',    num: 29, title: '热射病', desc: '冰敷位置定位', category: '内分泌过敏', tag: '◎' },
  // 眼伤与灼伤
  { id: 'eye_injury',     num: 23, title: '化学物入眼', desc: '眼部冲洗定位', category: '眼伤灼伤', tag: '◎' },
  { id: 'chemical_burn',  num: 7, title: '化学品灼伤', desc: '眼部冲洗定位', category: '眼伤灼伤', tag: '◎' },
  // 精神与特殊
  { id: 'psychiatric',    num: 25, title: '自杀倾向', desc: '复苏体位步骤排序', category: '精神特殊', tag: '#' },
  { id: 'overdose',       num: 22, title: '药物过量', desc: '复苏体位步骤排序', category: '精神特殊', tag: '#' },
  { id: 'entrapment',     num: 22, title: '电梯困人', desc: '急救指导', category: '精神特殊', tag: '◆' },
  // 妇儿与老年
  { id: 'obstetric',      num: 24, title: '产科急症', desc: '急救指导', category: '妇儿老年', tag: '◆' },
  { id: 'falls_elderly',  num: 17, title: '老人跌倒', desc: '复苏体位步骤排序', category: '妇儿老年', tag: '#' },
  { id: 'sick_person',    num: 33, title: '不明原因发烧', desc: '急救指导', category: '妇儿老年', tag: '◆' },
]

const TAGS: Record<string, string> = {
  '♥': 'CPR 30:2',
  '○': '胸外按压',
  '◎': '瞄准定位',
  '◉': '位置选择',
  '#': '步骤排序',
  '◆': '急救指导',
}

const CATEGORY_ORDER = ['心肺复苏', '呼吸系统', '创伤出血', '神经系统', '心血管', '消化泌尿', '内分泌过敏', '眼伤灼伤', '精神特殊', '妇儿老年']

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
            <span style={{ marginRight: 2 }}>{emoji}</span>
            <span style={{ fontSize: 11 }}>{label}</span>
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
                  style={{
                    ...styles.card,
                    borderColor: hoveredId === s.id ? '#ffb000' : 'var(--border)',
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-primary)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    padding: '6px 14px',
    fontSize: 13,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    cursor: 'pointer',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'var(--text-primary)',
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
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
  },
  legendBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 20px',
    flexWrap: 'wrap',
    fontSize: 11,
  },
  legendTitle: { color: 'var(--text-muted)', marginRight: 4 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 2, color: 'var(--text-secondary)' },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 30px',
  },
  categorySection: {
    marginTop: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    margin: '0 0 8px',
    paddingLeft: 10,
    borderLeft: '3px solid #ffb000',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 8,
  },
  card: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protocolNum: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  cardTag: { fontSize: 14 },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'var(--text-primary)',
  },
  cardDesc: {
    fontSize: 11,
    color: 'var(--text-muted)',
    lineHeight: 1.3,
  },
}
