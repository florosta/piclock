import { useCallback, useEffect, useRef, useState } from 'react'
import { iconFor, valueFor } from '../config/ha'
import type { EntityConfig } from '../config/ha'
import type { HAState } from '../hooks/useHA'
import type { PlayerState } from '../hooks/usePlayer'
import type { Alarm } from '../types'
import Icon from '../ui/Icon'
import type { IconName } from '../ui/Icon'
import Touchable from '../ui/Touchable'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function pad(n: number) { return String(n).padStart(2, '0') }
function fmtTimer(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export interface ClockEntity {
  config: EntityConfig
  state: HAState | null
}

interface Props {
  player: PlayerState
  nextAlarm: Alarm | null
  /** Entities flagged `clock: true` in config/ha.ts — weather and outdoor temp. */
  clockEntities: ClockEntity[]
  onShowPicker: () => void
  onShowAlarms: () => void
  onShowHA: () => void
}

export default function ClockView({
  player, nextAlarm, clockEntities, onShowPicker, onShowAlarms, onShowHA,
}: Props) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    // 1s interval: negligible cost, ensures the display is never more than 1s stale
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { currentEpisode, playing, progress, sleepTimer, play, stop, skip, setSleepTimer, cancelSleepTimer } = player

  const [volume, setVolume] = useState(50)
  const [volumeShown, setVolumeShown] = useState(false)
  const volumeHide = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/volume').then(r => r.json()).then(({ value }) => setVolume(value)).catch(() => {})
    return () => { if (volumeHide.current) clearTimeout(volumeHide.current) }
  }, [])

  const adjustVolume = useCallback((delta: number) => {
    setVolume(prev => {
      const next = Math.max(0, Math.min(100, prev + delta))
      fetch('/api/volume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: next }) })
      return next
    })
    // The buttons are icons, so the level itself has to show somewhere:
    // it surfaces in the strip for a moment after each press.
    setVolumeShown(true)
    if (volumeHide.current) clearTimeout(volumeHide.current)
    volumeHide.current = setTimeout(() => setVolumeShown(false), 1600)
  }, [])

  // Pressing play always arms a 15-min sleep timer — intentional bedtime UX.
  // At rest the button is a play mark; once the timer is running it becomes a
  // moon over the countdown, which is the one place text is allowed in the bar.
  const timerRunning = sleepTimer !== null

  return (
    <div style={s.root}>

      <div style={s.clock}>
        {/* Conditions and date sit above the numerals: read the room first,
            then the time, which is the thing your eye lands on anyway. */}
        <div style={s.above}>
          {clockEntities.map(({ config, state }) => (
            <span key={config.id} style={s.aboveItem}>
              <Icon name={iconFor(config, state?.state ?? 'unavailable')} />
              {valueFor(config, state?.state ?? 'unavailable', state?.attributes ?? {})}
            </span>
          ))}
          <span style={s.aboveItem}>
            {DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]}
          </span>
        </div>

        <div style={s.time}>{pad(now.getHours())}:{pad(now.getMinutes())}</div>
      </div>

      <div style={s.strip}>
        <div style={s.meta}>
          <div style={s.episodeName}>{currentEpisode?.title ?? ''}</div>
          <div style={s.metaRight}>
            {volumeShown && (
              <span style={s.metaItem}>
                <Icon name="volumeUp" /> {volume}%
              </span>
            )}
            {nextAlarm && (
              <span style={s.metaItem}>
                <Icon name="alarm" /> {nextAlarm.time}
              </span>
            )}
          </div>
        </div>

        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
        </div>

        <div style={s.btnRow}>
          <Key icon="rewind" label="Back 20 seconds" onClick={() => skip(-20)} disabled={!currentEpisode} repeat />

          <Key
            icon="play"
            label={timerRunning ? `Playing, sleep timer ${fmtTimer(sleepTimer)}` : 'Play'}
            onClick={() => { play(); setSleepTimer(15) }}
            disabled={!currentEpisode}
            active={playing}
          >
            {timerRunning ? (
              <span style={s.countdown}>
                <Icon name="moon" size="0.55em" />
                <span style={s.countdownText}>{fmtTimer(sleepTimer)}</span>
              </span>
            ) : null}
          </Key>

          <Key icon="stop" label="Stop" onClick={() => { stop(); cancelSleepTimer() }} disabled={!playing} />
          <Key icon="volumeDown" label="Volume down" onClick={() => adjustVolume(-5)} disabled={volume <= 0} repeat />
          <Key icon="volumeUp" label="Volume up" onClick={() => adjustVolume(5)} disabled={volume >= 100} repeat />
          <Key icon="list" label="Episodes" onClick={onShowPicker} />
          <Key icon="alarm" label="Alarms" onClick={onShowAlarms} active={!!nextAlarm} />
          <Key icon="home" label="House" onClick={onShowHA} />
        </div>
      </div>

    </div>
  )
}

/**
 * One key in the bottom row. All eight are the same square, sized by flex, so
 * the row divides the screen evenly whatever the display width — and every
 * target is comfortably larger than a fingertip.
 */
function Key({ icon, label, onClick, disabled, active, repeat, children }: {
  icon: IconName
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  repeat?: boolean
  children?: React.ReactNode
}) {
  return (
    <Touchable
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      active={active}
      repeat={repeat}
      style={s.key}
    >
      {children ?? <Icon name={icon} />}
    </Touchable>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
  },
  clock: {
    flex: 1, minHeight: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 'var(--s-2)',
  },
  above: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-4)',
    fontSize: 'var(--t-sm)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-wide)',
    textTransform: 'uppercase',
  },
  aboveItem: {
    display: 'flex', alignItems: 'center', gap: '0.7vw',
    fontVariantNumeric: 'tabular-nums',
  },
  time: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--t-display)', fontWeight: 200,
    letterSpacing: 'var(--track-display)',
    marginRight: 'calc(var(--track-display) * -1)',
    lineHeight: 1,
    textShadow: '0 0 60px rgba(232,201,122,0.2)',
  },
  strip: {
    flexShrink: 0,
    padding: 'var(--s-2) var(--s-4) var(--s-4)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-2)',
  },
  meta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    minHeight: 'var(--t-sm)',
  },
  episodeName: {
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-label)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    flex: 1,
  },
  metaRight: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
    flexShrink: 0, marginLeft: 'var(--s-3)',
  },
  metaItem: {
    display: 'flex', alignItems: 'center', gap: '0.6vw',
    fontVariantNumeric: 'tabular-nums',
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-secondary)',
    letterSpacing: 'var(--track-label)',
  },
  progressBar: {
    height: '0.3vw', background: 'var(--surface-track)',
    borderRadius: '999px', position: 'relative', overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute', inset: '0 auto 0 0',
    background: 'var(--amber-dim)', borderRadius: '999px',
    transition: 'width 1s linear',
  },
  btnRow: { display: 'flex', gap: 'var(--s-2)' },
  key: {
    flex: 1, aspectRatio: '1',
    fontSize: 'var(--t-lg)',
    flexDirection: 'column',
    gap: '0.4vw',
  },
  countdown: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.5vw',
  },
  countdownText: {
    fontSize: 'var(--t-sm)',
    letterSpacing: '0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
}
