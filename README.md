# piclock

Bedside clock and podcast radio for Raspberry Pi. Runs in Chromium kiosk mode on a touchscreen display.

## Features

- Full-screen clock with date
- Podcast playback via [Audiobookshelf](https://www.audiobookshelf.org/)
- Mini player on clock screen when audio is playing
- Accessible from phone/laptop on the same network

## Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Express — serves the frontend and proxies Audiobookshelf
- **Pi**: labwc (Wayland), Chromium kiosk, kanshi for display rotation

## Setup

### Pi prerequisites

- Raspberry Pi running Raspberry Pi OS (labwc desktop)
- Audiobookshelf running on port 13378
- Node.js 22 (via nvm)

### Install

```sh
git clone https://github.com/florosta/piclock.git
cd piclock
npm install
cp .env.example .env   # add your ABS_TOKEN
```

### Environment

```sh
# .env
ABS_TOKEN=your_audiobookshelf_api_token
```

Get your token from Audiobookshelf → Settings → Users → API Keys.

### Dev

```sh
npm run dev   # Vite on :5173 + Express on :3000
```

### Deploy to Pi

```sh
npm run deploy
```

Builds, rsyncs to the Pi, restarts the server, and reloads Chromium. Assumes the Pi is at `florence@192.168.4.161` — edit `deploy.sh` to change.

## Pi autostart

On boot, `~/.config/labwc/autostart`:
1. Rotates display to landscape (kanshi)
2. Starts the Node server
3. Launches Chromium at `localhost:3000`
