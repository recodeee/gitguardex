## ADDED Requirements

### Requirement: plan-mode-agent-plan-branch-and-md behavior
The system SHALL normalize plan-mode branch starts to a dedicated planning role
and persist a reusable phased plan markdown artifact under `.omx/plans/`.

#### Scenario: explicit plan-mode flag creates `agent/plan/*` branch
- **WHEN** `scripts/agent-branch-start.sh` is called with `--plan-mode`
- **THEN** the created branch SHALL match `agent/plan/<task>-<YYYY-MM-DD-HH-MM>`
- **AND** OpenSpec change/plan slugs SHALL derive from that branch name.

#### Scenario: permission-mode signals auto-enable plan mode
- **WHEN** plan permissions are signaled via environment
  (`CLAUDE_PERMISSION_MODE=plan`, `CODEX_PERMISSION_MODE=plan`, etc.)
- **THEN** `scripts/agent-branch-start.sh` SHALL create an `agent/plan/*` branch
  without requiring `--plan-mode`.

#### Scenario: plan-mode start persists a PRD markdown draft
- **WHEN** a plan-mode sandbox starts
- **THEN** the worktree SHALL contain `.omx/plans/<YYYY-MM-DD>-<task>.md`
- **AND** that markdown SHALL include a PRD layout with numbered sections and a
  phased backlog (Phase 1..4 template).

### Requirement: codex-agent plan-mode forwarding
`scripts/codex-agent.sh` and template variants SHALL forward plan-mode intent to
branch-start.

#### Scenario: `--permission-mode plan` is passed through codex-agent
- **WHEN** `scripts/codex-agent.sh ... --permission-mode plan` is run
- **THEN** the starter invocation SHALL include `--plan-mode`
- **AND** the resulting sandbox branch SHALL be `agent/plan/*`.
