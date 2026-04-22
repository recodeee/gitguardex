## Why

- Guardex-managed repos already get the safety/worktree contract, but they do not
  inherit the tighter token-budget and Caveman execution rules that live in
  `recodee`'s repo contract.
- Users setting up new repos with `gx setup` should get the same low-overhead
  AGENTS guidance by default instead of re-adding it repo by repo.

## What Changes

- Extend the managed `AGENTS.md` snippet with compact `Token / Context Budget`
  and `OMX Caveman Style` sections that are generic enough for any Guardex
  repo.
- Sync this repo's checked-in `AGENTS.md` managed block to the updated template.
- Lock the new wording with focused install/setup and `gx prompt --snippet`
  regressions.

## Impact

- Affected surfaces: `templates/AGENTS.multiagent-safety.md`, the checked-in
  `AGENTS.md` managed block, and prompt/setup regression coverage.
- Risk is low because the change is prompt/contract-only, but template drift
  would immediately affect newly bootstrapped repos if left untested.
