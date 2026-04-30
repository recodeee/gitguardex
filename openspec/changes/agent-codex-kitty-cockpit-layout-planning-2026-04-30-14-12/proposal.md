## Why

- Kitty cockpit needs a deterministic command plan before wiring real pane execution.
- The control/welcome area must stay visible while agent terminals launch on the other side.

## What Changes

- Add a pure `createKittyCockpitPlan` module for Kitty cockpit layout planning.
- Emit ordered command steps for control launch, agent-area launch, each agent terminal, and final control focus.
- Preserve branch, worktree, and lock creation in existing GitGuardEx flows.

## Impact

- Adds planner-only Kitty cockpit behavior under `src/cockpit`.
- Does not execute Kitty commands, create worktrees, claim locks, or change tmux behavior.
