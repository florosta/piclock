import { useEffect, useState } from 'react'
import type { PlayerState } from '../hooks/usePlayer'

const SLEEP_PRESETS = [15, 30, 45, 60] // minutes

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

interface Props {
  player: PlayerState
}

export default function Player({ player }: Props) {
  const {
    currentEpisode, playing, progress, elapsed, duration, sleepTimer,
    togglePlayPause, skip, seekTo, setSleepTimer, cancelSleepTimer,
  } = player

  // Which sleep preset index is currently set (UI state only)
  const [presetIdx, setPresetIdx] = useState(-1)

  // Keep preset index in sync if timer was cancelled externally
  useEffect(() => { if (sleepTimer === null) setPresetIdx(-1) }, [sleepTimer])

  function handleSleepTap() {
    if (sleepTimer === null) {
      setPresetIdx(0)
      setSleepTimer(SLEEP_PRESETS[0])
    } else {
      const next = presetIdx + 1
      if (next < SLEEP_PRESETS.length) {
        setPresetIdx(next)
        setSleepTimer(SLEEP_PRESETS[next])
      } else {
        cancelSleepTimer()
      }
    }
  }

  function scrub(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    seekTo(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }

  const sleepLabel = sleepTimer !== null
    ? `${SLEEP_PRESETS[presetIdx]}m · ${fmtTime(sleepTimer)}`
    : 'Sleep'

  if (!currentEpisode) return null

  return (
    <div style={styles.root}>
      <div style={styles.info}>
        <img
          style={styles.cover}
          src={currentEpisode.podcast.coverUrl}
          alt=""
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div style={styles.titleWrap}>
          <div style={styles.title}>{currentEpisode.title}</div>
          <div style={styles.podcast}>{currentEpisode.podcast.title}</div>
        </div>
      </div>

      <div style={styles.progressRow}>
        <span style={styles.time}>{fmtTime(elapsed)}</span>
        <div style={styles.bar} onClick={scrub}>
          <div style={{ ...styles.fill, width: `${progress * 100}%` }} />
        </div>
        <span style={styles.time}>{fmtTime(duration)}</span>
      </div>

      <div style={styles.controls}>
        <button
          style={{ ...styles.btn, ...(sleepTimer !== null ? styles.btnActive : {}) }}
          onClick={handleSleepTap}
        >
          {sleepLabel}
        </button>
        <button style={styles.btn} onClick={() => skip(-30)}>−30s</button>
        <button style={{ ...styles.btn, ...styles.playBtn }} onClick={togglePlayPause}>
          {playing ? '⏸' : '▶'}
        </button>
        <button style={styles.btn} onClick={() => skip(30)}>+30s</button>
        <div style={styles.spacer} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    flexShrink: 0, borderTop: '1px solid var(--border)',
    background: 'var(--surface)', padding: '2.5vw 4vw',
    display: 'flex', flexDirection: 'column', gap: '2vw',
  },
  info: { display: 'flex', alignItems: 'center', gap: '2.5vw' },
  cover: { width: '8vw', height: '8vw', borderRadius: '1vw', objectFit: 'cover', flexShrink: 0 },
  titleWrap: { flex: 1, overflow: 'hidden' },
  title: { fontSize: '2.5vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  podcast: { fontSize: '1.8vw', opacity: 0.4, marginTop: '0.5vw' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '2vw' },
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
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4vw',
  },
  spacer: { width: '8vw' }, // balances the sleep button on the left
  btn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '2.2vw', cursor: 'pointer', fontFamily: 'var(--font)',
    opacity: 0.6, letterSpacing: '0.05em', whiteSpace: 'nowrap',
  },
  btnActive: { opacity: 1, color: 'var(--amber)' },
  playBtn: { fontSize: '5vw', opacity: 1 },
}
