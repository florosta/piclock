# piclock

Bedside clock, podcast radio, alarm system, and house control panel for Raspberry Pi. Runs in Chromium kiosk mode on a DSI touchscreen. Accessible from any browser on the local network.

## Features

- Full-screen clock
- Podcast playback via [Audiobookshelf](https://www.audiobookshelf.org/)
- Alarm system — recurring and one-off, snooze, label support
- Home Assistant integration — alarm fires HA scene (SAD lamp etc.), house control panel
- Auto-dim backlight after 2 minutes of inactivity

## Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Express — serves frontend, proxies ABS and HA, manages alarms, controls backlight
- **Pi**: labwc (Wayland), Chromium kiosk, kanshi for display rotation

## Setup

### Pi prerequisites

- Raspberry Pi OS (labwc desktop)
- [Audiobookshelf](https://www.audiobookshelf.org/) on port 13378
- Node.js 22 via nvm
- `mpv` (`sudo apt install mpv`)

### Install

```sh
git clone https://github.com/florosta/piclock.git
cd piclock
npm install
cp .env.example .env
# fill in .env
```

### Environment

```sh
ABS_TOKEN=your_audiobookshelf_api_token

# Home Assistant (optional — features degrade gracefully without these)
HA_TOKEN=your_ha_long_lived_token
HA_URL=http://your-ha-host:8123
HA_SCENE=scene.alarm_wake_up   # fired when alarm rings

# Optional alarm sound override (defaults to sounds/alarm.mp3)
# ALARM_SOUND=/path/to/custom.mp3
```

Get your ABS token: Audiobookshelf → Settings → Users → API Keys.  
Get your HA token: HA → Profile → Security → Long-lived access tokens.

### Dev

```sh
npm run dev   # Vite :5173 + Express :3000
```

### Deploy to Pi

```sh
npm run deploy
```

Builds, rsyncs to the Pi, restarts the server, reloads Chromium. Target hardcoded as `florence@192.168.4.161` in `deploy.sh`.

## Alarm system

Manage via the ⏰ button on the clock screen.

- **Recurring**: pick days (Mon–Sun)
- **One-off**: leave days empty — fires at next occurrence, then auto-disables
- **Snooze**: 9 minutes
- **Sound**: `sounds/alarm.mp3` (two-tone beep, ffmpeg-generated). Override with `ALARM_SOUND` in `.env`
- **HA scene**: when `HA_SCENE` is set, piclock calls HA to activate it on alarm fire (best-effort — alarm still rings if HA is down)

## House panel

Tap ⌂ on the clock screen. Shows bedroom lights (toggleable), temperatures, weather, and energy usage from Home Assistant.

To add or remove entities, edit `src/config/ha.ts` — one line per entity, no other files need changing.

## Backlight

Dims to 2/31 after 2 minutes of no touches, restores on next tap. Controlled via `/sys/class/backlight/panel_backlight@1/brightness`.

## Pi autostart

`~/.config/labwc/autostart`:
1. Rotates display 270° (kanshi)
2. Starts Node server (`restart.sh`)
3. Launches Chromium at `http://localhost:3000`
