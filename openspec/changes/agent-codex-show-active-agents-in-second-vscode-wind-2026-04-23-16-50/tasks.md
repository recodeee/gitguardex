## Definition of Done

This change is complete only when **all** of the following are true:

- Every checkbox below is checked.
- The agent branch reaches `MERGED` state on `origin` and the PR URL + state are recorded in the completion handoff.
- If any step blocks (test failure, conflict, ambiguous result), append a `BLOCKED:` line under section 4 explaining the blocker and **STOP**. Do not tick remaining cleanup boxes; do not silently skip the cleanup pipeline.

## Handoff

- Handoff: change=`agent-codex-show-active-agents-in-second-vscode-wind-2026-04-23-16-50`; branch=`agent/codex/show-active-agents-in-second-vscode-wind-2026-04-23-16-50`; scope=`VS Code Active Agents repo-root resolution for second-window worktree/subdir views, template parity, focused regression`; action=`show owning gitguardex agents when another VS Code window opens on a linked worktree or nested repo path, verify, then finish via PR merge cleanup`.
- Completion: PR=`https://github.com/recodeee/gitguardex/pull/382`; state=`MERGED`; merge_commit=`7378ae883dbc4d4d31f2cff54e8f230d39acfb34`; cleanup_evidence=`source worktree removed from git worktree list; local branch deleted; git fetch --prune origin removed origin/agent/codex/show-active-agents-in-second-vscode-wind-2026-04-23-16-50`.

## 1. Specification

- [x] 1.1 Define second-window repo-root resolution requirements.
- [x] 1.2 Keep cleanup evidence requirements explicit.

## 2. Implementation

- [x] 2.1 Resolve workspace folders to owning repo roots before reading Active Agents sessions.
- [x] 2.2 Keep the view scoped to the resolved repo root so a gitguardex window does not show unrelated parent-repo agents.
- [x] 2.3 Mirror extension changes in `templates/vscode/guardex-active-agents/extension.js`.
- [x] 2.4 Add focused regression coverage for a linked-worktree VS Code window.

## 3. Verification

- [x] 3.1 Run `node --test test/vscode-active-agents-session-state.test.js`.
- [x] 3.2 Run `openspec validate agent-codex-show-active-agents-in-second-vscode-wind-2026-04-23-16-50 --type change --strict`.
- [x] 3.3 Run `openspec validate --specs`.

## 4. Cleanup (mandatory; run before claiming completion)

- [x] 4.1 Run `gx branch finish --branch agent/codex/show-active-agents-in-second-vscode-wind-2026-04-23-16-50 --base main --via-pr --wait-for-merge --cleanup`.
- [x] 4.2 Record the PR URL and final merge state (`MERGED`) in the completion handoff.
- [x] 4.3 Confirm the sandbox worktree is gone (`git worktree list` no longer shows the agent path; `git branch -a` shows no surviving local/remote refs for the branch).
