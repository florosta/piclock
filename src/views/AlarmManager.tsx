import { useState } from 'react'
import type { Alarm } from '../types'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Props {
  alarms: Alarm[]
  onAdd: (data: Omit<Alarm, 'id'>) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function AlarmManager({ alarms, onAdd, onToggle, onDelete, onClose }: Props) {
  const [adding, setAdding] = useState(false)
  const [newTime, setNewTime] = useState('07:30')
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [newLabel, setNewLabel] = useState('')

  function submitAdd() {
    onAdd({ time: newTime, days: newDays, label: newLabel, enabled: true })
    setAdding(false)
    setNewTime('07:30')
    setNewDays([1, 2, 3, 4, 5])
    setNewLabel('')
  }

  function toggleDay(d: number) {
    setNewDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <span style={s.title}>Alarms</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.list}>
          {alarms.map(alarm => (
            <div key={alarm.id} style={s.row}>
              <div style={s.rowLeft}>
                <div style={{ ...s.alarmTime, opacity: alarm.enabled ? 1 : 0.35 }}>
                  {alarm.time}
                </div>
                <div style={s.alarmMeta}>
                  {alarm.label || (alarm.days.length === 0 ? 'Once' : alarm.days.map(d => DAY_LABELS[d]).join(' '))}
                </div>
              </div>
              <div style={s.rowRight}>
                <button
                  style={{ ...s.toggleBtn, ...(alarm.enabled ? s.toggleOn : {}) }}
                  onClick={() => onToggle(alarm.id)}
                >
                  {alarm.enabled ? '●' : '○'}
                </button>
                <button style={s.deleteBtn} onClick={() => onDelete(alarm.id)}>✕</button>
              </div>
            </div>
          ))}

          {adding ? (
            <div style={s.addForm}>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                style={s.timeInput}
              />
              <input
                type="text"
                placeholder="Label (optional)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                style={s.labelInput}
              />
              <div style={s.daysRow}>
                {DAY_LABELS.map((label, d) => (
                  <button
                    key={d}
                    style={{ ...s.dayBtn, ...(newDays.includes(d) ? s.dayBtnOn : {}) }}
                    onClick={() => toggleDay(d)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  style={{ ...s.dayBtn, ...(newDays.length === 0 ? s.dayBtnOn : {}) }}
                  onClick={() => setNewDays([])}
                >
                  1×
                </button>
              </div>
              <div style={s.addActions}>
                <button style={s.cancelBtn} onClick={() => setAdding(false)}>Cancel</button>
                <button style={s.saveBtn} onClick={submitAdd}>Save</button>
              </div>
            </div>
          ) : (
            <button style={s.addBtn} onClick={() => setAdding(true)}>+ Add alarm</button>
          )}
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'flex-end', zIndex: 10,
  },
  sheet: {
    width: '100%', background: 'var(--surface)',
    borderTop: '1px solid var(--border)', maxHeight: '80vh',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '3vw 4vw', borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  title: { fontSize: '3vw', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 },
  closeBtn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '3vw', cursor: 'pointer', opacity: 0.5,
  },
  list: { overflowY: 'auto', flex: 1, padding: '1vw 0' },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '2vw 4vw', borderBottom: '1px solid var(--border)',
  },
  rowLeft: { display: 'flex', flexDirection: 'column', gap: '0.5vw' },
  rowRight: { display: 'flex', alignItems: 'center', gap: '2vw' },
  alarmTime: { fontSize: '4vw', letterSpacing: '0.05em' },
  alarmMeta: { fontSize: '1.8vw', opacity: 0.4, letterSpacing: '0.05em' },
  toggleBtn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '4vw', cursor: 'pointer', opacity: 0.3,
  },
  toggleOn: { opacity: 1 },
  deleteBtn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '2.5vw', cursor: 'pointer', opacity: 0.3,
  },
  addBtn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '2.5vw', cursor: 'pointer', opacity: 0.5,
    padding: '3vw 4vw', width: '100%', textAlign: 'left',
    fontFamily: 'var(--font)', letterSpacing: '0.05em',
  },
  addForm: {
    display: 'flex', flexDirection: 'column', gap: '2vw',
    padding: '3vw 4vw', borderBottom: '1px solid var(--border)',
  },
  timeInput: {
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--amber)', fontFamily: 'var(--font)',
    fontSize: '5vw', padding: '1vw 2vw', borderRadius: '1vw',
    width: '100%',
  },
  labelInput: {
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--amber)', fontFamily: 'var(--font)',
    fontSize: '2.5vw', padding: '1vw 2vw', borderRadius: '1vw',
    width: '100%',
  },
  daysRow: { display: 'flex', gap: '1.5vw' },
  dayBtn: {
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--amber)', fontFamily: 'var(--font)',
    fontSize: '2vw', padding: '1vw 1.5vw', borderRadius: '0.8vw',
    cursor: 'pointer', opacity: 0.4,
  },
  dayBtnOn: { background: 'var(--amber-faint)', border: '1px solid var(--amber-dim)', opacity: 1 },
  addActions: { display: 'flex', gap: '2vw', justifyContent: 'flex-end' },
  cancelBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--amber)',
    fontFamily: 'var(--font)', fontSize: '2.5vw', padding: '1vw 3vw',
    borderRadius: '1vw', cursor: 'pointer', opacity: 0.5,
  },
  saveBtn: {
    background: 'var(--amber-faint)', border: '1px solid var(--amber-dim)', color: 'var(--amber)',
    fontFamily: 'var(--font)', fontSize: '2.5vw', padding: '1vw 3vw',
    borderRadius: '1vw', cursor: 'pointer',
  },
}
