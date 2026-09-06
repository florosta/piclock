import 'dotenv/config'
import express from 'express'
import path from 'path'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000
const ABS = `http://localhost:13378`
const TOKEN = process.env.ABS_TOKEN!
const ALARM_SOUND = process.env.ALARM_SOUND || path.join(__dirname, '../sounds/alarm.mp3')
const ALARMS_FILE = path.join(__dirname, '../alarms.json')
const HA_URL = process.env.HA_URL || 'http://192.168.4.254:8123'
const HA_TOKEN = process.env.HA_TOKEN
const HA_LAMP = process.env.HA_LAMP || 'switch.bedroom_daylight'

app.use(express.json())

// ---------------------------------------------------------------------------
// SSE — server-push to browser
// ---------------------------------------------------------------------------

type SSESend = (event: string, data: unknown) => void
const sseClients = new Set<SSESend>()

function broadcast(event: string, data: unknown) {
  for (const send of sseClients) send(event, data)
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send: SSESend = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }
  sseClients.add(send)
  req.on('close', () => sseClients.delete(send))
})

// ---------------------------------------------------------------------------
// Alarm store
// ---------------------------------------------------------------------------

interface Alarm {
  id: string
  label: string
  time: string      // "07:30"
  days: number[]    // 0=Sun..6=Sat; empty = one-off (next occurrence)
  enabled: boolean
}

function loadAlarms(): Alarm[] {
  if (!existsSync(ALARMS_FILE)) return []
  try { return JSON.parse(readFileSync(ALARMS_FILE, 'utf8')) } catch { return [] }
}

function saveAlarms(alarms: Alarm[]) {
  writeFileSync(ALARMS_FILE, JSON.stringify(alarms, null, 2))
}

app.get('/api/alarms', (_req, res) => res.json(loadAlarms()))

app.post('/api/alarms', (req, res) => {
  const alarms = loadAlarms()
  const alarm: Alarm = { id: randomUUID(), enabled: true, ...req.body }
  alarms.push(alarm)
  saveAlarms(alarms)
  res.json(alarm)
})

app.patch('/api/alarms/:id', (req, res) => {
  const alarms = loadAlarms()
  const idx = alarms.findIndex(a => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  alarms[idx] = { ...alarms[idx], ...req.body }
  saveAlarms(alarms)
  res.json(alarms[idx])
})

app.delete('/api/alarms/:id', (req, res) => {
  const alarms = loadAlarms().filter(a => a.id !== req.params.id)
  saveAlarms(alarms)
  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

let audioProc: ReturnType<typeof spawn> | null = null

function startAlarmAudio() {
  if (!existsSync(ALARM_SOUND)) {
    console.warn(`Alarm sound not found: ${ALARM_SOUND}`)
    return
  }
  audioProc?.kill()
  audioProc = spawn('mpv', ['--loop=inf', ALARM_SOUND])
}

function stopAlarmAudio() {
  audioProc?.kill()
  audioProc = null
}

// ---------------------------------------------------------------------------
// Fire / dismiss / snooze
// ---------------------------------------------------------------------------

let snoozeTimer: ReturnType<typeof setTimeout> | null = null

function fireAlarm(alarm: Alarm) {
  console.log(`Firing alarm: ${alarm.label || alarm.time}`)
  startAlarmAudio()
  broadcast('alarm', { alarm })
  turnOnLamp()
}

function turnOnLamp() {
  if (!HA_TOKEN) return
  fetch(`${HA_URL}/api/services/switch/turn_on`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity_id: HA_LAMP }),
  }).catch(e => console.warn('HA lamp call failed:', e.message))
}

app.post('/api/alarm/dismiss', (_req, res) => {
  stopAlarmAudio()
  if (snoozeTimer) { clearTimeout(snoozeTimer); snoozeTimer = null }
  broadcast('alarm-dismissed', {})
  res.json({ ok: true })
})

