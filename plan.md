# cursor-plugin-wrapper — implementation plan

**Status:** Phase 1 (MVP implemented).  
**Last updated:** 2026-11-05.

## Why this exists

Distribution for Ivcota skills is split across Claude marketplace installs, Codex `plugin add`, and per-skill `npx skills add` on Cursor. Operators should run **one command per product bundle** (for example `deck add learn-think`) without restoring 100+ global skill folders or maintaining parallel install lists by hand.

This repo is the **adapter** that understands **marketplace.json** (and **plugin.json** fallback) and performs the correct Cursor-side install and uninstall.

## Success criteria

| Criteria | Measure |
|----------|---------|
| One bundle command | `deck add learn-think` installs only that bundle’s skills |
| Shared catalog | Same `marketplace.json` as Claude `ivcota-skills` (no duplicated skill lists in this repo) |
| Community catalogs | Bundles like `mattpocock-skills` work via `plugin.json` when the marketplace row has no `skills[]` |
| Project scope default | Skills land in `.agents/skills`; global requires `--global` |
| Reversible | `deck rm learn-think` removes tracked skills via `.ivcota/installed-bundles.json` |
| Idempotent | Repeated install converges; no duplicate ledger churn when complete |
| Pickup-friendly | `plan.md` and `.cursor/rules` let a new agent continue without chat history |

## Product surface

| Surface | Role |
|---------|------|
| npm **`skill-deck`**, bin **`deck`** | Humans, CI, tests. Source of truth. |
| Cursor skill **`install-skill-deck`** | Chat only. Shell out to `deck` or `npx skill-deck@latest`. |

Commands: `deck add`, `deck rm`, `deck plan`, `deck ls`. Flags: `--from`, `--manifest`, `--global`, `--json`.

## Domain model

```text
CursorInstallPlan
  { kind: "skills-cli", bundle, from, scope, packages[] }

BundleInstallRecord (in .ivcota/installed-bundles.json)
  bundle, from, packages, skillKeys, status, installedAt
```

**Catalog resolution**

1. Load `marketplace.json` (GitHub raw or `--manifest`).
2. Select `plugins[].name`.
3. If row has `skills[]`, use it.
4. Else fetch `.claude-plugin/plugin.json` at plugin `source` (default `./`) and use its `skills[]`.
5. Expand `./path` → `owner/repo/path` for `npx skills add`.

## Phases

### Phase 0 — Repo bootstrap

- [x] plan, README, rules, gitignore

### Phase 1 — Skills-cli adapter (MVP)

- [x] TypeScript package, vitest, `npm test`
- [x] Parser + Ivcota fixture + mattpocock plugin.json fallback fixture
- [x] `--from` / `--manifest`
- [x] Executor (npx skills) + ledger + integration test with mock skills port
- [x] CLI + `install-skill-deck` skill stub

### Phase 2+

Native Cursor plugin install, marketplace publish (unchanged from prior plan).

## CLI sketch

```text
deck add <bundle> [--from owner/repo[@ref]] [--manifest path] [--global] [--json]
deck rm <bundle> [--global] [--json]
deck ls [--json]
deck plan <bundle> [--from ...] [--manifest path] [--json]
```

Environment: `SKILL_DECK_FROM=owner/repo@ref`.

## Session pickup

1. Read this file and `.cursor/rules/project.mdc`.
2. `npm test` after changes.
3. Smoke: `npm run build && node dist/cli.js plan write-communicate --from Ivcota/skills@main`.
