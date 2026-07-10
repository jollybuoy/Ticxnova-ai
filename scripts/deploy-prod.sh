#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building Ticxnova-AI..."
npm run build

echo "Linking site (first time only)..."
if [[ ! -f .netlify/state.json ]]; then
  npx netlify link --name ticxnova
fi

echo "Deploying production..."
npx netlify deploy --prod --dir=dist --message "Deploy $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"

echo "Done. Verify: https://ticxnova.netlify.app"
