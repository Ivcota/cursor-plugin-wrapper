---
name: install-skill-deck
description: >-
  Installs or removes skills for a marketplace plugin entry on Cursor by running
  the deck CLI (marketplace manifest or per-plugin manifest → skills CLI). Use when
  the user asks to install, add, remove, list, or plan a named plugin from a catalog.
  Do not expand marketplace paths by hand or loop npx skills add yourself for a plugin.
---

# Install marketplace plugin skills (deck)

Run **one** of these from the **project root**:

```bash
deck add <plugin>
npx --yes github:Ivcota/cursor-plugin-wrapper deck add <plugin>
```

Remove, preview, or list:

```bash
deck rm <plugin>
deck plan <plugin>
deck ls
```

Use `--from owner/repo@ref` when the user names a catalog other than the default (`Ivcota/skills@main`). Use `--global` only when they asked for **user scope** (Cursor user-level install).

## Never

- Do not read `marketplace.json` and run `npx skills add` per path yourself.
- Do not copy skill folders under `.agents/skills` by hand for a plugin install.

If `deck` is missing, use `npx --yes github:Ivcota/cursor-plugin-wrapper deck <subcommand>` (see README install options).

Vocabulary: [GLOSSARY.md](https://github.com/Ivcota/cursor-plugin-wrapper/blob/main/GLOSSARY.md) in the skill-deck repo.
