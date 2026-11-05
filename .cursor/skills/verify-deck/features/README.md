# deck verification map

Maintained recipes for user-facing **deck** behavior. Read this index, then open the feature file you need.

## Baseline preconditions

- Repository root is `cursor-plugin-wrapper` (skill-deck source).
- `npm ci && npm run build` completed successfully.
- `.cursor/skills/verify-deck/scripts/doctor.sh` exits 0.
- `RUN_ID` set; evidence goes to `.cursor/skills/verify-deck/evidence/$RUN_ID/`.
- Mutating flows use a **temp git repo** as cwd, never this repository root.

## Driving conventions

- Invoke `node dist/cli.js` (or `npm run deck --`) from the **repo root** for plan commands (cwd does not affect plan output).
- For `add` / `rm`, `cd` into the temp workdir first.
- Capture stdout, stderr, and exit code for every command.
- Do not substitute manual `npx skills add` for bundle installs when verifying deck.

## Proof and skip reporting

- Plan proof: parsed JSON with expected package count and prefixes.
- Add/rm proof: ledger (`skillKeys` as lockfile ids), `skills-lock.json`, `.agents/skills/` after add and after rm, plus command transcript.
- If GitHub or `npx skills` is unreachable, report the failure and do not claim the feature verified.

## Features

- [Plan a marketplace bundle](./plan-marketplace-bundle.md) — Ivcota-style row with `skills[]` (live network).
- [Plan plugin.json fallback](./plan-plugin-json-fallback.md) — Matt Pocock-style row without inline skills (live network).
- [Plan HumanLayer plugin layout](./plan-humanlayer-plugin-layout.md) — nested `plugins/<name>/` with directory `skills` (live network + contents API).
- [Add and remove a bundle](./add-remove-bundle.md) — install and uninstall using a local manifest fixture (calls real `npx skills`).
