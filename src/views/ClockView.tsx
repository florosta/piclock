import { useEffect, useState } from 'react'
import type { PlayerState } from '../hooks/usePlayer'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function pad(n: number) { return String(n).padStart(2, '0') }

interface Props {
  player: PlayerState
  onOpenPodcasts: () => void
}

export default function ClockView({ player, onOpenPodcasts }: Props) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const { currentEpisode, playing, togglePlayPause } = player

  return (
    <div style={styles.root} onClick={onOpenPodcasts}>
      <div style={styles.time}>{pad(now.getHours())}:{pad(now.getMinutes())}</div>
      <div style={styles.date}>
        {DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]}
      </div>

      {currentEpisode ? (
        <div style={styles.miniPlayer} onClick={e => e.stopPropagation()}>
          <span style={styles.miniTitle} onClick={onOpenPodcasts}>
            {currentEpisode.title}
          </span>
          <button style={styles.miniBtn} onClick={togglePlayPause}>
            {playing ? '⏸' : '▶'}
          </button>
        </div>
      ) : (
        <div style={styles.hint}>tap to open podcasts</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative',
  },
  time: {
    fontSize: '22vw', fontWeight: 200,
    letterSpacing: '-0.02em', lineHeight: 1,
    textShadow: '0 0 40px rgba(232, 201, 122, 0.3)',
  },
  date: {
    fontSize: '4vw', opacity: 0.4,
    marginTop: '3vw', letterSpacing: '0.2em', textTransform: 'uppercase',
  },
  hint: {
    fontSize: '2vw', opacity: 0.2, marginTop: '4vw', letterSpacing: '0.15em',
  },
  miniPlayer: {
    position: 'absolute', bottom: '4vw',
    display: 'flex', alignItems: 'center', gap: '1.5vw',
    background: 'rgba(232, 201, 122, 0.08)',
    border: '1px solid rgba(232, 201, 122, 0.2)',
    borderRadius: '2vw', padding: '1.5vw 2.5vw', maxWidth: '80vw',
  },
  miniTitle: {
    fontSize: '2.2vw', opacity: 0.7,
    overflow: 'hidden', textOverflow: 'ellipsis',
    whiteSpace: 'nowrap', maxWidth: '55vw', cursor: 'pointer',
  },
  miniBtn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '3vw', cursor: 'pointer', lineHeight: 1, padding: '0.5vw',
  },
}
