---
name: install-skill-deck
description: >-
  Installs or removes a marketplace skill bundle on Cursor by running the deck
  CLI (marketplace.json or plugin.json → skills CLI). Use when the user asks to
  install, add, remove, list, or plan a named bundle from a catalog. Do not expand
  marketplace paths by hand or loop npx skills add yourself for a bundle.
---

# Install a skill bundle (deck)

Run **one** of these from the **project root**:

```bash
deck add <bundle>
npx skill-deck@latest add <bundle>
```

Remove, preview, or list:

```bash
deck rm <bundle>
deck plan <bundle>
deck ls
```

Use `--from owner/repo@ref` when the user names a catalog other than the default (`Ivcota/skills@main`). Use `--global` only when they asked for user-wide install.

## Never

- Do not read `marketplace.json` and run `npx skills add` per path yourself.
- Do not copy skill folders under `.agents/skills` by hand for a bundle install.

If `deck` is missing, use `npx skill-deck@latest` with the same subcommand.
