# cursor-plugin-wrapper (skill-deck)

Install marketplace **skill bundles** on Cursor from the same **marketplace.json** family used by Claude Code and Codex.

```bash
npm install -g skill-deck   # bin: deck
deck add write-communicate --from Ivcota/skills@main
deck plan mattpocock-skills --from mattpocock/skills@main
deck rm write-communicate
```

Bundle state is stored in `.ivcota/installed-bundles.json`. Skills are installed via `npx skills add` into `.agents/skills` (project scope by default).

See **[plan.md](./plan.md)** for phases and architecture. Chat agents can use the **`install-skill-deck`** skill (shell out to `deck` only).

## Problem

- Claude: `claude plugin install learn-think@ivcota-skills`
- Cursor (today): many `npx skills add owner/repo/...` lines

**deck** reads the catalog (and `plugin.json` when the marketplace row has no `skills[]`) and installs the right subset in one command.

## Related

- Skill source and catalog: [Ivcota/skills](https://github.com/Ivcota/skills)
- Example community catalog: [mattpocock/skills](https://github.com/mattpocock/skills)
