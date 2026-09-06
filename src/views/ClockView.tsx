import { useEffect, useState } from 'react'
import type { PlayerState } from '../hooks/usePlayer'
import type { Alarm } from '../types'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function pad(n: number) { return String(n).padStart(2, '0') }
function fmtTimer(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface Props {
  player: PlayerState
  nextAlarm: Alarm | null
  onShowPicker: () => void
  onShowAlarms: () => void
}

export default function ClockView({ player, nextAlarm, onShowPicker, onShowAlarms }: Props) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    // 1s interval: negligible cost, ensures the display is never more than 1s stale
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { currentEpisode, playing, progress, sleepTimer, play, stop, skip, setSleepTimer } = player

  // Pressing play always arms a 15-min sleep timer — intentional bedtime UX.
  // At rest the icon is ▶; once the timer is running it shows the countdown.
  const playIcon = sleepTimer !== null ? `☽ ${fmtTimer(sleepTimer)}` : '▶'

  return (
    <div style={s.root}>

      <div style={s.clock}>
        <div style={s.time}>{pad(now.getHours())}:{pad(now.getMinutes())}</div>
        <div style={s.date}>{DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]}</div>
      </div>

      <div style={s.strip}>
        <div style={s.meta}>
          <div style={s.episodeName}>{currentEpisode?.title ?? ''}</div>
          {nextAlarm && (
            <div style={s.nextAlarm}>⏰ {nextAlarm.time}</div>
          )}
        </div>

        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
        </div>

        <div style={s.btnRow}>
          <Sq onClick={() => skip(-20)} disabled={!currentEpisode}>⏪</Sq>
          <Sq onClick={() => { play(); setSleepTimer(15) }} disabled={!currentEpisode} highlight={playing}>
            {playIcon}
          </Sq>
          <Sq onClick={stop} disabled={!playing}>⏹</Sq>
          <Sq onClick={onShowPicker}>☰</Sq>
          <Sq onClick={onShowAlarms} highlight={!!nextAlarm}>⏰</Sq>
        </div>
      </div>

    </div>
  )
}

function Sq({ children, onClick, disabled, highlight }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  highlight?: boolean
}) {
  return (
    <button
      style={{ ...s.btn, ...(highlight ? s.btnOn : {}), ...(disabled ? s.btnOff : {}) }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

const BTN = '9vw'

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
  },
  clock: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  time: {
    fontSize: '24vw', fontWeight: 200,
    letterSpacing: '-0.02em', lineHeight: 1,
    textShadow: '0 0 60px rgba(232,201,122,0.2)',
  },
  date: {
    fontSize: '3vw', opacity: 0.3,
    marginTop: '1.5vw', letterSpacing: '0.3em', textTransform: 'uppercase',
  },
  strip: {
    flexShrink: 0,
    padding: '2vw 3vw 3vw',
    display: 'flex', flexDirection: 'column', gap: '1.5vw',
    borderTop: '1px solid var(--border)',
  },
  meta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  },
  episodeName: {
    fontSize: '1.6vw', opacity: 0.35, letterSpacing: '0.04em',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    flex: 1,
  },
  nextAlarm: {
    fontSize: '1.6vw', opacity: 0.4, letterSpacing: '0.05em',
    flexShrink: 0, marginLeft: '2vw',
  },
  progressBar: {
    height: '2px', background: 'var(--border)', position: 'relative',
  },
  progressFill: {
    position: 'absolute', inset: '0 auto 0 0',
    background: 'var(--amber-dim)', transition: 'width 1s linear',
  },
  btnRow: { display: 'flex', gap: '1.5vw' },
  btn: {
    width: BTN, height: BTN,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--amber)',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '3.5vw',
    borderRadius: '1.2vw',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0.8, flexShrink: 0,
  },
  btnOn: {
    background: 'var(--amber-faint)',
    border: '1px solid var(--amber-dim)',
    opacity: 1,
  },
  btnOff: { opacity: 0.2, cursor: 'default' },
}
