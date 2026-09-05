import { useEffect, useState } from 'react'
import type { Episode } from '../types'

interface Props {
  episode: Episode | null
  playing: boolean
  onToggle: () => void
  onSkip: (seconds: number) => void
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export default function Player({ episode, playing, onToggle, onSkip, audioRef }: Props) {
  const [progress, setProgress] = useState(0)   // 0–1
  const [elapsed, setElapsed] = useState(0)      // seconds

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const update = () => {
      if (el.duration) {
        setProgress(el.currentTime / el.duration)
        setElapsed(el.currentTime)
      }
    }
    el.addEventListener('timeupdate', update)
    return () => el.removeEventListener('timeupdate', update)
  }, [audioRef, episode])

  // reset on episode change
  useEffect(() => { setProgress(0); setElapsed(0) }, [episode?.id])

  function scrub(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current
    if (!el || !el.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = ratio * el.duration
  }

  if (!episode) return null

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${m}:${String(ss).padStart(2, '0')}`
  }

  return (
    <div style={styles.root}>
      <div style={styles.info}>
        <img
          style={styles.cover}
          src={episode.podcast.coverUrl}
          alt=""
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div style={styles.titleWrap}>
          <div style={styles.title}>{episode.title}</div>
          <div style={styles.podcast}>{episode.podcast.title}</div>
        </div>
      </div>

      <div style={styles.progressRow}>
        <span style={styles.time}>{fmt(elapsed)}</span>
        <div style={styles.bar} onClick={scrub}>
          <div style={{ ...styles.fill, width: `${progress * 100}%` }} />
        </div>
        <span style={styles.time}>{fmt(episode.duration)}</span>
      </div>

      <div style={styles.controls}>
        <button style={styles.btn} onClick={() => onSkip(-30)}>−30s</button>
        <button style={{ ...styles.btn, ...styles.playBtn }} onClick={onToggle}>
          {playing ? '⏸' : '▶'}
        </button>
        <button style={styles.btn} onClick={() => onSkip(30)}>+30s</button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    flexShrink: 0,
    borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
    padding: '2.5vw 4vw',
    display: 'flex', flexDirection: 'column', gap: '2vw',
  },
  info: {
    display: 'flex', alignItems: 'center', gap: '2.5vw',
  },
  cover: {
    width: '8vw', height: '8vw', borderRadius: '1vw', objectFit: 'cover', flexShrink: 0,
  },
  titleWrap: { flex: 1, overflow: 'hidden' },
  title: {
    fontSize: '2.5vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  podcast: {
    fontSize: '1.8vw', opacity: 0.4, marginTop: '0.5vw',
  },
  progressRow: {
    display: 'flex', alignItems: 'center', gap: '2vw',
  },
  time: { fontSize: '1.8vw', opacity: 0.4, flexShrink: 0 },
  bar: {
    flex: 1, height: '0.6vw', background: 'var(--border)',
    borderRadius: '0.3vw', cursor: 'pointer', position: 'relative',
  },
  fill: {
    position: 'absolute', top: 0, left: 0, height: '100%',
    background: 'var(--amber-dim)', borderRadius: '0.3vw',
  },
  controls: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6vw',
  },
  btn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '3vw', cursor: 'pointer', fontFamily: 'var(--font)',
    opacity: 0.7, letterSpacing: '0.05em',
  },
  playBtn: {
    fontSize: '5vw', opacity: 1,
  },
}