app.post('/api/alarm/snooze', (req, res) => {
  const minutes = req.body?.minutes ?? 9
  stopAlarmAudio()
  broadcast('alarm-dismissed', {})
  snoozeTimer = setTimeout(() => {
    fireAlarm({ id: 'snooze', label: 'Snoozed alarm', time: '', days: [], enabled: true })
  }, minutes * 60 * 1000)
  res.json({ ok: true, snoozeMinutes: minutes })
})

// ---------------------------------------------------------------------------
// Alarm scheduler — checks every 30s
// ---------------------------------------------------------------------------

const firedThisMinute = new Set<string>()

setInterval(() => {
  const now = new Date()
  const minute = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`

  // Clear last minute's fired set when the minute changes
  if (![...firedThisMinute].some(k => k.startsWith(minute))) firedThisMinute.clear()

  for (const alarm of loadAlarms()) {
    if (!alarm.enabled) continue
    const [h, m] = alarm.time.split(':').map(Number)
    if (now.getHours() !== h || now.getMinutes() !== m) continue
    if (alarm.days.length > 0 && !alarm.days.includes(now.getDay())) continue

    const key = `${minute}-${alarm.id}`
    if (firedThisMinute.has(key)) continue
    firedThisMinute.add(key)

    fireAlarm(alarm)

    // Disable one-off alarms after firing
    if (alarm.days.length === 0) {
      const alarms = loadAlarms().map(a => a.id === alarm.id ? { ...a, enabled: false } : a)
      saveAlarms(alarms)
    }
  }
}, 30_000)

// ---------------------------------------------------------------------------
// Audiobookshelf
// ---------------------------------------------------------------------------

function absHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${TOKEN}`, ...extra }
}

app.get('/api/episodes', async (_req, res) => {
  const libRes = await fetch(`${ABS}/api/libraries`, { headers: absHeaders() })
  const { libraries } = await libRes.json() as { libraries: { id: string; mediaType: string }[] }

  const episodes: unknown[] = []
  for (const lib of libraries.filter(l => l.mediaType === 'podcast')) {
    const itemsRes = await fetch(`${ABS}/api/libraries/${lib.id}/items`, { headers: absHeaders() })
    const { results } = await itemsRes.json() as { results: { id: string }[] }

    for (const item of results) {
      const detail = await fetch(`${ABS}/api/items/${item.id}?expanded=1`, { headers: absHeaders() })
      const data = await detail.json() as {
        id: string
        media: {
          metadata: { title: string; imageUrl: string }
          episodes: { id: string; title: string; duration: number; publishedAt: number; audioTrack: { ino: string } }[]
        }
      }
      for (const ep of data.media.episodes) {
        episodes.push({
          ...ep,
          podcast: { title: data.media.metadata.title, itemId: data.id, coverUrl: data.media.metadata.imageUrl },
        })
      }
    }
  }
  episodes.sort((a: any, b: any) => b.publishedAt - a.publishedAt)
  res.json(episodes)
})

app.get('/api/stream/:itemId/:ino', async (req, res) => {
  const { itemId, ino } = req.params
  const url = `${ABS}/api/items/${itemId}/file/${ino}`
  const headers = absHeaders(req.headers.range ? { Range: req.headers.range } : {})
  const upstream = await fetch(url, { headers })
  res.status(upstream.status)
  for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const val = upstream.headers.get(key)
    if (val) res.setHeader(key, val)
  }
  Readable.fromWeb(upstream.body as any).pipe(res)
})

// ---------------------------------------------------------------------------
// Backlight
// ---------------------------------------------------------------------------

const BACKLIGHT = '/sys/class/backlight/panel_backlight@1/brightness'
const hasBacklight = existsSync(BACKLIGHT)

app.get('/api/brightness', (_req, res) => {
  const value = hasBacklight ? parseInt(readFileSync(BACKLIGHT, 'utf8').trim()) : 15
  res.json({ value, max: 31, supported: hasBacklight })
})

app.post('/api/brightness', (req, res) => {
  const { value } = req.body as { value: number }
  if (hasBacklight) writeFileSync(BACKLIGHT, String(Math.round(Math.max(0, Math.min(31, value)))))
  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../dist')
  app.use(express.static(dist))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, '0.0.0.0', () => console.log(`piclock on :${PORT}`))
