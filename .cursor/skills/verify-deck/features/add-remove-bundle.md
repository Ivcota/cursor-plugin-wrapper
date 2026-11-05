# Add and remove a bundle

A user installs a bundle into a project with `deck add`, then removes it with `deck rm`, using tracked state for uninstall.

## Sub-features

- `add-fixture` installs from `--manifest` pointing at the repo test fixture (no live Ivcota fetch for manifest body).
- `rm-clean` removes skills and deletes the ledger entry.

## How to get to it (user POV)

- In a project directory: `deck add write-communicate --manifest <path> --from Ivcota/skills@main`.
- Then `deck rm write-communicate`.

## Driving it with deck CLI

Preconditions:

- `doctor.sh` passes.
- `npx skills` can run (network).
- Temp workdir initialized with `git init`.

- **Install.** From temp workdir, run `node <repo>/dist/cli.js add write-communicate --manifest <repo>/test/fixtures/ivcota-write-communicate.json --from Ivcota/skills@main`. Exit 0. File `.ivcota/installed-bundles.json` exists with `status` `complete`. Four skill directories appear under `.agents/skills/`. Ledger `skillKeys` holds four **skills-lock.json** ids (no `/`), not the full `packages` add strings.
- **Remove.** Run `node <repo>/dist/cli.js rm write-communicate`. Exit 0. `bundles.write-communicate` is absent from the ledger (the file may remain with an empty `bundles` object). Each id from `skillKeys` must be gone from `skills-lock.json` and its directory gone under `.agents/skills/`.
- **Proof.** Save combined stdout/stderr to `evidence/$RUN_ID/add-rm.transcript`. Copy ledger after add to `ledger-after-add.json` before rm. Optional helper: `scripts/smoke-add-rm.sh`.

## Gotchas

- This uses real `npx skills add` and `npx skills remove`; it is slow and needs network.
- Do not run add against the skill-deck repository root unless you intend to mutate that tree.
- Skill folder names on disk follow the skills CLI, not necessarily the marketplace folder names.
- Invoke the CLI as `node /absolute/path/to/repo/dist/cli.js …` from the temp workdir (or `DECK=(node "$ROOT/dist/cli.js")` before `cd`). Relative `dist/cli.js` resolves against the workdir, not the repo.
- If `deck rm` exits 0 but skill dirs or lockfile entries remain, treat that as a product gap (`npx skills remove`), not as passing `rm-clean`.
