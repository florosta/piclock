import type { EpisodesState } from '../hooks/useEpisodes'
import type { Episode } from '../types'

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface Props {
  episodes: EpisodesState
  currentEpisode: Episode | null
  onSelect: (episode: Episode) => void
  onClose: () => void
}

export default function EpisodePicker({ episodes, currentEpisode, onSelect, onClose }: Props) {
  const { episodes: list, loading, error } = episodes

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <span style={s.title}>Episodes</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.list}>
          {loading && <div style={s.status}>Loading…</div>}
          {error && <div style={s.status}>{error}</div>}
          {list.map((ep: Episode) => (
            <div
              key={ep.id}
              style={{ ...s.row, ...(currentEpisode?.id === ep.id ? s.rowActive : {}) }}
              onClick={() => onSelect(ep)}
            >
              <img
                style={s.cover}
                src={ep.podcast.coverUrl}
                alt=""
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div style={s.info}>
                <div style={s.epTitle}>{ep.title}</div>
                <div style={s.epMeta}>
                  {formatDate(ep.publishedAt)} · {formatDuration(ep.duration)}
                </div>
              </div>
              {currentEpisode?.id === ep.id && <span style={s.check}>✓</span>}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'flex-end',
    zIndex: 10,
  },
  sheet: {
    width: '100%',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    maxHeight: '80vh',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '3vw 4vw',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  title: {
    fontSize: '3vw', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6,
  },
  closeBtn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '3vw', cursor: 'pointer', opacity: 0.5,
  },
  list: { overflowY: 'auto', flex: 1 },
  status: {
    textAlign: 'center', opacity: 0.4, padding: '6vw', fontSize: '3vw',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '3vw',
    padding: '2.5vw 4vw',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
  },
  rowActive: { background: 'var(--amber-faint)' },
  cover: {
    width: '9vw', height: '9vw', borderRadius: '1vw',
    objectFit: 'cover', flexShrink: 0,
  },
  info: { flex: 1, overflow: 'hidden' },
  epTitle: {
    fontSize: '2.8vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  epMeta: {
    fontSize: '2vw', opacity: 0.4, marginTop: '0.8vw',
  },
  check: { fontSize: '3vw', opacity: 0.7, flexShrink: 0 },
}
