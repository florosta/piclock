# piclock — agent instructions

Bedside clock, podcast radio, and alarm system running on a Raspberry Pi kiosk.

## Architecture

- `src/` — React + TypeScript frontend (Vite)
  - `src/hooks/usePlayer.ts` — all audio state (select/play/stop/skip/seek/sleep timer)
  - `src/hooks/useEpisodes.ts` — ABS episode fetching with reload()
  - `src/hooks/useAlarms.ts` — alarm CRUD, SSE listener for alarm-fired events, next alarm calc
  - `src/hooks/useBacklight.ts` — auto-dim backlight after 2min inactivity
  - `src/views/ClockView.tsx` — primary UI: clock + podcast controls + alarm indicator
  - `src/views/EpisodePicker.tsx` — bottom-sheet episode list
  - `src/views/AlarmManager.tsx` — bottom-sheet alarm CRUD (add/toggle/delete)
  - `src/views/AlarmFiring.tsx` — full-screen alarm overlay (dismiss/snooze)
  - `src/App.tsx` — thin orchestration; wires hooks to views
- `server/index.ts` — Express: serves frontend, proxies ABS, manages alarms, controls backlight, SSE
- `alarms.json` — alarm store (created on Pi at runtime, not committed)
- `sounds/alarm.mp3` — placeholder two-tone alarm (ffmpeg-generated, committed)
- `deploy.sh` — build → rsync → restart server → reload Chromium
- `restart.sh` — Pi-side server restart script (used by deploy.sh and autostart)

## Pi

- **Host**: `florence@192.168.4.161`
- **OS**: Raspberry Pi OS (Debian Trixie), labwc Wayland compositor
- **Display**: DSI-2 touchscreen, 720×1280 physical, rotated 270° → 1280×720 landscape
- **Backlight**: `/sys/class/backlight/panel_backlight@1/brightness` (max 31, currently set ~15)
- **Node**: 22 via nvm at `~/.nvm`
- **App**: `/home/florence/piclock-app/`
- **Server start**: `/home/florence/piclock-app/restart.sh` (uses tsx, NODE_ENV=production)
- **Chromium kiosk**: `http://localhost:3000`
- **Autostart**: `~/.config/labwc/autostart`

## Audiobookshelf (ABS)

- Running at `http://localhost:13378` on Pi
- Auth token in `.env` as `ABS_TOKEN` — never commit
- Podcast library: `ac0b67d5-4c39-432f-a9cd-4cca1e65c071`
- Audio streamed via `/api/stream/:itemId/:ino` (backend proxies with auth + range headers)

## Alarm system

- Alarms stored in `alarms.json` (JSON array), loaded/saved on each request
- Scheduler: `setInterval` every 30s, checks time + day match
- SSE at `/api/events` pushes `alarm` events to browser
- On fire: plays `mpv --loop=inf sounds/alarm.mp3`, broadcasts SSE, calls HA scene (best-effort)
- HA scene configured via `HA_URL` + `HA_TOKEN` + `HA_SCENE` env vars — silently skipped if unset
- One-off alarms (empty `days` array) auto-disable after firing
- `Alarm` type is canonical in `src/types.ts`; server has a local mirror with a keep-in-sync comment

## Home Assistant

- HA running at `192.168.4.254`
- Alarm integration: HA automation calls `POST 192.168.4.161:3000/api/alarm/fire`
- HA automation can also turn on SAD lamp entity at same trigger
- **Planned**: house control panel overlay — HA entities (lights, temperature, sensors)

## Dev workflow

```sh
npm run dev     # Vite :5173 + Express :3000, HMR
npm run deploy  # build → rsync → restart Pi → reload Chromium
```

## Key conventions

- All sizing in `vw` units — targets 1280×720 landscape touchscreen
- Dark amber: `--amber: #e8c97a`, `--bg: #0a0a0a`
- Inline `React.CSSProperties` styles — no CSS modules or Tailwind
- No external UI libraries
- Function from form: logic in hooks, views are purely presentational
- `src/components/` currently empty — controls live in views directly
