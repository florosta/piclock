# piclock

Bedside clock, podcast radio, and alarm system for Raspberry Pi. Runs in Chromium kiosk mode on a DSI touchscreen. Managed from the device or any browser on the local network.

## Features

- Full-screen clock with date
- Podcast playback via [Audiobookshelf](https://www.audiobookshelf.org/)
- Alarm system with recurring and one-off alarms, snooze, and label support
- Home Assistant webhook integration (alarm trigger + SAD lamp)
- Auto-dim backlight after 2 minutes of inactivity
- Accessible from phone/laptop at `http://192.168.4.161:3000`

## Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Express — serves frontend, proxies Audiobookshelf, manages alarms, controls backlight
- **Pi**: labwc (Wayland), Chromium kiosk, kanshi for display rotation

## Setup

### Pi prerequisites

- Raspberry Pi running Raspberry Pi OS (labwc desktop)
- Audiobookshelf running on port 13378
- Node.js 22 via nvm (`~/.nvm`)
- `mpv` installed (`sudo apt install mpv`)

### Install

```sh
git clone https://github.com/florosta/piclock.git
cd piclock
npm install
cp .env.example .env
# add your ABS_TOKEN to .env
```

### Environment

```sh
# .env
ABS_TOKEN=your_audiobookshelf_api_token

# Optional — defaults to sounds/alarm.mp3 in the project
# ALARM_SOUND=/path/to/custom/alarm.mp3
```

Get your ABS token: Audiobookshelf → Settings → Users → API Keys.

### Dev

```sh
npm run dev   # Vite on :5173 + Express on :3000
```

### Deploy to Pi

```sh
npm run deploy
```

Builds, rsyncs to Pi, restarts server, reloads Chromium. Target is hardcoded as `florence@192.168.4.161` in `deploy.sh`.

## Alarm system

Alarms are stored in `alarms.json` on the Pi. Manage them via the ⏰ button on the clock screen.

- **Recurring**: pick days (Mon–Sun)
- **One-off**: leave days empty — fires next time that time occurs, then auto-disables
- **Snooze**: 9 minutes
- **Sound**: `sounds/alarm.mp3` (generated with ffmpeg, two-tone beep). Override with `ALARM_SOUND` in `.env`

### Home Assistant integration

The Pi exposes a webhook for HA to trigger alarms and chain other actions (e.g. SAD lamp):

```
POST http://192.168.4.161:3000/api/alarm/fire
Content-Type: application/json
{ "label": "Morning" }
```

HA automation example:
1. **Trigger**: Time — `07:30`
2. **Action 1**: REST command → `POST /api/alarm/fire`
3. **Action 2**: Turn on SAD lamp entity

### Alarm endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/alarms` | List alarms |
| `POST` | `/api/alarms` | Create alarm |
| `PATCH` | `/api/alarms/:id` | Update alarm (e.g. toggle enabled) |
| `DELETE` | `/api/alarms/:id` | Delete alarm |
| `POST` | `/api/alarm/fire` | Trigger alarm now (HA webhook) |
| `POST` | `/api/alarm/dismiss` | Dismiss firing alarm |
| `POST` | `/api/alarm/snooze` | Snooze (`{ minutes: 9 }`) |

## Backlight

The server reads/writes `/sys/class/backlight/panel_backlight@1/brightness` (max 31). The screen dims to 2/31 after 2 minutes of no touches and restores on the next tap.

## Pi autostart

`~/.config/labwc/autostart` on the Pi:
1. Rotates display to landscape (kanshi, 270°)
2. Starts the Node server (`restart.sh`)
3. Launches Chromium at `http://localhost:3000`

## Planned

- House control panel: HA entities (lights, temperature, sensors) as a second overlay on the clock screen
