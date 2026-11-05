# cursor-plugin-wrapper — implementation plan

**Status:** Phase 0 (repo bootstrap).  
**Last updated:** 2026-11-04.

## Why this exists

Distribution for Ivcota skills is split across Claude marketplace installs, Codex `plugin add`, and per-skill `npx skills add` on Cursor. Operators should run **one command per product bundle** (for example `install learn-think`) without restoring 100+ global skill folders or maintaining parallel install lists by hand.

This repo is the **adapter** that understands **marketplace.json** and performs the correct Cursor-side install and uninstall.

## Success criteria

| Criteria | Measure |
|----------|---------|
| One bundle command | `ivcota install learn-think` in a project installs only that bundle’s skills |
| Shared catalog | Same `marketplace.json` as Claude `ivcota-skills` (no duplicated skill lists in this repo) |
| Project scope default | Skills land in `.agents/skills`; global requires an explicit flag |
| Reversible | `ivcota remove learn-think` removes tracked skills without manual folder hunting |
| Idempotent | Repeated install converges; no duplicate lockfile entries |
| Pickup-friendly | `plan.md` and `.cursor/rules` let a new agent continue without chat history |

## Non-goals (Phase 1)

- Cursor `install_plugin` / `.cursor-plugin` marketplace publish
- Hooks, MCP, or commands bundled with skills (walkthrough-style); skills-only bundles first
- Supporting every marketplace `source` shape (GitHub object, npm); **GitHub repo + relative paths** first

## Background (install models)

### Claude Code

`claude plugin install <plugin>@<marketplace>` copies into `~/.claude/plugins/cache/…` and sets `enabledPlugins`. Ivcota entries use `source: "./"` plus a `skills: ["./category/skill", …]` filter list.

### Codex

`codex plugin add <plugin>@<marketplace>` (not `install`). Same marketplace JSON family; cache under `~/.codex/plugins/cache/…`.

### Cursor today

Two paths:

1. **Marketplace plugins** (pstack, Slack, …): git checkout under `~/.cursor/plugins/cache/…`, enabled via UI / manifest.
2. **skills CLI:** `npx skills add owner/repo/path -a cursor` → project `.agents/skills` or global `~/.cursor/skills`, tracked in `skills-lock.json`.

Ivcota bundles are **skill lists without a per-bundle `.cursor-plugin` root** today, so Phase 1 targets the **skills-cli** path.

### Design premise

A marketplace **plugin row** is not identical to a Cursor **plugin checkout**. Mapping is **marketplace plugin → CursorInstallPlan**, not “always a native plugin.”

## Domain model

Organize code around these types (implement in TypeScript when coding starts):

```text
MarketplaceRef
  repo, ref, manifestPath, marketplaceName

MarketplacePluginEntry
  name, source, version?, skills[]

CursorInstallPlan (discriminated)
  | { kind: "skills-cli", repo, ref, packages: string[] }
  | { kind: "cursor-plugin", gitUrl, gitPath, gitRef, slug? }  // Phase 2+

BundleInstallRecord
  bundle, marketplace ref, plan snapshot, installedSkillKeys[], installedAt
```

**Project state files (written in the user’s project cwd):**

- `skills-lock.json` — owned by skills CLI; may annotate entries with bundle id later.
- `.ivcota/installed-bundles.json` — maps bundle name → skill keys for uninstall.

## Mapping rules

1. Load manifest from local path or fetch `owner/repo@ref` + `.claude-plugin/marketplace.json`.
2. Select `plugins[].name` (for example `learn-think`).
3. If entry has `skills: ["./learn-think/feynman", …]` and no cursor plugin manifest at source → **skills-cli** plan.
4. Each `./cat/skill` → install package `Ivcota/skills/cat/skill` (repo from `--from`, default `Ivcota/skills@main`).
5. Run `npx skills add <package> -y -a cursor` (add `-g` only when `--global`).
6. Append **BundleInstallRecord** to `.ivcota/installed-bundles.json`.

**Uninstall:** load record → `npx skills remove` for listed keys → delete record.

## Phases

### Phase 0 — Repo bootstrap (this commit)

- [x] `plan.md` (this file)
- [x] `README.md` entry point
- [x] `.cursor/rules/project.mdc` for Cursor agents
- [x] `.gitignore`
- [ ] Remote on GitHub (operator)

### Phase 1 — Skills-cli adapter (MVP)

**Deliverable:** CLI `ivcota` with `install`, `remove`, `list`, `plan --dry-run`.

| Step | Work | Verify |
|------|------|--------|
| 1.1 | Init Node package, TypeScript, vitest or node:test | `npm test` green |
| 1.2 | Parse marketplace JSON; validate plugin name; expand skill paths | Fixture test using copied snippet from `Ivcota/skills` marketplace |
| 1.3 | Resolve `--from owner/repo@ref` and local `--manifest path` | Unit tests |
| 1.4 | Executor: invoke `npx skills add` per package; collect lockfile keys | Temp dir integration test |
| 1.5 | Write/read `.ivcota/installed-bundles.json` | Install + remove roundtrip |
| 1.6 | CLI UX + `--global`, `--dry-run`, `--yes` | Manual smoke on `learn-think` (smallest bundle count for dev: use `write-communicate`) |

**Default flags:** project scope, agent `cursor`, skip confirm with `-y`.

### Phase 2 — Native Cursor plugin shape (optional)

- Add per-bundle `.cursor-plugin/plugin.json` under `Ivcota/skills` (or generated release dirs).
- Extend classifier: if `.cursor-plugin/plugin.json` exists at resolved source → **cursor-plugin** plan.
- Document manual `install_plugin` slug or future headless API.

### Phase 3 — Marketplace publish

- Host `.cursor-plugin/marketplace.json` mirroring Claude entries.
- Register marketplace git remote like `slavingia/skills` pattern.

## Throughput checkpoint (Phase 1 implementation)

| Dimension | Plan |
|-----------|------|
| **Blocking first steps** | Manifest parser + fixtures before CLI wiring |
| **Independent workstreams** | Parser/resolver · executor · bundle state · CLI |
| **Shared mutable state** | Serialize writes to `skills-lock.json` and `.ivcota/` in one process |
| **Decomposition** | Single package until MVP proven; split packages only if executor needs isolation |

## CLI sketch

```text
ivcota install <bundle> [--from owner/repo[@ref]] [--manifest path] [--global] [--dry-run] [--yes]
ivcota remove <bundle> [--yes]
ivcota list
ivcota plan <bundle>   # print CursorInstallPlan JSON
```

Environment overrides (optional later): `IVCOTA_DEFAULT_FROM=Ivcota/skills@main`.

## Open decisions

| # | Decision | Default for Phase 1 | Revisit when |
|---|----------|---------------------|--------------|
| 1 | Project skill dir | `.agents/skills` | Cursor documents `.cursor/skills` exclusively |
| 2 | Bundle metadata in lockfile | Separate `.ivcota/` only | CI wants single file restore |
| 3 | Implement language | TypeScript | If bash-only MVP preferred for zero build |

## Session pickup checklist

1. Read this file and `.cursor/rules/project.mdc`.
2. Confirm `Ivcota/skills` marketplace still lists target bundle under `plugins[].name`.
3. Continue Phase 1 from the first unchecked step in the phase table.
4. Run integration test in a temp git repo before declaring Phase 1 done.

## References (read-only)

- `Ivcota/skills/.claude-plugin/marketplace.json` — bundle definitions
- `Ivcota/skills/README.md` — per-skill install paths
- Prior chat: Claude vs Codex vs Cursor install comparison (skills CLI vs plugin cache)
