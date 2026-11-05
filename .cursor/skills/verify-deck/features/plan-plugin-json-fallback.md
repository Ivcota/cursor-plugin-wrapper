# Plan plugin.json fallback

A user previews a bundle whose marketplace row has no `skills[]` list; deck reads `.claude-plugin/plugin.json` instead.

## Sub-features

- `plan-mattpocock` resolves `mattpocock-skills` from `mattpocock/skills@main`.

## How to get to it (user POV)

- Run `deck plan mattpocock-skills --from mattpocock/skills@main`.

## Driving it with deck CLI

Preconditions:

- `doctor.sh` passes.
- Network can reach GitHub raw URLs for marketplace and plugin.json.

- **Preview bundle.** Run `node dist/cli.js plan mattpocock-skills --from mattpocock/skills@main`. Exit code 0. Stdout JSON lists many packages under `mattpocock/skills/skills/`.
- **Proof.** Save stdout to `evidence/$RUN_ID/plan-mattpocock-skills.json`. Assert package count is at least 20 (upstream may add skills).

## Gotchas

- First fetch is marketplace.json; second is plugin.json. Partial network failure shows as catalog error.
- Plugin skill paths include a doubled `skills/` segment because of repo layout; that is expected.
