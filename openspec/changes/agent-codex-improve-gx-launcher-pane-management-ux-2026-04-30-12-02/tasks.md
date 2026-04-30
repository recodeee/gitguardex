## Definition of Done

This change is complete only when **all** of the following are true:

- Every checkbox below is checked.
- The agent branch reaches `MERGED` state on `origin` and the PR URL + state are recorded in the completion handoff.
- If any step blocks (test failure, conflict, ambiguous result), append a `BLOCKED:` line under section 4 explaining the blocker and **STOP**. Do not tick remaining cleanup boxes; do not silently skip the cleanup pipeline.

## Handoff

- Handoff: change=`agent-codex-improve-gx-launcher-pane-management-ux-2026-04-30-12-02`; branch=`agent/codex/improve-gx-launcher-pane-management-ux-2026-04-30-12-02`; scope=`TODO`; action=`continue this sandbox or finish cleanup after a usage-limit/manual takeover`.
- Copy prompt: Continue `agent-codex-improve-gx-launcher-pane-management-ux-2026-04-30-12-02` on branch `agent/codex/improve-gx-launcher-pane-management-ux-2026-04-30-12-02`. Work inside the existing sandbox, review `openspec/changes/agent-codex-improve-gx-launcher-pane-management-ux-2026-04-30-12-02/tasks.md`, continue from the current state instead of creating a new sandbox, and when the work is done run `gx branch finish --branch agent/codex/improve-gx-launcher-pane-management-ux-2026-04-30-12-02 --base main --via-pr --wait-for-merge --cleanup`.

## 1. Specification

- [x] 1.1 Finalize proposal scope and acceptance criteria for `agent-codex-improve-gx-launcher-pane-management-ux-2026-04-30-12-02`.
- [x] 1.2 Define normative requirements in `specs/agents-interactive-launcher/spec.md`.

## 2. Implementation

- [x] 2.1 Implement scoped behavior changes.
- [x] 2.2 Add/update focused regression coverage.

## 3. Verification

- [x] 3.1 Run targeted project verification commands.
  - Evidence: `node --test test/agents-selection-panel.test.js test/agents-start-dry-run.test.js` passed (`12/12`).
  - Evidence: `git diff --check` passed.
- [x] 3.2 Run `openspec validate agent-codex-improve-gx-launcher-pane-management-ux-2026-04-30-12-02 --type change --strict`.
  - Evidence: change is valid.
- [x] 3.3 Run `openspec validate --specs`.
  - Evidence: command completed with `No items found to validate.`

## 4. Cleanup (mandatory; run before claiming completion)

- [x] 4.1 Run the cleanup pipeline: `gx branch finish --branch agent/codex/improve-gx-launcher-pane-management-ux-2026-04-30-12-02 --base main --via-pr --wait-for-merge --cleanup`. This handles commit -> push -> PR create -> merge wait -> worktree prune in one invocation.
  - Evidence: PR #495 merged as https://github.com/recodeee/gitguardex/pull/495 (`MERGED`, merge commit `e4b45db79f2c6ea699b4ed41edf69f5aa54fe84f`, merged at `2026-04-30T10:17:40Z`).
- [x] 4.2 Record the PR URL and final merge state (`MERGED`) in the completion handoff.
  - Evidence: Colony task note recorded PR #495 merge and cleanup state.
- [x] 4.3 Confirm the sandbox worktree is gone (`git worktree list` no longer shows the agent path; `git branch -a` shows no surviving local/remote refs for the branch).
  - Evidence: `git worktree list` shows only `/home/deadpool/Documents/recodee/gitguardex`; local and remote `agent/codex/improve-gx-launcher-pane-management-ux-2026-04-30-12-02` refs are absent.
