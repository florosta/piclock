#!/bin/sh
# Runs on the Pi — called by deploy.sh
pkill -f "tsx server" 2>/dev/null || true
sleep 1
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
cd /home/florence/piclock-app
NODE_ENV=production nohup ./node_modules/.bin/tsx server/index.ts > /tmp/piclock.log 2>&1 &
echo "server started"
