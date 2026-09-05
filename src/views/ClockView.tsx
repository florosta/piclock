import { useEffect, useState } from 'react'
import type { PlayerState } from '../hooks/usePlayer'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function pad(n: number) { return String(n).padStart(2, '0') }
function fmtTimer(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

interface Props {
  player: PlayerState
  onShowPicker: () => void
}

export default function ClockView({ player, onShowPicker }: Props) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const { currentEpisode, playing, progress, sleepTimer, play, stop, skip, setSleepTimer } = player

  function handlePlaySleep() {
    play()
    setSleepTimer(15)
  }

  return (
    <div style={s.root}>

      {/* Clock */}
      <div style={s.clockSection}>
        <div style={s.time}>{pad(now.getHours())}:{pad(now.getMinutes())}</div>
        <div style={s.date}>
          {DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]}
        </div>
      </div>

      {/* Divider */}
      <div style={s.divider} />

      {/* Podcast section */}
      <div style={s.podcastSection}>

        {/* Episode info */}
        <div style={s.episodeInfo}>
          {currentEpisode ? (
            <>
              <div style={s.episodeTitle}>{currentEpisode.title}</div>
              <div style={s.podcastName}>{currentEpisode.podcast.title}</div>
            </>
          ) : (
            <div style={s.podcastName}>Loading…</div>
          )}
        </div>

        {/* Progress bar */}
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
        </div>

        {/* Controls */}
        <div style={s.controls}>
          <Btn onClick={() => skip(-20)} disabled={!currentEpisode}>← 20s</Btn>
          <Btn onClick={handlePlaySleep} disabled={!currentEpisode} primary>
            {playing ? `▶ ${sleepTimer !== null ? fmtTimer(sleepTimer) : '15m'}` : '▶ Sleep 15m'}
          </Btn>
          <Btn onClick={stop} disabled={!playing}>■ Stop</Btn>
          <Btn onClick={onShowPicker}>≡</Btn>
        </div>

      </div>
    </div>
  )
}

function Btn({ children, onClick, disabled, primary }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      style={{
        ...s.btn,
        ...(primary ? s.btnPrimary : {}),
        ...(disabled ? s.btnDisabled : {}),
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
  },
  clockSection: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  time: {
    fontSize: '22vw', fontWeight: 200,
    letterSpacing: '-0.02em', lineHeight: 1,
    textShadow: '0 0 60px rgba(232, 201, 122, 0.25)',
  },
  date: {
    fontSize: '3.5vw', opacity: 0.35,
    marginTop: '2vw', letterSpacing: '0.25em', textTransform: 'uppercase',
  },
  divider: {
    height: '1px', background: 'var(--border)', flexShrink: 0,
  },
  podcastSection: {
    flexShrink: 0,
    padding: '3vw 5vw 4vw',
    display: 'flex', flexDirection: 'column', gap: '2.5vw',
  },
  episodeInfo: {
    display: 'flex', flexDirection: 'column', gap: '0.8vw',
  },
  episodeTitle: {
    fontSize: '3vw', lineHeight: 1.2,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  podcastName: {
    fontSize: '2vw', opacity: 0.4, letterSpacing: '0.05em',
  },
  progressBar: {
    height: '2px', background: 'var(--border)',
    borderRadius: '1px', position: 'relative',
  },
  progressFill: {
    position: 'absolute', top: 0, left: 0, height: '100%',
    background: 'var(--amber-dim)', borderRadius: '1px',
    transition: 'width 1s linear',
  },
  controls: {
    display: 'flex', gap: '2vw', alignItems: 'center',
  },
  btn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--amber)',
    fontFamily: 'var(--font)',
    fontSize: '2.8vw',
    padding: '1.5vw 3vw',
    borderRadius: '1vw',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    opacity: 0.75,
    whiteSpace: 'nowrap',
  },
  btnPrimary: {
    flex: 1,
    opacity: 1,
    background: 'var(--amber-faint)',
    border: '1px solid var(--amber-dim)',
    fontSize: '3.2vw',
  },
  btnDisabled: {
    opacity: 0.2,
    cursor: 'default',
  },
}
