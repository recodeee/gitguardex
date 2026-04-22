## ADDED Requirements

### Requirement: cleanup-evidence tasks keep a full change workspace
The task-mode decider SHALL keep a full OpenSpec change workspace for lightweight-prefixed tasks that explicitly ask for merged cleanup evidence or equivalent completion artifacts.

#### Scenario: lightweight prefix still needs completion artifacts
- **WHEN** `codex-agent` receives a task with a lightweight prefix such as `simple:` and the task wording asks to record merged cleanup evidence, PR URL / `MERGED` state, or equivalent cleanup-pipeline proof
- **THEN** the task is routed to T2
- **AND** the sandbox includes `proposal.md`, `tasks.md`, and `spec.md`
- **AND** no plan workspace is created.

#### Scenario: ordinary lightweight tasks stay notes-only
- **WHEN** `codex-agent` receives a lightweight-prefixed task without cleanup-evidence artifact wording
- **THEN** the task remains on T1 notes-only routing
- **AND** existing small-task caveman behavior is preserved.
