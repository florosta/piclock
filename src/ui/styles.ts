/**
 * Style fragments shared across the sheets. Kept in their own module so every
 * sheet header, status line, label and section heading is literally the same
 * object rather than four near-identical copies that drift apart.
 */
export const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'flex-end',
    zIndex: 10,
  },
  sheet: {
    width: '100%',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
  },
  grip: {
    flexShrink: 0,
    padding: 'var(--s-2) 0 var(--s-1)',
    display: 'flex', justifyContent: 'center',
    touchAction: 'none',
  },
  gripBar: {
    width: '12vw', height: '0.5vw',
    borderRadius: '999px',
    background: 'var(--border)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 'var(--s-2) var(--s-4) var(--s-3)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  title: {
    fontSize: 'var(--t-sm)',
    letterSpacing: 'var(--track-wide)',
    textTransform: 'uppercase',
    opacity: 'var(--o-secondary)',
  },
  actions: { display: 'flex', gap: 'var(--s-2)', alignItems: 'center' },
  iconBtn: {
    background: 'none', border: 'none',
    fontSize: 'var(--t-md)',
    width: '6vw', height: '6vw',
  },

  /* Shared content styles, so every sheet's rows and labels match */
  body: {
    flex: 1,
    padding: 'var(--s-3) var(--s-4) var(--s-4)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-4)',
  },
  status: {
    textAlign: 'center',
    opacity: 'var(--o-tertiary)',
    padding: 'var(--s-5)',
    fontSize: 'var(--t-md)',
  },
  label: {
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-label)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  sectionLabel: {
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-wide)',
    textTransform: 'uppercase',
  },
}
