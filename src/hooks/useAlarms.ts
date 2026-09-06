import { useEffect, useRef, useState } from 'react'
import type { Alarm } from '../types'

export type { Alarm }

export function useAlarms(onFire: (alarm: Alarm) => void) {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const onFireRef = useRef(onFire)
  onFireRef.current = onFire

  useEffect(() => {
    fetch('/api/alarms').then(r => r.json()).then(setAlarms).catch(() => {})

    const es = new EventSource('/api/events')
    es.addEventListener('alarm', (e: MessageEvent) => {
      const { alarm } = JSON.parse(e.data)
      onFireRef.current(alarm)
    })
    return () => es.close()
  }, [])

  async function addAlarm(data: Omit<Alarm, 'id'>) {
    const res = await fetch('/api/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const alarm = await res.json() as Alarm
    setAlarms(prev => [...prev, alarm])
    return alarm
  }

  async function toggleAlarm(id: string) {
    const alarm = alarms.find(a => a.id === id)
    if (!alarm) return
    await fetch(`/api/alarms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !alarm.enabled }),
    })
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  async function deleteAlarm(id: string) {
    await fetch(`/api/alarms/${id}`, { method: 'DELETE' })
    setAlarms(prev => prev.filter(a => a.id !== id))
  }

  async function dismiss() {
    await fetch('/api/alarm/dismiss', { method: 'POST' })
  }

  async function snooze(minutes = 9) {
    await fetch('/api/alarm/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes }),
    })
  }

  const nextAlarm = (() => {
    const now = new Date()
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const today = now.getDay()
    let earliest: { minsFromNow: number; alarm: Alarm } | null = null
    for (const alarm of alarms.filter(a => a.enabled)) {
      const [h, m] = alarm.time.split(':').map(Number)
      const alarmMins = h * 60 + m
      const days = alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6]
      for (let offset = 0; offset < 7; offset++) {
        const day = (today + offset) % 7
        if (!days.includes(day)) continue
        const minsFromNow = offset * 1440 + alarmMins - nowMins
        if (minsFromNow <= 0) continue
        if (!earliest || minsFromNow < earliest.minsFromNow) earliest = { minsFromNow, alarm }
        break
      }
    }
    return earliest?.alarm ?? null
  })()

  return { alarms, nextAlarm, addAlarm, toggleAlarm, deleteAlarm, dismiss, snooze }
}
