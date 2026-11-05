---
name: verify-deck
description: >-
  Drive the skill-deck CLI (deck) to prove marketplace bundle install behavior.
  Use after changing catalog parsing, ledger, skills-cli integration, or CLI
  flags. Surface is terminal only.
---

# Verify deck (skill-deck CLI)

**Surface:** CLI binary `deck` from this repo (`npm run deck -- …` or `node dist/cli.js …`).  
**Not in scope:** Cursor UI, `install-skill-deck` skill prose, npm publish.

## Launch

From the repository root:

```bash
npm ci
npm run build
```

Ready when `test -f dist/cli.js` and `node dist/cli.js ls` exits 0 (empty list is fine).

There is no long-lived server. Each drive runs commands in a shell.

**Teardown:** None after build. Isolated drives use their own temp directory (see Drive).

## Doctor

Run the helper (read-only):

```bash
.cursor/skills/verify-deck/scripts/doctor.sh
```

Requires exit 0. It checks Node 18+, `dist/cli.js`, and that `deck ls` runs.

If doctor fails, fix build before driving features.

## Drive

Harness: subprocess CLI with cwd and env you control. Use the repo’s built binary:

```bash
DECK="node $(pwd)/dist/cli.js"
```

**Isolation:** For mutating features (`add`, `rm`), never run against the repo root as cwd. Create a disposable project directory:

```bash
RUN_ID="${RUN_ID:-$(date +%s)-$$}"
WORKDIR="$(mktemp -d /tmp/deck-verify-${RUN_ID}-XXXX)"
git -C "$WORKDIR" init -q
```

Set `EVIDENCE_DIR=".cursor/skills/verify-deck/evidence/${RUN_ID}"` at repo root and `mkdir -p "$EVIDENCE_DIR"`.

Read `.cursor/skills/verify-deck/features/README.md` and drive the feature file that matches the change. Default smoke feature: **plan marketplace bundle** (network, read-only).

Example (plan, live catalog):

```bash
$DECK plan write-communicate --from Ivcota/skills@main \
  | tee "$EVIDENCE_DIR/plan-write-communicate.json"
```

Assert exit 0 and JSON contains four `Ivcota/skills/write-communicate/` packages.

## Evidence

Proof artifacts live under `.cursor/skills/verify-deck/evidence/<RUN_ID>/`:

| Artifact | Proves |
|----------|--------|
| `doctor.log` | Environment and binary healthy |
| `plan-*.json` | Catalog expansion for a bundle |
| `add-rm.transcript` | Full install/remove when driven |
| `ledger-after-add.json` | Bundle recorded under `.ivcota/` |

Standards:

- Use real `deck` invocations, not direct `npx skills` loops.
- Capture **command, exit code, stdout, stderr** for each step.
- For `add`/`rm`, assert **filesystem** (`.agents/skills/`, `.ivcota/installed-bundles.json`) after the command, not stdout alone.
- `plan` touches the network (GitHub raw). `add`/`rm` also invoke `npx skills` (network + skills CLI).

## Cleanup

After a mutating drive:

```bash
.cursor/skills/verify-deck/scripts/cleanup-workdir.sh "$WORKDIR"
```

Removes only the temp directory you pass. Do **not** delete `EVIDENCE_DIR`. Do **not** `pkill deck` or `pkill node`.

If you accidentally ran `add` in the repo root, remove `.ivcota/installed-bundles.json` and any test skills under `.agents/skills/` that the run added.

## Helpers

```bash
.cursor/skills/verify-deck/scripts/doctor.sh
.cursor/skills/verify-deck/scripts/smoke-plan.sh    # plan write-communicate + mattpocock-skills
.cursor/skills/verify-deck/scripts/cleanup-workdir.sh <path>
```

`smoke-plan.sh` writes evidence under `.cursor/skills/verify-deck/evidence/<RUN_ID>/` and prints that path on success.
