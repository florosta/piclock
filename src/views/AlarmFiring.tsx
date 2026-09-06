import type { Alarm } from '../types'

interface Props {
  alarm: Alarm
  onDismiss: () => void
  onSnooze: () => void
}

export default function AlarmFiring({ alarm, onDismiss, onSnooze }: Props) {
  return (
    <div style={s.root}>
      <div style={s.icon}>⏰</div>
      <div style={s.time}>{alarm.time || 'Alarm'}</div>
      {alarm.label && <div style={s.label}>{alarm.label}</div>}
      <div style={s.btns}>
        <button style={s.snoozeBtn} onClick={onSnooze}>Snooze 9m</button>
        <button style={s.dismissBtn} onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed', inset: 0, zIndex: 20,
    background: 'var(--bg)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '4vw',
  },
  icon: { fontSize: '10vw' },
  time: {
    fontSize: '18vw', fontWeight: 200, letterSpacing: '-0.02em', lineHeight: 1,
    color: 'var(--amber)',
    textShadow: '0 0 80px rgba(232,201,122,0.4)',
  },
  label: { fontSize: '4vw', opacity: 0.5, letterSpacing: '0.1em' },
  btns: { display: 'flex', gap: '4vw', marginTop: '2vw' },
  snoozeBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--amber)',
    fontFamily: 'var(--font)', fontSize: '3.5vw', padding: '2vw 5vw',
    borderRadius: '1.5vw', cursor: 'pointer', opacity: 0.7,
  },
  dismissBtn: {
    background: 'var(--amber-faint)', border: '1px solid var(--amber-dim)', color: 'var(--amber)',
    fontFamily: 'var(--font)', fontSize: '3.5vw', padding: '2vw 5vw',
    borderRadius: '1.5vw', cursor: 'pointer',
  },
}
