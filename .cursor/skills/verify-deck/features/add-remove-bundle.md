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

- **Install.** From temp workdir, run `node <repo>/dist/cli.js add write-communicate --manifest <repo>/test/fixtures/ivcota-write-communicate.json --from Ivcota/skills@main`. Exit 0. File `.ivcota/installed-bundles.json` exists with `status` `complete`. Four skill directories appear under `.agents/skills/`.
- **Remove.** Run `node <repo>/dist/cli.js rm write-communicate`. Exit 0. Ledger entry gone.
- **Proof.** Save combined stdout/stderr to `evidence/$RUN_ID/add-rm.transcript`. Copy ledger after add to `ledger-after-add.json` before rm.

## Gotchas

- This uses real `npx skills add`; it is slow and needs network.
- Do not run add against the skill-deck repository root unless you intend to mutate that tree.
- Skill folder names on disk follow the skills CLI, not necessarily the marketplace folder names.
