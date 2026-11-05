# Plan HumanLayer plugin layout

A user previews a bundle whose marketplace row points at `plugins/<name>/` and whose `plugin.json` declares skills as a directory (`"./skills/"`) or omits `skills[]` entirely.

## Sub-features

- `plan-rpi` resolves `rpi` from `humanlayer/skills@main` with GitHub directory listing under the plugin skills folder.

## How to get to it (user POV)

- Run `deck plan rpi --from humanlayer/skills@main`.

## Driving it with deck CLI

Preconditions:

- `doctor.sh` passes.
- Network can reach GitHub raw URLs and the GitHub contents API for directory listing.

- **Preview bundle.** Run `node dist/cli.js plan rpi --from humanlayer/skills@main`. Exit code 0. Stdout JSON lists `humanlayer/skills/plugins/rpi/skills/rpi`.
- **Proof.** Save stdout to `evidence/$RUN_ID/plan-humanlayer-rpi.json`. Assert exactly one package with that prefix.

## Gotchas

- Skill paths in `plugin.json` are relative to the plugin `source` folder, not the repo root.
- Directory-style `skills` values require a contents API fetch; raw.githubusercontent.com alone is not enough.
- Other HumanLayer bundles follow the same layout; `rpi` is the smoke representative.
