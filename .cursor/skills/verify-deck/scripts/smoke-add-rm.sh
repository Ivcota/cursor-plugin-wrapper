#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
RUN_ID="${RUN_ID:-$(date +%s)-$$}"
EVIDENCE_DIR="$ROOT/.cursor/skills/verify-deck/evidence/$RUN_ID"
mkdir -p "$EVIDENCE_DIR"
DECK=(node "$ROOT/dist/cli.js")
MANIFEST="$ROOT/test/fixtures/ivcota-write-communicate.json"

"$ROOT/.cursor/skills/verify-deck/scripts/doctor.sh" | tee "$EVIDENCE_DIR/doctor.log"

WORKDIR="$(mktemp -d /tmp/deck-verify-${RUN_ID}-XXXX)"
cleanup() {
  "$ROOT/.cursor/skills/verify-deck/scripts/cleanup-workdir.sh" "$WORKDIR" || true
}
trap cleanup EXIT

git -C "$WORKDIR" init -q

{
  echo "WORKDIR=$WORKDIR"
  echo "deck add write-communicate --manifest fixture --from Ivcota/skills@main"
  (cd "$WORKDIR" && "${DECK[@]}" add write-communicate --manifest "$MANIFEST" --from Ivcota/skills@main)
  echo "add exit:$?"
} >"$EVIDENCE_DIR/add-rm.transcript" 2>&1

cp "$WORKDIR/.ivcota/installed-bundles.json" "$EVIDENCE_DIR/ledger-after-add.json"
ls -1 "$WORKDIR/.agents/skills" >"$EVIDENCE_DIR/skills-after-add.txt"

node -e "
const fs = require('fs');
const path = require('path');
const evidence = process.argv[1];
const ledger = JSON.parse(fs.readFileSync(path.join(evidence, 'ledger-after-add.json'), 'utf8'));
const rec = ledger.bundles['write-communicate'];
if (!rec || rec.status !== 'complete') {
  console.error('add: ledger missing complete write-communicate record');
  process.exit(1);
}
if (!Array.isArray(rec.skillKeys) || rec.skillKeys.length !== 4) {
  console.error('add: expected 4 skillKeys (skills-lock ids), got', rec.skillKeys);
  process.exit(1);
}
for (const k of rec.skillKeys) {
  if (k.includes('/')) {
    console.error('add: skillKeys should be lockfile ids, not paths:', k);
    process.exit(1);
  }
}
const listed = fs.readFileSync(path.join(evidence, 'skills-after-add.txt'), 'utf8')
  .trim()
  .split(/\\n/)
  .filter(Boolean)
  .sort();
if (listed.length !== 4) {
  console.error('add: expected 4 skill dirs, got', listed);
  process.exit(1);
}
fs.writeFileSync(path.join(evidence, 'skill-keys.json'), JSON.stringify(rec.skillKeys));
" "$EVIDENCE_DIR"

{
  echo "deck rm write-communicate"
  (cd "$WORKDIR" && "${DECK[@]}" rm write-communicate)
  echo "rm exit:$?"
  ls -1 "$WORKDIR/.agents/skills" 2>/dev/null || echo "(no .agents/skills)"
} >>"$EVIDENCE_DIR/add-rm.transcript" 2>&1

ls -1 "$WORKDIR/.agents/skills" 2>/dev/null >"$EVIDENCE_DIR/skills-after-rm.txt" || echo -n >"$EVIDENCE_DIR/skills-after-rm.txt"

node -e "
const fs = require('fs');
const path = require('path');
const workdir = process.argv[1];
const evidence = process.argv[2];
const skillKeys = JSON.parse(fs.readFileSync(path.join(evidence, 'skill-keys.json'), 'utf8'));
const afterLedger = JSON.parse(
  fs.readFileSync(path.join(workdir, '.ivcota/installed-bundles.json'), 'utf8'),
);
if (afterLedger.bundles['write-communicate']) {
  console.error('rm: ledger still lists write-communicate');
  process.exit(1);
}
const lockPath = path.join(workdir, 'skills-lock.json');
let lockKeys = [];
if (fs.existsSync(lockPath)) {
  lockKeys = Object.keys(JSON.parse(fs.readFileSync(lockPath, 'utf8')).skills || {});
}
const skillsDir = path.join(workdir, '.agents/skills');
const onDisk = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : [];
const leftover = skillKeys.filter((k) => lockKeys.includes(k) || onDisk.includes(k));
if (leftover.length) {
  console.error('rm: skills still present for keys:', leftover.join(', '));
  process.exit(1);
}
" "$WORKDIR" "$EVIDENCE_DIR"

echo "smoke-add-rm: ok"
echo "evidence: $EVIDENCE_DIR"
