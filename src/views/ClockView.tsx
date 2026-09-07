import { useCallback, useEffect, useRef, useState } from 'react'
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
}

export default function ClockView({
  player, volume, nextAlarm, clockEntities, onShowPicker, onShowAlarms, onShowHA,
}: Props) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    // 1s interval: negligible cost, ensures the display is never more than 1s stale
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { currentEpisode, playing, progress, sleepTimer, play, stop, skip, setSleepTimer, cancelSleepTimer } = player

  const [volumeOpen, setVolumeOpen] = useState(false)

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

      {volumeOpen && <div style={s.dismiss} onPointerDown={() => setVolumeOpen(false)} />}

      <div style={s.strip}>
        {volumeOpen && (
          <VolumePopover volume={volume} onDone={() => setVolumeOpen(false)} />
        )}

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
            onClick={() => setVolumeOpen(o => !o)}
            active={volumeOpen}
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
          the screen. */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
      </div>

    </div>
  )
}

/**
 * A slider you drag straight to the value, rather than a pair of keys you press
 * eight times. Pointer-driven rather than <input type="range">: the native
 * control wants a thumb hit exactly, this takes a press anywhere on the track,
 * which is the difference between usable and not with a thumb in the dark.
 *
 * Closes itself after a few seconds of stillness so it never sits over the clock.
 */
function VolumePopover({ volume, onDone }: { volume: VolumeState; onDone: () => void }) {
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bump = useCallback(() => {
    if (idle.current) clearTimeout(idle.current)
    idle.current = setTimeout(onDone, 4000)
  }, [onDone])

  const setFromX = useCallback((clientX: number) => {
    const node = track.current
    if (!node) return
    const r = node.getBoundingClientRect()
    volume.set(((clientX - r.left) / r.width) * 100)
    bump()
  }, [volume, bump])

  useEffect(() => {
    bump()
    function move(e: PointerEvent) { if (dragging.current) setFromX(e.clientX) }
    function up() { dragging.current = false }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      if (idle.current) clearTimeout(idle.current)
    }
  }, [bump, setFromX])

  return (
    <div style={s.popover} onPointerDown={e => e.stopPropagation()}>
      <div style={s.popoverHead}>
        <Icon name={volume.value === 0 ? 'volumeDown' : 'volumeUp'} />
        <span style={s.popoverValue}>{volume.value}%</span>
        {!volume.systemVolume && <span style={s.popoverNote}>app only</span>}
      </div>
      <div
        ref={track}
        style={s.track}
        onPointerDown={e => { dragging.current = true; setFromX(e.clientX) }}
      >
        <div style={s.trackBase} />
        <div style={{ ...s.trackFill, width: `${volume.value}%` }} />
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
    height: '0.7vw', background: 'transparent',
    position: 'relative', overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute', inset: '0 auto 0 0',
    background: 'var(--amber-dim)',
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
  stack: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.5vw',
  },
  stackText: {
    fontSize: 'var(--t-sm)',
    fontVariantNumeric: 'tabular-nums',
  },

  // Catches a press anywhere else on screen so the popover dismisses.
  dismiss: { position: 'fixed', inset: 0, zIndex: 4 },
  popover: {
    position: 'absolute', zIndex: 5,
    left: '50%', transform: 'translateX(-50%)',
    bottom: 'calc(100% - var(--s-2))',
    width: '52vw',
    background: 'var(--surface)',
    borderRadius: 'var(--r-lg)',
    padding: 'var(--s-3)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
    boxShadow: '0 -1vw 4vw rgba(0,0,0,0.6)',
  },
  popoverHead: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-md)',
  },
  popoverValue: {
    fontSize: 'var(--t-lg)', fontWeight: 200, lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  popoverNote: {
    marginLeft: 'auto',
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-label)',
    textTransform: 'uppercase',
  },
  // A tall press target with a slim track drawn inside it: the whole band
  // takes the press, the visible bar just shows where you landed.
  track: {
    height: '7vw',
    display: 'flex', alignItems: 'center',
    position: 'relative',
    touchAction: 'none',
  },
  trackBase: {
    position: 'absolute', inset: 'auto 0', top: '50%',
    transform: 'translateY(-50%)',
    height: '2.4vw',
    background: 'var(--surface-raised)',
    borderRadius: '999px',
    pointerEvents: 'none',
  },
  trackFill: {
    position: 'absolute', left: 0, top: '50%',
    transform: 'translateY(-50%)',
    height: '2.4vw',
    background: 'var(--amber-dim)',
    borderRadius: '999px',
    pointerEvents: 'none',
  },
}
