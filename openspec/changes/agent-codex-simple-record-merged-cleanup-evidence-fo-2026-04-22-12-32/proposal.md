## Why

- `codex-agent` currently treats any `simple:` task as T1 notes-only work, even when the task text explicitly asks for merged cleanup evidence and a real completion checklist.
- That routing loses the full OpenSpec change workspace (`proposal.md`, `tasks.md`, `spec.md`) the operator needs to carry finish-pipeline proof through PR merge and sandbox cleanup.

## What Changes

- Teach the task-mode decider to promote lightweight-prefixed tasks to T2 when the task wording explicitly asks for merged cleanup evidence or equivalent completion artifacts.
- Keep the normal `simple:` / `quick:` lightweight escape hatch unchanged for ordinary tiny tasks.
- Add a focused regression that proves cleanup-evidence tasks still get a full change workspace without escalating to a plan workspace.

## Impact

- Affects `codex-agent` task routing plus the generated `scripts/codex-agent.sh` template used by setup/install flows.
- Risk is narrow: only lightweight-prefixed tasks with cleanup-evidence wording change tier, and they move from T1 to T2 rather than to a plan-heavy T3 path.
