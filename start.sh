#!/usr/bin/env bash
# FACE ID + BLOCKCHAIN VERIFICATION — one-command launcher
# Installs dependencies if missing, then starts backend (:8000) + frontend (:5173).
set -e
cd "$(dirname "$0")"

echo "▸ Checking backend deps…"
python3 -c "import fastapi, cv2, uvicorn" 2>/dev/null || pip3 install -q -r backend/requirements.txt

echo "▸ Checking frontend deps…"
[ -d frontend/node_modules ] || (cd frontend && npm install --no-audit --no-fund)

echo "▸ Starting backend on :8000…"
(cd backend && nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &)

echo "▸ Starting frontend on :5173…"
(cd frontend && nohup npm run dev > frontend.log 2>&1 &)

sleep 4
echo "✓ Open http://localhost:5173  (backend logs: backend/backend.log, frontend logs: frontend/frontend.log)"
