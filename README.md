# cursor-plugin-wrapper

Install Ivcota skill **bundles** on Cursor from the same **marketplace.json** used by Claude Code and Codex.

```bash
# Planned (Phase 1)
ivcota install learn-think
ivcota remove learn-think
```

Today this repository contains the **plan and agent docs** only. See **[plan.md](./plan.md)** for implementation phases and **[AGENTS.md](./AGENTS.md)** for Cursor agent instructions.

## Problem

- Claude: `claude plugin install learn-think@ivcota-skills`
- Cursor (today): many `npx skills add Ivcota/skills/...` lines

This project adds one command that reads the marketplace catalog and installs the right subset **project-scoped** by default.

## Related

- Skill source and catalog: [Ivcota/skills](https://github.com/Ivcota/skills)
