import type { EpisodesState } from '../hooks/useEpisodes'
import type { Episode } from '../types'
import Icon from '../ui/Icon'
import Sheet from '../ui/Sheet'
import { s as sheet } from '../ui/styles'
import Touchable from '../ui/Touchable'

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
    <Sheet title="Episodes" onClose={onClose}>
      {/* Rows are separated by the gap between raised fills, not by rules. */}
      <div className="scroll" style={s.list}>
        {loading && <div style={sheet.status}>Loading…</div>}
        {error && <div style={sheet.status}>{error}</div>}

        {list.map((ep: Episode) => {
          const current = currentEpisode?.id === ep.id
          return (
            <Touchable
              key={ep.id}
              onClick={() => onSelect(ep)}
              active={current}
              style={s.row}
            >
              <img
                style={s.cover}
                src={ep.podcast.coverUrl}
                alt=""
                onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
              />
              <div style={s.info}>
                <div style={s.epTitle}>{ep.title}</div>
                <div style={s.epMeta}>
                  {formatDate(ep.publishedAt)} · {formatDuration(ep.duration)}
                </div>
              </div>
              <span style={{ ...s.check, opacity: current ? 'var(--o-primary)' : 0 }}>
                <Icon name="check" />
              </span>
            </Touchable>
          )
        })}
      </div>
    </Sheet>
  )
}

const s: Record<string, React.CSSProperties> = {
  list: {
    flex: 1, minHeight: 0,
    padding: '0 var(--s-4) var(--s-4)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
  },
  row: {
    width: '100%', flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
    padding: 'var(--s-2) var(--s-3)',
    borderRadius: 'var(--r-md)',
    textAlign: 'left',
    opacity: 1,
  },
  cover: {
    width: '10vw', height: '10vw', borderRadius: 'var(--r-sm)',
    objectFit: 'cover', flexShrink: 0,
    background: 'var(--surface)',
  },
  info: { flex: 1, overflow: 'hidden', minWidth: 0 },
  epTitle: {
    fontSize: 'var(--t-md)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    textAlign: 'left',
  },
  epMeta: {
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    marginTop: 'var(--s-1)',
    textAlign: 'left',
  },
  check: { fontSize: 'var(--t-lg)', flexShrink: 0, display: 'flex' },
}
