#!/bin/bash

BACKEND_DIR="/home/admin/gemini/backend"
FRONTEND_DIR="/home/admin/gemini/frontend"
BACKEND_PORT=3001
FRONTEND_PORT=3000

# To track daily news update
LAST_NEWS_UPDATE_DATE=""

while true; do
    # 1. Check Backend
    if ! curl -s "http://localhost:$BACKEND_PORT/api/skills" > /dev/null; then
        echo "$(date): Backend is down. Restarting..."
        cd "$BACKEND_DIR"
        pkill -f "node --loader ts-node/esm server.ts"
        npm start > server.log 2>&1 &
    fi

    # 2. Check Frontend
    if ! curl -s "http://localhost:$FRONTEND_PORT" > /dev/null; then
        echo "$(date): Frontend is down. Restarting..."
        cd "$FRONTEND_DIR"
        pkill -f "node /home/admin/gemini/frontend/node_modules/.bin/vite"
        npm run dev > frontend.log 2>&1 &
    fi

    # 3. Scheduled Task: Fetch News at 06:00 every day
    CURRENT_HOUR=$(date +%H)
    CURRENT_DATE=$(date +%Y-%m-%d)

    if [ "$CURRENT_HOUR" == "06" ] && [ "$LAST_NEWS_UPDATE_DATE" != "$CURRENT_DATE" ]; then
        echo "$(date): It's 6:00 AM. Fetching AI News..."
        cd "$BACKEND_DIR"
        node fetch_news.js >> news_fetch.log 2>&1
        LAST_NEWS_UPDATE_DATE="$CURRENT_DATE"
    fi

    sleep 60
done
