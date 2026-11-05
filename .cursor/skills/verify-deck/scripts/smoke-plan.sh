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
"${DECK[@]}" plan rpi --from humanlayer/skills@main \
  >"$EVIDENCE_DIR/plan-humanlayer-rpi.json" 2>"$EVIDENCE_DIR/plan-humanlayer-rpi.err"
W3=$?
set -e

if [[ $W1 -ne 0 || $W2 -ne 0 || $W3 -ne 0 ]]; then
  echo "plan failed (write-communicate=$W1 mattpocock=$W2 humanlayer-rpi=$W3)"
  exit 1
fi

node -e "
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('$EVIDENCE_DIR/plan-write-communicate.json','utf8'));
if(p.packages.length!==4) process.exit(1);
const m=JSON.parse(fs.readFileSync('$EVIDENCE_DIR/plan-mattpocock-skills.json','utf8'));
if(m.packages.length<20) process.exit(1);
const h=JSON.parse(fs.readFileSync('$EVIDENCE_DIR/plan-humanlayer-rpi.json','utf8'));
if(h.packages.length!==1) process.exit(1);
if(h.packages[0]!=='humanlayer/skills/plugins/rpi/skills/rpi') process.exit(1);
"

echo "smoke-plan: ok"
echo "evidence: $EVIDENCE_DIR"
