# skill-deck (cursor-plugin-wrapper)

CLI adapter that installs **skills** listed under a **marketplace plugin entry** on Cursor, using the skills CLI until native **plugin install** exists (Phase 2). Vocabulary follows [Cursor plugins](https://cursor.com/docs/plugins) and [plugins reference](https://cursor.com/docs/reference/plugins).

## Language

**Plugin**:
A distributable package of Cursor components (rules, skills, agents, commands, MCP, hooks). What operators install when they run `deck add <name>` for a catalog name.
_Avoid_: Bundle (as a noun for the install unit), package (ambiguous)

**Plugin entry**:
One object in the `plugins` array of a **marketplace manifest**; identified by `name` (kebab-case). Same identity as the `<name>` argument to `deck add`, `deck rm`, and `deck plan`.
_Avoid_: Marketplace row, plugin row, bundle name

**Marketplace manifest**:
The multi-plugin catalog file `marketplace.json` (Cursor: `.cursor-plugin/marketplace.json`; Claude-compatible repos may use `.claude-plugin/marketplace.json`).
_Avoid_: Catalog file (without “manifest”), marketplace.json alone as jargon

**Per-plugin manifest**:
The manifest for a single plugin (Cursor Plugin: `.cursor-plugin/plugin.json`; Agent Plugin: root `plugin.json`; Claude-compatible fallback: `.claude-plugin/plugin.json`). Used when a plugin entry has no inline `skills[]`.
_Avoid_: plugin.json (unqualified)

**Skill**:
A specialized capability defined in a `SKILL.md` package. Phase 1 installs skills individually via the skills CLI; a full plugin may include many skills.
_Avoid_: Skill package (unless disambiguating from plugin)

**Skill package**:
The `owner/repo/path` reference passed to the skills CLI after expanding paths from the marketplace or per-plugin manifest.
_Avoid_: Package (alone), npx target

**Skill key**:
The identifier the skills CLI records in its lockfile for an installed skill; used when removing skills during `deck rm`.
_Avoid_: Skill id (unless quoting the lockfile field name)

**Marketplace ref**:
The GitHub (or local) source for a marketplace manifest: `owner/repo@ref`, from `--from` or `SKILL_DECK_FROM`.
_Avoid_: From ref, catalog source

**Project scope**:
Install skills into the current project’s skill directories (default). Matches Cursor’s project-level install.
_Avoid_: Local scope, workspace (unless quoting Cursor UI)

**User scope**:
Install skills into the user’s global skill directories. Selected with `--global`; matches Cursor’s user-level install.
_Avoid_: Global (without “scope”), system-wide

**Installed-plugins ledger**:
Project-local record of which plugin entries were installed from this working directory, at which marketplace ref, with which skill packages and keys. Stored at `.ivcota/installed-bundles.json` (filename retained for compatibility).
_Avoid_: Bundle state, bundle ledger

**Install plan**:
Dry-run output of `deck plan`: which skill packages would be installed for a plugin entry at a given scope and marketplace ref.
_Avoid_: CursorInstallPlan (in operator docs)

**deck**:
The `skill-deck` CLI (`deck`). Phase 1 installs **skills** for a **plugin entry**; it is not Cursor’s native plugin installer.
_Avoid_: Cursor plugin install, marketplace publish
