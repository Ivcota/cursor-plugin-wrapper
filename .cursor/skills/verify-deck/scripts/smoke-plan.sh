#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
RUN_ID="${RUN_ID:-$(date +%s)-$$}"
EVIDENCE_DIR="$ROOT/.cursor/skills/verify-deck/evidence/$RUN_ID"
mkdir -p "$EVIDENCE_DIR"
DECK=(node dist/cli.js)

"$ROOT/.cursor/skills/verify-deck/scripts/doctor.sh" | tee "$EVIDENCE_DIR/doctor.log"

set +e
"${DECK[@]}" plan write-communicate --from Ivcota/skills@main \
  >"$EVIDENCE_DIR/plan-write-communicate.json" 2>"$EVIDENCE_DIR/plan-write-communicate.err"
W1=$?
"${DECK[@]}" plan mattpocock-skills --from mattpocock/skills@main \
  >"$EVIDENCE_DIR/plan-mattpocock-skills.json" 2>"$EVIDENCE_DIR/plan-mattpocock-skills.err"
W2=$?
set -e

if [[ $W1 -ne 0 || $W2 -ne 0 ]]; then
  echo "plan failed (write-communicate=$W1 mattpocock=$W2)"
  exit 1
fi

node -e "
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('$EVIDENCE_DIR/plan-write-communicate.json','utf8'));
if(p.packages.length!==4) process.exit(1);
const m=JSON.parse(fs.readFileSync('$EVIDENCE_DIR/plan-mattpocock-skills.json','utf8'));
if(m.packages.length<20) process.exit(1);
"

echo "smoke-plan: ok"
echo "evidence: $EVIDENCE_DIR"
