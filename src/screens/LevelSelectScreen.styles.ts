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
    padding: '12px 20px',
    borderBottom: '1px solid var(--line)',
  },
  backBtn: {
    padding: '6px 14px',
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
    gap: 6,
    margin: '10px 20px',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
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
    gap: 10,
    padding: '6px 20px',
    flexWrap: 'wrap',
    fontSize: 'var(--fs-small)',
  },
  legendTitle: { color: 'var(--text-3)', marginRight: 4 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 2, color: 'var(--text-2)' },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 30px',
  },
  categorySection: {
    marginTop: 16,
  },
  categoryTitle: {
    fontSize: 'var(--fs-body)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--text-3)',
    margin: '0 0 8px',
    paddingLeft: 10,
    borderLeft: '3px solid var(--warning)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 8,
  },
  card: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
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
