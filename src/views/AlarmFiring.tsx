import type { Alarm } from '../types'
import Icon from '../ui/Icon'
import Touchable from '../ui/Touchable'

interface Props {
  alarm: Alarm
  onDismiss: () => void
  onSnooze: () => void
}

export default function AlarmFiring({ alarm, onDismiss, onSnooze }: Props) {
  return (
    <div style={s.root}>
      <div style={s.icon}><Icon name="alarm" /></div>
      <div style={s.time}>{alarm.time || 'Alarm'}</div>

      {/* Half awake, in the dark: two targets, far apart, impossible to
          confuse — snooze on the left, dismiss lit on the right. */}
      <div style={s.btns}>
        <Touchable onClick={onSnooze} style={s.btn}>
          <Icon name="moon" />
          <span>Snooze 9m</span>
        </Touchable>
        <Touchable onClick={onDismiss} active style={s.btn}>
          <Icon name="close" />
          <span>Dismiss</span>
        </Touchable>
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
    gap: 'var(--s-3)',
  },
  icon: { fontSize: 'var(--t-lg)', opacity: 'var(--o-secondary)' },
  time: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--t-jumbo)', fontWeight: 200,
    letterSpacing: 'var(--track-display)',
    marginRight: 'calc(var(--track-display) * -1)',
    lineHeight: 1,
    color: 'var(--amber)',
    textShadow: '0 0 80px rgba(232,201,122,0.4)',
  },
  btns: { display: 'flex', gap: 'var(--s-5)', marginTop: 'var(--s-4)' },
  btn: {
    gap: 'var(--s-2)',
    fontSize: 'var(--t-md)',
    padding: 'var(--s-3) var(--s-5)',
    letterSpacing: 'var(--track-label)',
  },
}
