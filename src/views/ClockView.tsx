import { useEffect, useRef, useState } from 'react'
import { iconFor, valueFor } from '../config/ha'
import type { EntityConfig } from '../config/ha'
import type { HAState } from '../hooks/useHA'
import type { PlayerState } from '../hooks/usePlayer'
import type { VolumeState } from '../hooks/useVolume'
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
  volume: VolumeState
  nextAlarm: Alarm | null
  /** Entities flagged `clock: true` in config/ha.ts — weather and outdoor temp. */
  clockEntities: ClockEntity[]
  onShowPicker: () => void
  onShowAlarms: () => void
  onShowHA: () => void
  onShowVolume: () => void
  onShowSettings: () => void
}

export default function ClockView({
  player, volume, nextAlarm, clockEntities, onShowPicker, onShowAlarms, onShowHA, onShowVolume, onShowSettings,
}: Props) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    // 1s interval: negligible cost, ensures the display is never more than 1s stale
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { currentEpisode, playing, progress, sleepTimer, play, stop, skip, seekTo, setSleepTimer, cancelSleepTimer } = player

  const scrubbing = useRef(false)
  const [scrubRatio, setScrubRatio] = useState<number | null>(null)

  function ratioFromPointer(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  function onScrubDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!currentEpisode) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    scrubbing.current = true
    setScrubRatio(ratioFromPointer(e))
  }

  function onScrubMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbing.current) return
    setScrubRatio(ratioFromPointer(e))
  }

  function onScrubUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbing.current) return
    scrubbing.current = false
    const ratio = ratioFromPointer(e)
    setScrubRatio(null)
    seekTo(ratio)
  }

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
          <Touchable style={s.settingsBtn} onClick={onShowSettings} aria-label="Settings">
            <Icon name="settings" />
          </Touchable>
        </div>

        <div style={s.time}>{pad(now.getHours())}:{pad(now.getMinutes())}</div>
      </div>

      <div style={s.strip}>
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

          {/* One volume key rather than two: it carries the level, and opens a
              slider you can throw to the value you want in a single drag. */}
          <Key
            icon="volumeUp"
            label={`Volume ${volume.value}%`}
            onClick={onShowVolume}
          >
            <span style={s.stack}>
              <Icon name={volume.value === 0 ? 'volumeDown' : 'volumeUp'} size="0.7em" />
              <span style={s.stackText}>{volume.value}%</span>
            </span>
          </Key>

          <Key icon="list" label="Episodes" onClick={onShowPicker} />
          {/* The key is the indicator: lit when an alarm is set, and carrying
              the time it will go off. */}
          <Key
            icon="alarm"
            label={nextAlarm ? `Alarms, next at ${nextAlarm.time}` : 'Alarms'}
            onClick={onShowAlarms}
            active={!!nextAlarm}
          >
            {nextAlarm ? (
              <span style={s.stack}>
                <Icon name="alarm" size="0.7em" />
                <span style={s.stackText}>{nextAlarm.time}</span>
              </span>
            ) : null}
          </Key>
          <Key icon="home" label="House" onClick={onShowHA} />
        </div>

        <div style={s.nowPlaying}>{currentEpisode?.title ?? ''}</div>
      </div>

      {/* Full bleed on the very bottom edge, with no track behind it: at rest
          there is nothing to see, and playing draws a bar across the foot of
          the screen. The paddingTop extends the hit area without changing the
          visual strip height. */}
      <div
        style={{ ...s.progressBar, cursor: currentEpisode ? 'pointer' : undefined }}
        onPointerDown={onScrubDown}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubUp}
        onPointerCancel={onScrubUp}
      >
        <div style={s.progressTrack}>
          <div style={{
            ...s.progressFill,
            width: `${(scrubRatio ?? progress) * 100}%`,
            transition: scrubbing.current ? 'none' : 'width 1s linear',
          }} />
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
  settingsBtn: {
    position: 'absolute', right: 0,
    width: '5vw', height: '5vw',
    fontSize: 'var(--t-sm)',
    opacity: 'var(--o-disabled)',
  },
  clock: {
    flex: 1, minHeight: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 'var(--s-2)',
  },
  above: {
    position: 'relative',
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-4)',
    fontSize: 'var(--t-md)',
    opacity: 'var(--o-primary)',
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
    position: 'relative',
    flexShrink: 0,
    padding: 'var(--s-2) var(--s-4) var(--s-2)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-2)',
  },
  nowPlaying: {
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-label)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    textAlign: 'center',
    minHeight: 'var(--t-sm)',
  },
  progressBar: {
    flexShrink: 0,
    paddingTop: '2vw',
    background: 'transparent',
  },
  progressTrack: {
    height: '0.7vw',
    position: 'relative', overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute', inset: '0 auto 0 0',
    background: 'var(--amber-dim)',
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
  stack: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.5vw',
  },
  stackText: {
    fontSize: 'var(--t-sm)',
    fontVariantNumeric: 'tabular-nums',
  },

}
