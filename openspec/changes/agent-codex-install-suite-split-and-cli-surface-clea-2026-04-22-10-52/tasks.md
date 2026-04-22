## Definition of Done

This change is complete only when **all** of the following are true:

- Every checkbox below is checked.
- The agent branch reaches `MERGED` state on `origin` and the PR URL + state are recorded in the completion handoff.
- If any step blocks (test failure, conflict, ambiguous result), append a `BLOCKED:` line under section 4 explaining the blocker and **STOP**. Do not tick remaining cleanup boxes; do not silently skip the cleanup pipeline.

## Handoff

- Handoff: change=`agent-codex-install-suite-split-and-cli-surface-clea-2026-04-22-10-52`; branch=`agent/codex/install-suite-split-and-cli-surface-clea-2026-04-22-10-52`; scope=`bin/multiagent-safety.js, test/*.test.js, scripts/agent-file-locks.py, templates/scripts/agent-file-locks.py`; action=`split the install suite, collapse the managed-file contract, then shrink/report the CLI surface before finish`.
- Copy prompt: Continue `agent-codex-install-suite-split-and-cli-surface-clea-2026-04-22-10-52` on branch `agent/codex/install-suite-split-and-cli-surface-clea-2026-04-22-10-52`. Work inside the existing sandbox, review `openspec/changes/agent-codex-install-suite-split-and-cli-surface-clea-2026-04-22-10-52/tasks.md`, continue from the current state instead of creating a new sandbox, and when the work is done run `gx branch finish --branch agent/codex/install-suite-split-and-cli-surface-clea-2026-04-22-10-52 --base main --via-pr --wait-for-merge --cleanup`.

## 1. Specification

- [x] 1.1 Finalize proposal scope and acceptance criteria for `agent-codex-install-suite-split-and-cli-surface-clea-2026-04-22-10-52`.
- [x] 1.2 Define normative requirements in `specs/cli-surface-cleanup/spec.md`.

## 2. Implementation

- [x] 2.1 Extract shared install-suite helpers that isolate Guardex home state, keep
  `runCmd` env handling explicit, and replace the duplicated fake-bin builders with
  a generic `createFakeBin(...)`.
- [x] 2.2 Split the monolithic install coverage into focused suites
  (`test/setup.test.js`, `test/doctor.test.js`, `test/branch.test.js`,
  `test/finish.test.js`, `test/sandbox.test.js`, `test/release.test.js`, plus
  additional focused files as needed) and remove the duplicate self-update prompt
  declaration / module-scope spawn gate.
- [x] 2.3 Replace the scattered managed-file lists with a single managed-file
  registry that derives required, critical, executable, legacy-removal, and
  targeted-force behavior consistently.
- [x] 2.4 Reduce the public CLI surface by:
  - hiding internal-only commands from help
  - folding skill installation into `setup`
  - consolidating prompt/help variants
  - simplifying the default self-update path
  - making doctor auto-finish sweeps opt-in
- [x] 2.5 Add one reporting/logging layer for operations/scan/auto-finish output and
  JSONL invocation traces.

## 3. Verification

- [x] 3.1 Run focused command-suite verification (`node --test` on the new split test
  files plus any remaining misc suite).
- [x] 3.2 Run `openspec validate agent-codex-install-suite-split-and-cli-surface-clea-2026-04-22-10-52 --type change --strict`.
- [x] 3.3 Run `openspec validate --specs`.

## 4. Cleanup (mandatory; run before claiming completion)

- [ ] 4.1 Run the cleanup pipeline: `gx branch finish --branch agent/codex/install-suite-split-and-cli-surface-clea-2026-04-22-10-52 --base main --via-pr --wait-for-merge --cleanup`. This handles commit -> push -> PR create -> merge wait -> worktree prune in one invocation.
- [ ] 4.2 Record the PR URL and final merge state (`MERGED`) in the completion handoff.
- [ ] 4.3 Confirm the sandbox worktree is gone (`git worktree list` no longer shows the agent path; `git branch -a` shows no surviving local/remote refs for the branch).
