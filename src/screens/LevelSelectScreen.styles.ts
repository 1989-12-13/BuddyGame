// ============================================================
// LevelSelectScreen — 样式对象（从 LevelSelectScreen.tsx 提取）
// ============================================================

export const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-12) var(--space-20)',
    borderBottom: '1px solid var(--line)',
  },
  backBtn: {
    padding: 'var(--space-6) var(--space-14)',
    fontSize: 'var(--fs-body-sm)',
  },
  title: {
    fontSize: 'var(--fs-title)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--text)',
    margin: 0,
    letterSpacing: 2,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-6)',
    margin: 'var(--space-10) var(--space-20)',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    padding: 'var(--space-8) var(--space-12)',
    fontSize: 'var(--fs-body-sm)',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    color: 'var(--text-3)',
    cursor: 'pointer',
    fontSize: 'var(--fs-body)',
  },
  legendBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-10)',
    padding: 'var(--space-6) var(--space-20)',
    flexWrap: 'wrap',
    fontSize: 'var(--fs-small)',
  },
  legendTitle: { color: 'var(--text-3)', marginRight: 'var(--space-4)'},
  legendItem: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-2)' },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 var(--space-20) var(--space-28)',
  },
  categorySection: {
    marginTop: 'var(--space-16)',
  },
  categoryTitle: {
    fontSize: 'var(--fs-body)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--text-3)',
    margin: '0 0 var(--space-8)',
    paddingLeft: 'var(--space-10)',
    borderLeft: '3px solid var(--warning)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 'var(--space-8)',
  },
  card: {
    padding: 'var(--space-10) var(--space-12)',
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    boxShadow: 'var(--shadow-sm)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protocolNum: {
    fontSize: 'var(--fs-micro)',
    color: 'var(--text-3)',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-mono)',
  },
  cardTag: { fontSize: 'var(--fs-body)' },
  cardTitle: {
    fontSize: 'var(--fs-body)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--text)',
  },
  cardDesc: {
    fontSize: 'var(--fs-small)',
  },
}
