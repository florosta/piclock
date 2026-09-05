# piclock — agent instructions

Bedside clock + podcast radio kiosk running on a Raspberry Pi.

## Architecture

- `src/` — React + TypeScript frontend (Vite)
- `server/index.ts` — Express backend: serves built frontend, proxies Audiobookshelf API, streams audio
- `deploy.sh` — builds locally, rsyncs to Pi, restarts server, reloads Chromium

## Pi

- Host: `florence@192.168.4.161`
- OS: Raspberry Pi OS (Debian Trixie), labwc Wayland compositor
- Display: DSI-2 touchscreen, rotated 270° via kanshi
- Node 22 via nvm at `~/.nvm`
- App lives at `/home/florence/piclock-app/`
- Server started via `/home/florence/piclock-app/start.sh` (uses tsx)
- Chromium kiosk opens `http://localhost:3000`

## Audiobookshelf

- Running at `http://localhost:13378` on the Pi
- Auth token in `.env` as `ABS_TOKEN` — never commit this
- Podcast library id: `ac0b67d5-4c39-432f-a9cd-4cca1e65c071`
- Backend proxies at `/api/episodes` and `/api/stream/:itemId/:ino`

## Dev workflow

```sh
npm run dev     # Vite :5173 + Express :3000 with HMR
npm run deploy  # build → rsync → restart Pi server → reload Chromium
```

## Key conventions

- All sizing in `vw` units — layout targets a 1280×720 landscape touchscreen
- Dark amber colour scheme: `--amber: #e8c97a`, `--bg: #0a0a0a`
- Inline styles (`React.CSSProperties`) — no CSS modules or Tailwind
- No external UI libraries
