# piclock — agent instructions

Bedside clock, podcast radio, and alarm system running on a Raspberry Pi kiosk.

## Architecture

```
src/
  config/
    ha.ts              — typed HA entity list (id, label, section, type, format)
                         add/remove entities here; nothing else needs to change
  hooks/
    usePlayer.ts       — all audio state: select/play/stop/skip/seek/sleep timer
                         currentEpisodeRef mirrors state to avoid stale closure in play() — do not remove
    useEpisodes.ts     — ABS episode fetching
    useAlarms.ts       — alarm CRUD, SSE listener, firingAlarm state, nextAlarm calc
    useBacklight.ts    — auto-dim backlight after 2min inactivity via /api/brightness
    useHA.ts           — HA state fetching (reads entity IDs from config/ha.ts), toggle, refresh
  views/
    ClockView.tsx      — primary UI: clock + podcast controls + alarm/house buttons
    EpisodePicker.tsx  — bottom-sheet episode list
    AlarmManager.tsx   — bottom-sheet alarm CRUD (add/toggle/delete, recurring/one-off)
    AlarmFiring.tsx    — full-screen alarm overlay (dismiss / snooze 9m)
    HADashboard.tsx    — bottom-sheet house panel; iterates config/ha.ts, renders by EntityType
  types.ts             — canonical shared types: Episode, Alarm
  App.tsx              — thin orchestration; wires hooks to views, nothing else

server/index.ts        — Express: ABS proxy, alarm store, scheduler, SSE, backlight, HA proxy
alarms.json            — alarm store (created on Pi at runtime, not committed)
sounds/alarm.mp3       — placeholder two-tone alarm (ffmpeg-generated, committed)
deploy.sh              — build → rsync → restart server → reload Chromium
restart.sh             — Pi-side server restart (used by deploy.sh and labwc autostart)
```

## Design principles

- **Function from form**: all logic in hooks, views are purely presentational — no `fetch()` in views
- **Config-driven display**: HA entities defined in `src/config/ha.ts`; `HADashboard` has zero hardcoded IDs
- `Alarm` type canonical in `src/types.ts`; server has a local mirror with a keep-in-sync comment
- All sizing in `vw` — targets 1280×720 landscape touchscreen
- Inline `React.CSSProperties` styles — no CSS modules or Tailwind, no external UI libraries
- Dark amber palette: `--amber: #e8c97a`, `--bg: #0a0a0a`

## Pi

- **Host**: `florence@192.168.4.161`
- **OS**: Raspberry Pi OS (Debian Trixie), labwc Wayland compositor
- **Display**: DSI-2 touchscreen, 720×1280 physical, rotated 270° → 1280×720 landscape via kanshi
- **Backlight**: `/sys/class/backlight/panel_backlight@1/brightness` (max 31)
- **Node**: 22 via nvm at `~/.nvm`
- **App**: `/home/florence/piclock-app/`
- **Server**: `restart.sh` → `tsx server/index.ts` with `NODE_ENV=production`
- **Kiosk**: Chromium at `http://localhost:3000`
- **Autostart**: `~/.config/labwc/autostart`
- **`.env`**: `ABS_TOKEN`, `HA_TOKEN`, `HA_URL`, `HA_SCENE` — never commit

## Audiobookshelf (ABS)

- Running at `http://localhost:13378` on Pi
- Podcast library ID: `ac0b67d5-4c39-432f-a9cd-4cca1e65c071`
- Audio streamed via `/api/stream/:itemId/:ino` — backend proxies with auth + range headers

## Alarm system

- Alarms in `alarms.json` (JSON array); CRUD via `/api/alarms`
- Scheduler: `setInterval` every 30s — loads once per tick, saves once after loop (no double-load race)
- On fire: plays `mpv --loop=inf $ALARM_SOUND`, pushes SSE `alarm` event, calls `HA_SCENE` (best-effort)
- `HA_SCENE` entity domain is auto-detected from prefix (scene.x, switch.x, light.x etc.)
- One-off alarms (empty `days[]`) auto-disable after firing
- Snooze: 9 min default, re-fires via server-side setTimeout
- Dismiss/snooze clear `firingAlarm` in `useAlarms` — no callback needed, hook owns the state

## Home Assistant

- HA at `192.168.4.254:8123`
- `GET /api/ha/states?ids=...` — fetches any entity IDs in parallel from HA
- `POST /api/ha/service` — proxies `{domain, service, entity_id, data}` to HA services API
- Entity list for the dashboard lives in `src/config/ha.ts` — add a line to show a new entity
- Alarm scene (`HA_SCENE=scene.alarm_wake_up`) fires SAD lamp on alarm; scene managed in HA UI

## Server endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/episodes` | ABS episodes, all libraries, sorted newest first |
| GET | `/api/stream/:itemId/:ino` | ABS audio stream proxy (range-aware) |
| GET | `/api/brightness` | Read backlight value |
| POST | `/api/brightness` | Set backlight value `{value: 0–31}` |
| GET | `/api/alarms` | List alarms |
| POST | `/api/alarms` | Create alarm (time must be HH:MM) |
| PATCH | `/api/alarms/:id` | Update alarm |
| DELETE | `/api/alarms/:id` | Delete alarm |
| POST | `/api/alarm/dismiss` | Stop audio, clear firing state |
| POST | `/api/alarm/snooze` | Stop audio, re-fire in `{minutes}` |
| GET | `/api/events` | SSE stream (`alarm` event) |
| GET | `/api/ha/states?ids=` | Fetch HA entity states |
| POST | `/api/ha/service` | Call HA service |

## Dev workflow

```sh
npm run dev     # Vite :5173 + Express :3000, HMR
npm run deploy  # build → rsync → restart Pi server → reload Chromium
```
