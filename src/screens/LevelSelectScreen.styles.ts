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
    fontSize: 'var(--fs-body-sm)',
  },
  title: {
    fontSize: 'var(--fs-title)',
    fontWeight: 'var(--fw-bold)',
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
    fontSize: 'var(--fs-body-sm)',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
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
    fontSize: 'var(--fs-body)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--text-muted)',
    margin: '0 0 8px',
    paddingLeft: 10,
    borderLeft: '3px solid var(--accent-amber)',
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
    fontSize: 'var(--fs-micro)',
    color: 'var(--text-muted)',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-mono)',
  },
  cardTag: { fontSize: 'var(--fs-body)' },
  cardTitle: {
    fontSize: 'var(--fs-body)',
    fontWeight: 'var(--fw-bold)',
    color: 'var(--text-primary)',
  },
  cardDesc: {
    fontSize: 'var(--fs-small)',
  },
}
