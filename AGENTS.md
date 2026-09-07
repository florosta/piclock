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
    useVolume.ts       — system volume; throttled writes, falls back to the <audio>
                         element's gain when the Pi reports no ALSA control
    useHA.ts           — the two entities above the clock (CLOCK_ENTITIES); polls
                         every 10 min because the clock face shows weather
    useHouse.ts        — the whole house, discovered from HA and grouped by area;
                         fetched when the panel opens, and on refresh
  ui/
    Icon.tsx           — the only icon set: inline SVG, 24×24 grid, currentColor
                         solid silhouettes only, holes punched with fill-rule
                         evenodd. No strokes, no emoji
    Touchable.tsx      — every pressable thing: press feedback on pointerdown,
                         drag past 12px cancels the tap, optional hold-to-repeat
    Sheet.tsx          — the one bottom sheet + IconButton
    Scroller.tsx       — scroll container; native panning for touch pointers,
                         manual drag + momentum for mouse pointers (see Touch)
    styles.ts          — style fragments shared across sheets (header, label, status)
  views/
    ClockView.tsx      — primary UI: conditions/date line, clock, podcast controls,
                         alarm/house buttons. Entities in the line above the clock
                         are whatever config/ha.ts marks `clock: true`
    EpisodePicker.tsx  — bottom-sheet episode list
    AlarmManager.tsx   — bottom-sheet alarm CRUD (add/toggle/delete, recurring/one-off)
    AlarmFiring.tsx    — full-screen alarm overlay (dismiss / snooze 9m)
    HADashboard.tsx    — bottom-sheet house panel; renders whatever /api/ha/house
                         reports, grouped by HA area. Nothing about the house is
                         written down in this repo
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
- **Every value comes from a token** in `src/index.css`: type (`--t-display`…`--t-xs`),
  spacing (`--s-1`…`--s-5`), radii (`--r-*`), opacity (`--o-full`…`--o-disabled`).
  No raw `vw` font sizes or one-off opacities in a view — add a token instead
- Dark amber palette: `--amber: #e8c97a`, `--bg: #0a0a0a`
- **No strokes anywhere.** There is no `--border` token: depth comes from stacked
  fills (`--bg` → `--surface` → `--surface-raised`), and separation between rows or
  tiles comes from the gap between them. Icons are solid silhouettes for the same
  reason. If something needs to stand apart, raise it a step or space it
- Two faces, self-hosted in `public/fonts` (the kiosk must never need the network
  to draw its own clock): `--font-display` (Alien Block) for the clock face and
  the firing alarm only, `--font` (Space Grotesk) for everything else.
  Alien Block's glyphs are drawn wider than their advance width, so `--t-display`
  is measured against rendered pixels, not calculated — re-measure if either the
  face or `--track-display` changes
- Anything pressable goes through `ui/Touchable` — never a bare `<button onClick>`,
  or it will behave like a cursor target rather than a touch target
- Anything symbolic goes through `ui/Icon` — never a glyph or an emoji in a string

## Touch

The screen is a finger, and Chromium defaults to mouse semantics. What that costs,
and where each fix lives:

| Mouse behaviour | Fix |
|---|---|
| 300ms tap delay | `touch-action: manipulation` (index.css) |
| Cursor arrow parked over a button | `cursor: none` under `@media (pointer: coarse)` |
| Nothing happens until release | press state on `pointerdown` (`ui/Touchable`) |
| Scrolling a list fires the row you started on | 12px drag slop cancels the tap |
| Flicking a list past its edge closes the sheet | backdrop tap needs down+up on the backdrop, under slop |
| Page rubber-bands behind a sheet | `overscroll-behavior: none` / `contain` on `.scroll` |
| Volume needs eight separate presses | hold-to-repeat (`repeat` prop on `Touchable`) |
| `<input type="time">` opens a cursor-sized picker | −/+ steppers in `AlarmManager` |
| Lists will not scroll when the panel is presented as a mouse | `ui/Scroller` drags the container itself for non-touch pointers |

If scrolling ever breaks again, first check what the panel reports:
`document.addEventListener('pointerdown', e => console.log(e.pointerType))` in the
kiosk. `mouse` means labwc/Chromium is not treating the DSI panel as a touchscreen
— `Scroller` covers that case, but `--touch-events=enabled` on the Chromium command
line in `~/.config/labwc/autostart` is the underlying fix.

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
- **The house panel is discovered, not configured.** `GET /api/ha/house` returns every
  entity worth showing, grouped by HA area; add a room or a lamp in Home Assistant and
  it appears. `configFor` in `src/config/ha.ts` turns a discovered entity into the
  same `EntityConfig` the rest of the app uses; `AREA_ORDER` pins which rooms come
  first and `OVERRIDES` relabels or hides a specific entity
- `CLOCK_ENTITIES` in `src/config/ha.ts` stays explicit — the two readings above the
  clock are a deliberate choice, not whatever HA happens to return
- Areas come from HA's area registry, which the REST API does not expose. Rather than
  take a WebSocket dependency the server asks HA to tell it, via one POST to
  `/api/template` using `area_name(entity_id)`
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
| GET | `/api/ha/house` | Every entity worth showing, grouped by HA area |
| POST | `/api/ha/service` | Call HA service |

## Dev workflow

```sh
npm run dev     # Vite :5173 + Express :3000, HMR
npm run deploy  # build → rsync → restart Pi server → reload Chromium
```
