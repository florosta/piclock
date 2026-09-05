#!/bin/sh
set -e

PI=florence@192.168.4.161

echo "→ building..."
npm run build

echo "→ syncing to pi..."
rsync -a --exclude='node_modules' --exclude='.git' ./ $PI:/home/florence/piclock-app/

echo "→ restarting server..."
ssh $PI '
  pkill -f "tsx server" 2>/dev/null || true
  sleep 1
  nohup /home/florence/piclock-app/start.sh > /dev/null 2>&1 &
  sleep 2
  curl -sf http://localhost:3000/api/episodes > /dev/null && echo "server ok" || echo "server failed"
'

echo "→ reloading chromium..."
ssh $PI '
  WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 \
  pkill chromium 2>/dev/null || true
  sleep 1
  WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 \
  chromium --kiosk --noerrdialogs --disable-infobars --no-first-run \
    --disable-restore-session-state --ozone-platform=wayland \
    --disable-features=TranslateUI http://localhost:3000 > /tmp/chromium.log 2>&1 &
  echo "chromium relaunched"
'

echo "✓ done"
