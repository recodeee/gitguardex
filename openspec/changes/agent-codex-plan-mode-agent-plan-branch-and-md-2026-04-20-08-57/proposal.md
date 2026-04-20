## Why

- `ralplan` and Claude plan-mode workflows were not guaranteed to start from a
  dedicated planning branch role, so planning sessions looked like generic
  execution branches.
- Plan-mode sessions also lacked a guaranteed persisted markdown artifact under
  `.omx/plans/`, making phase handoff/re-entry inconsistent.

## What Changes

- Add plan-mode detection to `scripts/agent-branch-start.sh` and
  `templates/scripts/agent-branch-start.sh` using:
  - explicit flags (`--plan-mode` / `--no-plan-mode`)
  - permission-mode signals (`*PERMISSION_MODE=plan`)
  - ralplan workflow hints (`*WORKFLOW_KEYWORD` / `*ACTIVE_SKILL`)
  - recent active `.omx/state/sessions/*/ralplan-state.json`
- Force plan-mode starts onto `agent/plan/<task>-<timestamp>` while preserving
  `agent/*` guardrail compatibility.
- Generate `.omx/plans/<YYYY-MM-DD>-<task>.md` for plan-mode starts with a PRD
  structure and phased backlog template.
- Teach `scripts/codex-agent.sh` and `templates/scripts/codex-agent.sh` to pass
  `--plan-mode` to branch-start when Codex/Claude args include
  `--permission-mode plan` or plan-mode env toggles.
- Add regression tests in `test/install.test.js` for:
  - explicit plan-mode branch + markdown artifact creation
  - Claude plan-permission env auto-detection
  - codex-agent forwarding of `--permission-mode plan`

## Impact

- Affected surfaces:
  - `scripts/agent-branch-start.sh`
  - `templates/scripts/agent-branch-start.sh`
  - `scripts/codex-agent.sh`
  - `templates/scripts/codex-agent.sh`
  - `test/install.test.js`
- Risk: false-positive plan-mode activation from stale ralplan state files.
  Mitigation: only treat recent (<=6h) active ralplan state as a signal.
- Branch naming remains under `agent/*`, so pre-commit, finish, and prune
  guardrails continue to work without contract changes.
