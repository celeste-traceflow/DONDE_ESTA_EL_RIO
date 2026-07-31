#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d backend/node_modules ]; then
  echo "Instalando dependencias del backend (primera vez)..."
  (cd backend && npm install)
fi

if [ ! -d frontend/node_modules ]; then
  echo "Instalando dependencias del frontend (primera vez)..."
  (cd frontend && npm install)
fi

echo ""
echo "Levantando Río de recuerdos..."
echo "Backend en http://localhost:3000 — Frontend en http://localhost:5173"
echo "Cerrá esta ventana de Terminal para apagar todo."
echo ""

trap 'kill 0' EXIT INT TERM

(cd backend && npm run dev) &
(cd frontend && npm run dev) &

wait
