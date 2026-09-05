import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, writeFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000
const ABS = `http://localhost:13378`
const TOKEN = process.env.ABS_TOKEN!

app.use(cors())
app.use(express.json())

function absHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${TOKEN}`, ...extra }
}

// List all episodes across all podcast libraries, sorted newest first
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
          episodes: {
            id: string; title: string; duration: number; publishedAt: number
            audioTrack: { ino: string }
          }[]
        }
      }
      for (const ep of data.media.episodes) {
        episodes.push({
          ...ep,
          podcast: {
            title: data.media.metadata.title,
            itemId: data.id,
            coverUrl: data.media.metadata.imageUrl,
          },
        })
      }
    }
  }

  episodes.sort((a: any, b: any) => b.publishedAt - a.publishedAt)
  res.json(episodes)
})

// Backlight control
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

// Streaming proxy — forwards Range headers so seeking works
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

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../dist')
  app.use(express.static(dist))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, '0.0.0.0', () => console.log(`piclock on :${PORT}`))
