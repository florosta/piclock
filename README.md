# piclock

Bedside clock, podcast radio, alarm system, and house control panel for Raspberry Pi. Runs in Chromium kiosk mode on a DSI touchscreen. Accessible from any browser on the local network.

## Features

- Full-screen clock
- Podcast playback via [Audiobookshelf](https://www.audiobookshelf.org/)
- Alarm system — recurring and one-off, snooze, label support
- Home Assistant integration — alarm fires HA scene (SAD lamp etc.), house panel discovered from HA areas
- Sleep timer — play button arms a 15-minute timer; stop button cancels it
- Volume control — one key showing the level, opening a drag slider (system volume via `amixer`)
- Auto-dim backlight after 2 minutes of inactivity

## Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Express — serves frontend, proxies ABS and HA, manages alarms, controls backlight and volume
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

Tap the house key on the clock screen. It asks Home Assistant what exists and shows
it grouped by area — lights, switches, covers and locks you can tap, plus
temperatures, humidity, power, doors and windows as readings. Add a room or a lamp
in Home Assistant and it turns up here; nothing in this repo needs changing.

Noise is filtered server-side: only domains a bedside panel can use, and only
sensors carrying a unit or a device class worth a tile. To pin the order rooms
appear in, or to relabel or hide a specific entity, edit `AREA_ORDER` and
`OVERRIDES` in `src/config/ha.ts`.

The two readings above the clock are separate and deliberate — `CLOCK_ENTITIES` in
the same file.

## Backlight

Dims to 2/31 after 2 minutes of no touches, restores on next tap. Controlled via `/sys/class/backlight/panel_backlight@1/brightness`.

## Volume

Tap the volume key on the clock screen — it shows the current level — and drag the
slider. The server picks the first ALSA control the Pi actually has (`Master`,
`PCM`, `Speaker`, `Headphone`, `Digital`), since `Master` does not exist on every
audio setup, and sets it with `amixer -M` so the slider is perceptually linear.

If no control is found the app says so and falls back to the player's own gain,
which controls podcast playback but not the alarm. Check what the Pi has with
`amixer scontrols`; the server logs which one it chose at startup.
