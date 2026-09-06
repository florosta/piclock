import 'dotenv/config'
import express from 'express'
import path from 'path'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { spawn, execSync } from 'child_process'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000
const ABS = `http://localhost:13378`
const TOKEN = process.env.ABS_TOKEN!
const ALARM_SOUND = process.env.ALARM_SOUND || path.join(__dirname, '../sounds/alarm.mp3')
const ALARMS_FILE = path.join(__dirname, '../alarms.json')
const HA_URL = process.env.HA_URL
const HA_TOKEN = process.env.HA_TOKEN
const HA_SCENE = process.env.HA_SCENE

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

// Mirrors src/types.ts Alarm — keep in sync
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
  const { time } = req.body
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ error: 'time must be HH:MM' })
  }
  const alarms = loadAlarms()
  const alarm: Alarm = { ...req.body, id: randomUUID(), enabled: req.body.enabled ?? true }
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
    console.error(`Alarm sound not found: ${ALARM_SOUND}`)
    return
  }
  audioProc?.kill()
  audioProc = spawn('mpv', ['--loop=inf', ALARM_SOUND])
  audioProc.on('error', e => console.error('mpv failed to start:', e.message))
  audioProc.stderr?.on('data', (d: Buffer) => console.error('mpv:', d.toString().trim()))
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
  activateScene()
}

function activateScene() {
  if (!HA_URL || !HA_TOKEN || !HA_SCENE) return
  const domain = HA_SCENE.split('.')[0]
  fetch(`${HA_URL}/api/services/${domain}/turn_on`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity_id: HA_SCENE }),
  }).catch(e => console.warn('HA scene call failed:', e.message))
}

// ---------------------------------------------------------------------------
// Home Assistant proxy
// ---------------------------------------------------------------------------

function haHeaders() {
  return { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' }
}

app.get('/api/ha/states', async (req, res) => {
  if (!HA_URL || !HA_TOKEN) return res.json([])
  const ids = String(req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean)
  if (ids.length === 0) return res.json([])
  const results = await Promise.all(
    ids.map(id =>
      fetch(`${HA_URL}/api/states/${id}`, { headers: haHeaders() })
        .then(r => r.json())
        .catch(() => null)
    )
  )
  res.json(results.filter(Boolean))
})

app.post('/api/ha/service', async (req, res) => {
  if (!HA_URL || !HA_TOKEN) return res.status(503).json({ error: 'HA not configured' })
  const { domain, service, entity_id, data } = req.body
  const r = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
    method: 'POST',
    headers: haHeaders(),
    body: JSON.stringify({ entity_id, ...data }),
  })
  res.status(r.ok ? 200 : r.status).json({ ok: r.ok })
})

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

const firedIds = new Set<string>()
let lastCheckedMinute = ''

setInterval(() => {
  const now = new Date()
  const minute = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`

  if (minute !== lastCheckedMinute) { firedIds.clear(); lastCheckedMinute = minute }

  const alarms = loadAlarms()
  const toDisable: string[] = []

  for (const alarm of alarms) {
    if (!alarm.enabled) continue
    const [h, m] = alarm.time.split(':').map(Number)
    if (now.getHours() !== h || now.getMinutes() !== m) continue
    if (alarm.days.length > 0 && !alarm.days.includes(now.getDay())) continue
    if (firedIds.has(alarm.id)) continue

    firedIds.add(alarm.id)
    fireAlarm(alarm)
    if (alarm.days.length === 0) toDisable.push(alarm.id)
  }

  if (toDisable.length > 0) {
    saveAlarms(alarms.map(a => toDisable.includes(a.id) ? { ...a, enabled: false } : a))
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
// Volume
// ---------------------------------------------------------------------------

app.get('/api/volume', (_req, res) => {
  try {
    const out = execSync('amixer get Master').toString()
    const match = out.match(/\[(\d+)%\]/)
    res.json({ value: match ? parseInt(match[1]) : 50, supported: true })
  } catch {
    res.json({ value: 50, supported: false })
  }
})

app.post('/api/volume', (req, res) => {
  const { value } = req.body as { value: number }
  const clamped = Math.round(Math.max(0, Math.min(100, value)))
  try {
    execSync(`amixer set Master ${clamped}%`)
    res.json({ ok: true, value: clamped })
  } catch {
    res.json({ ok: false })
  }
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
