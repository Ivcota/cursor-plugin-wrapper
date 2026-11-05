# cursor-plugin-wrapper (skill-deck)

Install **skills** from a **marketplace plugin entry** on Cursor, using the same **marketplace manifest** family as Claude Code and Codex. Phase 1 uses the skills CLI; it is not Cursor’s native **Install plugin** flow (see [Cursor plugins](https://cursor.com/docs/plugins)).

Repository: **https://github.com/Ivcota/cursor-plugin-wrapper**  
Terminology: **[GLOSSARY.md](./GLOSSARY.md)**

## Install `deck`

Requires **Node 18+** and network access for `npx skills` when you run `deck add`.

### Option A — global CLI from GitHub (recommended)

```bash
npm install -g github:Ivcota/cursor-plugin-wrapper
deck ls
```

Install runs `npm run build` automatically (`prepare` script). The command on your PATH is **`deck`**.

Pin a branch or tag:

```bash
npm install -g github:Ivcota/cursor-plugin-wrapper#main
```

### Option B — one project, no global install

From the repo root after clone:

```bash
git clone https://github.com/Ivcota/cursor-plugin-wrapper.git
cd cursor-plugin-wrapper
npm ci
npm run deck -- ls
```

Use `npm run deck -- <subcommand>` anywhere, or `npm link` once to get `deck` on PATH.

### Option C — run without installing globally

```bash
npx --yes github:Ivcota/cursor-plugin-wrapper deck plan write-communicate --from Ivcota/skills@main
```

(`npx` downloads the repo, builds, and runs the `deck` binary.)

### Option D — Cursor agent skill (chat)

Teaches the agent to shell out to `deck` / `npx github:Ivcota/cursor-plugin-wrapper` only:

```bash
# project scope (.agents/skills)
npx skills add Ivcota/cursor-plugin-wrapper/install-skill-deck -y -a cursor

# user scope (~/.cursor/skills)
npx skills add Ivcota/cursor-plugin-wrapper/install-skill-deck -y -a cursor -g
```

## Use

Run these from the **project** where you want skills installed (not necessarily the skill-deck repo):

```bash
deck add write-communicate --from Ivcota/skills@main
deck plan mattpocock-skills --from mattpocock/skills@main
deck rm write-communicate
deck ls
```

- **`--global`** — **user scope** (user skill dirs); default is **project scope** (`.agents/skills`)
- **`--manifest ./path/to/marketplace.json`** — local marketplace manifest
- **`--json`** — machine-readable stdout

**Installed-plugins ledger:** `.ivcota/installed-bundles.json` in the **current working directory** (even when using `--global`). Re-run `deck add <plugin>` to resume a **partial** install. Skills are installed via `npx skills add` (Cursor agent `-a cursor`).

Default catalog when `--from` is omitted: `Ivcota/skills@main` (override with env `SKILL_DECK_FROM=owner/repo@ref`). Remote fetch tries `.cursor-plugin/marketplace.json`, then `.claude-plugin/marketplace.json`.

## Problem

- Claude: `claude plugin install learn-think@ivcota-skills`
- Cursor (today): many `npx skills add owner/repo/...` lines

**deck** reads the marketplace manifest (and per-plugin manifest when the plugin entry has no `skills[]`) and installs the right skill packages in one command.

## Related

- Skill source and catalog: [Ivcota/skills](https://github.com/Ivcota/skills)
- Example community catalog: [mattpocock/skills](https://github.com/mattpocock/skills)
- Architecture: **[plan.md](./plan.md)**
