## Why

- `test/install.test.js` has become a grab bag for setup, doctor, branch, finish,
  sandbox, release, prompt, and migration coverage. Shared module-scope state and
  repeated git/bootstrap shell steps make failures noisy and cross-test behavior
  harder to trust.
- The CLI entrypoint has several overlapping managed-file registries, duplicated
  output formatters, and accreted commands/aliases that make setup/doctor/status
  behavior harder to reason about and easier to drift.
- The current self-update and doctor auto-finish behaviors also do more work than
  users expect by default, which adds latency and surprise to otherwise simple
  status/repair flows.

## What Changes

- Split the install integration coverage into shared helpers plus focused command
  suites (`setup`, `doctor`, `branch`, `finish`, `sandbox`, `release`, and related
  follow-on files as needed), while removing the module-scope Guardex-home leak and
  consolidating fake-bin/bootstrap helpers.
- Replace the scattered managed-file constants with one managed-file registry that
  drives setup/doctor/scan/migrate/targeted-force decisions consistently.
- Reduce the public CLI surface by routing user-facing behavior through canonical
  commands/flags, hiding internal backdoors from help, and simplifying the
  update/prompt/install-skills paths.
- Add a single reporting/logging path for command output and per-invocation JSONL
  traces under `.omx/logs/`.

## Impact

- Affected surfaces:
  - `test/*.test.js`
  - `bin/multiagent-safety.js`
  - `scripts/agent-file-locks.py`
  - `templates/scripts/agent-file-locks.py`
- Risks:
  - targeted test-file commands will change as suites move out of
    `test/install.test.js`
  - help/status/doctor output will change materially
  - tightening auto-finish/update defaults can break expectations in existing tests
- Rollout note:
  - preserve behavior first with focused coverage before deleting aliases or moving
    tests wholesale.
