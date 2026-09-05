#!/bin/sh
set -e

PI=florence@192.168.4.161

echo "→ building..."
npm run build

echo "→ syncing to pi..."
rsync -a --exclude='node_modules' --exclude='.git' --exclude='.env' ./ $PI:/home/florence/piclock-app/

echo "→ restarting server..."
ssh $PI 'chmod +x /home/florence/piclock-app/restart.sh && /home/florence/piclock-app/restart.sh'
sleep 3
ssh $PI 'curl -sf http://localhost:3000/api/episodes > /dev/null && echo "  server ok" || echo "  server failed - check /tmp/piclock.log"'

echo "→ reloading chromium..."
ssh $PI 'WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 pkill chromium 2>/dev/null || true'
sleep 1
ssh $PI 'WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 nohup chromium --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-restore-session-state --ozone-platform=wayland --disable-features=TranslateUI http://localhost:3000 > /tmp/chromium.log 2>&1 & disown'

echo "✓ done"
