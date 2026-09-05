import { useEffect, useState } from 'react'
import type { Episode } from '../types'
import Player from '../components/Player'

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(ms: number) {
  const d = new Date(ms)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface Props {
  onClose: () => void
  currentEpisode: Episode | null
  playing: boolean
  onPlay: (ep: Episode) => void
  onToggle: () => void
  onSkip: (seconds: number) => void
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export default function PodcastView({ onClose, currentEpisode, playing, onPlay, onToggle, onSkip, audioRef }: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/episodes')
      .then(r => r.json())
      .then(data => { setEpisodes(data); setLoading(false) })
      .catch(() => { setError('Failed to load episodes'); setLoading(false) })
  }, [])

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onClose}>← Clock</button>
        <span style={styles.headerTitle}>Podcasts</span>
      </div>

      <div style={styles.list}>
        {loading && <div style={styles.status}>Loading…</div>}
        {error && <div style={styles.status}>{error}</div>}
        {episodes.map(ep => (
          <div
            key={ep.id}
            style={{
              ...styles.episode,
              ...(currentEpisode?.id === ep.id ? styles.episodeActive : {}),
            }}
            onClick={() => onPlay(ep)}
          >
            <img
              style={styles.cover}
              src={ep.podcast.coverUrl}
              alt=""
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div style={styles.epInfo}>
              <div style={styles.epTitle}>{ep.title}</div>
              <div style={styles.epMeta}>
                {ep.podcast.title} · {formatDate(ep.publishedAt)} · {formatDuration(ep.duration)}
              </div>
            </div>
            {currentEpisode?.id === ep.id && (
              <span style={styles.playingDot}>{playing ? '▶' : '⏸'}</span>
            )}
          </div>
        ))}
      </div>

      <Player
        episode={currentEpisode}
        playing={playing}
        onToggle={onToggle}
        onSkip={onSkip}
        audioRef={audioRef}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '2vw',
    padding: '3vw 4vw 2vw',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--amber-dim)',
    fontSize: '3vw', cursor: 'pointer', fontFamily: 'var(--font)',
    letterSpacing: '0.05em',
  },
  headerTitle: {
    fontSize: '3vw', letterSpacing: '0.2em', textTransform: 'uppercase',
    opacity: 0.5,
  },
  list: {
    flex: 1, overflowY: 'auto', padding: '2vw 0',
  },
  status: {
    textAlign: 'center', opacity: 0.4, padding: '8vw', fontSize: '3vw',
    letterSpacing: '0.1em',
  },
  episode: {
    display: 'flex', alignItems: 'center', gap: '3vw',
    padding: '2.5vw 4vw',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  episodeActive: {
    background: 'var(--amber-faint)',
  },
  cover: {
    width: '10vw', height: '10vw', borderRadius: '1vw',
    objectFit: 'cover', flexShrink: 0,
  },
  epInfo: {
    flex: 1, overflow: 'hidden',
  },
  epTitle: {
    fontSize: '2.8vw', lineHeight: 1.3,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  epMeta: {
    fontSize: '2vw', opacity: 0.4, marginTop: '0.8vw',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  playingDot: {
    fontSize: '3vw', opacity: 0.8, flexShrink: 0,
  },
}
