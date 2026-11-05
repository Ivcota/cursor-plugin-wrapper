# AGENTS.md

Guidance for Cursor and other coding agents working in **cursor-plugin-wrapper**.

## Project overview

This repo builds a **single install front door** for Ivcota skill bundles on Cursor. It reads the same **marketplace.json** catalog used by Claude Code and Codex (for example `Ivcota/skills/.claude-plugin/marketplace.json`) and maps each marketplace **plugin** entry (for example `learn-think`, `focus-execute`) to a **Cursor install strategy**.

The first strategy is **skills-cli** (project-scoped `npx skills add`). Native **Cursor marketplace plugins** are a later phase.

Canonical product spec and phased work live in **`plan.md`**. Read that file before implementing features or changing architecture.

## Related repos (not submodules)

| Repo | Role |
|------|------|
| `Ivcota/skills` | Source skill tree and `.claude-plugin/marketplace.json` bundle definitions |
| This repo | CLI / wrapper that interprets marketplace JSON and installs on Cursor |

Do not copy the full skills tree into this repo. Fetch or reference paths at install time.

## Defaults (locked for Phase 1 unless plan.md changes)

- **Project skill root:** `.agents/skills` via `npx skills add` without `-g`.
- **Lockfile:** `skills-lock.json` in the **target project** where the user runs install, not necessarily in this repo.
- **Bundle state:** `.ivcota/installed-bundles.json` in the target project.
- **Manifest path in source repo:** `.claude-plugin/marketplace.json`.

## Commands (once implemented)

Planned UX (see `plan.md`):

```bash
ivcota install learn-think
ivcota install focus-execute --from Ivcota/skills@main
ivcota list
ivcota remove learn-think
ivcota plan learn-think --dry-run
```

Until the CLI exists, agents should follow **Phase 1** tasks in `plan.md`.

## Verification

After any install-related change, prove behavior in a **temporary git repo**:

1. Run the install command against a real bundle name from `ivcota-skills`.
2. Assert `.agents/skills` contains expected skill folders.
3. Assert `skills-lock.json` and `.ivcota/installed-bundles.json` record the bundle.
4. Run remove and assert idempotency.

## Conventions

- **TypeScript or Node** for the CLI is the default choice in `plan.md` (single package, easy to test manifest parsing).
- Keep marketplace parsing **pure** (no shell in core). Shell out only at the executor boundary for `npx skills`.
- One commit per verifiable unit when implementing; see `plan.md` throughput checkpoint.

## Out of scope here

- Replacing pstack or marketplace plugins already installed globally in Cursor.
- Publishing to `cursor-public` (Phase 3 in `plan.md`).
- Auto-loading all Ivcota skills into `~/.cursor/skills` or `~/.agents/skills`.
