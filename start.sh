#!/bin/bash
set -e

echo "============================================"
echo "  Claude Web - Starting Development Server"
echo "============================================"
echo ""

cd "$(dirname "$0")"

# Check and install dependencies only if missing
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing root dependencies..."
    npm install --silent
fi

if [ ! -d "client/node_modules" ]; then
    echo "[2/3] Installing client dependencies..."
    cd client && npm install --silent && cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "[3/3] Installing server dependencies..."
    cd server && npm install --silent && cd ..
fi

echo ""
echo "============================================"
echo "  Starting Claude Web..."
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo "============================================"
echo ""

npm run dev
