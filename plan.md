# cursor-plugin-wrapper — implementation plan

**Status:** Phase 1 (MVP implemented).  
**Last updated:** 2026-11-05.

Domain vocabulary: **[GLOSSARY.md](./GLOSSARY.md)** (Cursor-aligned). Phase 2 waits until Phase 1 docs/terminology are solid and you explicitly start native plugin install work.

## Why this exists

Distribution for Ivcota skills is split across Claude marketplace installs, Codex `plugin add`, and per-skill `npx skills add` on Cursor. Operators should run **one command per marketplace plugin** (for example `deck add learn-think`) without restoring 100+ user skill folders or maintaining parallel install lists by hand.

This repo is the **adapter** that reads a **marketplace manifest** (and **per-plugin manifest** fallback) and installs the plugin’s **skills** on Cursor via the skills CLI. It is **not** Cursor’s native plugin installer (Phase 2).

## Success criteria

| Criteria | Measure |
|----------|---------|
| One plugin command | `deck add learn-think` installs only that plugin entry’s skills |
| Shared catalog | Same marketplace manifest as Claude `ivcota-skills` (no duplicated skill lists in this repo) |
| Community catalogs | Plugin entries like `mattpocock-skills` work via per-plugin manifest when the entry has no `skills[]` |
| Project scope default | Skills land in `.agents/skills`; **user scope** requires `--global` |
| Reversible | `deck rm learn-think` removes tracked skills via the installed-plugins ledger |
| Idempotent | Repeated install converges; partial installs resume on re-run; no duplicate ledger churn when complete |
| Pickup-friendly | `plan.md`, `GLOSSARY.md`, and `.cursor/rules` let a new agent continue without chat history |

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
  # `bundle` field = plugin entry name (CLI arg); rename in code optional later

Installed-plugins ledger (.ivcota/installed-bundles.json, version 1)
  bundles[<pluginName>]: {
    bundle, from, packages, skillKeys,
    status: "partial" | "complete",
    installedAt?, appliedPackages?
  }
```

Ledger path is **cwd-scoped** even when `--global` (user scope) installs skill files under the user dir.

**Catalog resolution**

1. Load marketplace manifest (GitHub raw or `--manifest`). Remote default tries `.cursor-plugin/marketplace.json`, then `.claude-plugin/marketplace.json`.
2. Select **plugin entry** `plugins[].name`.
3. If entry has `skills[]`, use it.
4. Else load per-plugin manifest at plugin `source` (default `./`), trying `.cursor-plugin/plugin.json`, root `plugin.json`, then `.claude-plugin/plugin.json`.
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
- [x] Cursor-first manifest paths with Claude fallback
- [x] GLOSSARY.md (Cursor terminology)

### Phase 2+

Native Cursor **plugin install** and marketplace publish. Do not start until explicitly green-lit.

## CLI sketch

```text
deck add <plugin> [--from owner/repo[@ref]] [--manifest path] [--global] [--json]
deck rm <plugin> [--global] [--json]
deck ls [--json]
deck plan <plugin> [--from ...] [--manifest path] [--json]
```

`--global` = **user scope**. Default = **project scope**.

Environment: `SKILL_DECK_FROM=owner/repo@ref`.

## Session pickup

1. Read this file, `GLOSSARY.md`, and `.cursor/rules/project.mdc`.
2. `npm test` after changes.
3. Smoke: `npm run build && node dist/cli.js plan write-communicate --from Ivcota/skills@main`.
