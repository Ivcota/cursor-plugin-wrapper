# cursor-plugin-wrapper (skill-deck)

Install marketplace **skill bundles** on Cursor from the same **marketplace.json** family used by Claude Code and Codex.

Repository: **https://github.com/Ivcota/cursor-plugin-wrapper**

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
# project (.agents/skills)
npx skills add Ivcota/cursor-plugin-wrapper/install-skill-deck -y -a cursor

# or global (~/.cursor/skills)
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

- **`--global`** — install into user skills dir instead of `.agents/skills`
- **`--manifest ./path/to/marketplace.json`** — local catalog file
- **`--json`** — machine-readable stdout

Bundle state: `.ivcota/installed-bundles.json` in that project. Skills are installed via `npx skills add` (Cursor agent `-a cursor`).

Default catalog when `--from` is omitted: `Ivcota/skills@main` (override with env `SKILL_DECK_FROM=owner/repo@ref`).

## Problem

- Claude: `claude plugin install learn-think@ivcota-skills`
- Cursor (today): many `npx skills add owner/repo/...` lines

**deck** reads the catalog (and `plugin.json` when the marketplace row has no `skills[]`) and installs the right subset in one command.

## Related

- Skill source and catalog: [Ivcota/skills](https://github.com/Ivcota/skills)
- Example community catalog: [mattpocock/skills](https://github.com/mattpocock/skills)
- Architecture: **[plan.md](./plan.md)**
