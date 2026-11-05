#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
DECK=(node dist/cli.js)

need() { command -v "$1" >/dev/null || { echo "missing: $1"; exit 1; }; }

need node
node -e "const v=process.versions.node.split('.').map(Number); if(v[0]<18) process.exit(1)" \
  || { echo "need Node 18+"; exit 1; }

test -f dist/cli.js || { echo "run npm run build first"; exit 1; }

"${DECK[@]}" ls >/dev/null
echo "doctor: ok (node $(node -v), dist/cli.js present, deck ls exit 0)"
