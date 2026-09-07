import { useState } from 'react'
import type { Alarm } from '../types'
import Icon from '../ui/Icon'
import Sheet from '../ui/Sheet'
import { s as sheet } from '../ui/styles'
import Touchable from '../ui/Touchable'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function pad(n: number) { return String(n).padStart(2, '0') }

interface Props {
  alarms: Alarm[]
  onAdd: (data: Omit<Alarm, 'id'>) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function AlarmManager({ alarms, onAdd, onToggle, onDelete, onClose }: Props) {
  const [adding, setAdding] = useState(false)
  const [hour, setHour] = useState(7)
  const [minute, setMinute] = useState(30)
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [newLabel, setNewLabel] = useState('')

  function reset() {
    setAdding(false)
    setHour(7); setMinute(30)
    setNewDays([1, 2, 3, 4, 5])
    setNewLabel('')
  }

  function submitAdd() {
    onAdd({ time: `${pad(hour)}:${pad(minute)}`, days: newDays, label: newLabel, enabled: true })
    reset()
  }

  function toggleDay(d: number) {
    setNewDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  return (
    // On a 720px-tall screen the add form would sit below the list and need
    // scrolling to reach, so it takes the sheet over instead of appending to it.
    <Sheet title={adding ? 'New alarm' : 'Alarms'} onClose={onClose}>
      <div className="scroll" style={s.list}>

        {adding ? (
          <div style={s.addForm}>
            <TimeStepper hour={hour} minute={minute} onHour={setHour} onMinute={setMinute} />

            <div style={s.daysRow}>
              {DAY_LABELS.map((label, d) => (
                <Chip key={d} on={newDays.includes(d)} onClick={() => toggleDay(d)}>{label}</Chip>
              ))}
              <Chip on={newDays.length === 0} onClick={() => setNewDays([])}>1×</Chip>
            </div>

            <input
              type="text"
              placeholder="Label (optional)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              style={s.labelInput}
            />

            <div style={s.addActions}>
              <Touchable onClick={reset} style={s.textBtn}>Cancel</Touchable>
              <Touchable onClick={submitAdd} active style={s.textBtn}>Save</Touchable>
            </div>
          </div>
        ) : (
          <>
            {alarms.map(alarm => (
              <div key={alarm.id} style={s.row}>
                <div style={s.rowLeft}>
                  <div style={{ ...s.alarmTime, opacity: alarm.enabled ? 1 : 'var(--o-tertiary)' }}>
                    {alarm.time}
                  </div>
                  <div style={sheet.label}>
                    {alarm.label || (alarm.days.length === 0 ? 'Once' : alarm.days.map(d => DAY_LABELS[d]).join(' '))}
                  </div>
                </div>
                <div style={s.rowRight}>
                  <Touchable
                    aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
                    onClick={() => onToggle(alarm.id)}
                    style={{ ...s.bareBtn, opacity: alarm.enabled ? 1 : 'var(--o-tertiary)' }}
                  >
                    <Icon name={alarm.enabled ? 'toggleOn' : 'toggleOff'} />
                  </Touchable>
                  <Touchable
                    aria-label="Delete alarm"
                    onClick={() => onDelete(alarm.id)}
                    style={{ ...s.bareBtn, fontSize: 'var(--t-md)', opacity: 'var(--o-tertiary)' }}
                  >
                    <Icon name="trash" />
                  </Touchable>
                </div>
              </div>
            ))}

            <Touchable onClick={() => setAdding(true)} style={s.addBtn}>
              <Icon name="plus" />
              <span>Add alarm</span>
            </Touchable>
          </>
        )}

      </div>
    </Sheet>
  )
}

/**
 * Hours and minutes as two −/+ steppers instead of <input type="time">.
 * The native control expects a keyboard or a mouse-precision spinner; on the
 * Pi it opened a picker sized for a cursor. These are thumb-sized targets that
 * repeat when held, and laid out on one line the whole form fits the sheet
 * without scrolling. Minutes move in fives — nobody sets an alarm for 06:47.
 */
function TimeStepper({ hour, minute, onHour, onMinute }: {
  hour: number
  minute: number
  onHour: (h: number) => void
  onMinute: (m: number) => void
}) {
  return (
    <div style={s.stepper}>
      <Unit
        label="Hours"
        value={pad(hour)}
        onDown={() => onHour((hour + 23) % 24)}
        onUp={() => onHour((hour + 1) % 24)}
      />
      <div style={s.colon}>:</div>
      <Unit
        label="Minutes"
        value={pad(minute)}
        onDown={() => onMinute((minute + 55) % 60)}
        onUp={() => onMinute((minute + 5) % 60)}
      />
    </div>
  )
}

function Unit({ label, value, onUp, onDown }: {
  label: string
  value: string
  onUp: () => void
  onDown: () => void
}) {
  return (
    <div style={s.unit}>
      <Touchable aria-label={`${label} down`} onClick={onDown} repeat style={s.stepBtn}>
        <Icon name="minus" />
      </Touchable>
      <div style={s.stepValue}>{value}</div>
      <Touchable aria-label={`${label} up`} onClick={onUp} repeat style={s.stepBtn}>
        <Icon name="plus" />
      </Touchable>
    </div>
  )
}

function Chip({ on, onClick, children }: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Touchable onClick={onClick} active={on} style={s.chip}>{children}</Touchable>
  )
}

const s: Record<string, React.CSSProperties> = {
  list: {
    flex: 1, minHeight: 0,
    padding: '0 var(--s-4) var(--s-4)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
  },
  // Rows are separated by the gap between raised fills, not by rules.
  row: {
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 'var(--s-2) var(--s-3)',
    borderRadius: 'var(--r-md)',
    background: 'var(--surface-raised)',
  },
  rowLeft: { display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' },
  rowRight: { display: 'flex', alignItems: 'center', gap: 'var(--s-2)' },
  alarmTime: {
    fontSize: 'var(--t-xl)', fontWeight: 200, lineHeight: 1,
    letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
  },
  bareBtn: {
    background: 'none',
    fontSize: 'var(--t-lg)',
    width: '9vw', height: '9vw',
  },

  addForm: {
    display: 'flex', flexDirection: 'column', gap: 'var(--s-2)',
    padding: 'var(--s-2) var(--s-4) var(--s-3)',
    alignItems: 'center',
  },
  stepper: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
  },
  unit: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
  },
  stepBtn: {
    width: '8vw', height: '8vw',
    fontSize: 'var(--t-lg)',
  },
  stepValue: {
    fontSize: 'var(--t-xl)', fontWeight: 200, lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    minWidth: '11vw', textAlign: 'center',
  },
  colon: {
    fontSize: 'var(--t-lg)', fontWeight: 200,
    opacity: 'var(--o-tertiary)',
    padding: '0 var(--s-1)',
  },

  daysRow: { display: 'flex', gap: 'var(--s-1)' },
  chip: {
    minWidth: '7vw', height: '7vw',
    fontSize: 'var(--t-sm)',
    letterSpacing: 'var(--track-label)',
    opacity: 'var(--o-secondary)',
  },
  labelInput: {
    background: 'var(--surface-raised)', border: 'none',
    borderRadius: 'var(--r-md)',
    fontSize: 'var(--t-md)',
    padding: 'var(--s-1) var(--s-3)',
    width: '100%', textAlign: 'center',
  },
  addActions: {
    display: 'flex', gap: 'var(--s-3)', justifyContent: 'center',
    width: '100%',
  },
  textBtn: {
    fontSize: 'var(--t-md)',
    padding: 'var(--s-1) var(--s-5)',
    letterSpacing: 'var(--track-label)',
  },
  addBtn: {
    width: '100%', flexShrink: 0,
    gap: 'var(--s-2)',
    fontSize: 'var(--t-md)',
    padding: 'var(--s-3) var(--s-4)',
    marginTop: 'var(--s-1)',
    opacity: 'var(--o-secondary)',
    letterSpacing: 'var(--track-label)',
  },
}
