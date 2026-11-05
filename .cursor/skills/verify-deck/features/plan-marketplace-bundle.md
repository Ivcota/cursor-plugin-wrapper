# Plan a marketplace bundle

A user previews which skill packages a named bundle would install before changing their project.

## Sub-features

- `plan-ivcota` resolves `write-communicate` from `Ivcota/skills@main`.
- `plan-json` emits pretty-printed JSON to stdout.

## How to get to it (user POV)

- Run `deck plan <bundle>` with optional `--from owner/repo@ref`.

## Driving it with deck CLI

Preconditions:

- `doctor.sh` passes.
- Network can reach `raw.githubusercontent.com`.

- **Preview bundle.** Run `node dist/cli.js plan write-communicate --from Ivcota/skills@main`. Exit code 0. Stdout JSON has `kind` `skills-cli` and exactly four packages under `Ivcota/skills/write-communicate/`.
- **Proof.** Save stdout to `evidence/$RUN_ID/plan-write-communicate.json`. Re-parse in Node or `jq` to count packages.

## Gotchas

- `plan` does not write `.ivcota/`; absence of ledger is expected.
- Bundle name is `write-communicate`, not a skill path with slashes.
- Catalog must match live `main`; package count may change if upstream edits the bundle.
