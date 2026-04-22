## ADDED Requirements

### Requirement: cli-surface-cleanup behavior
The system SHALL enforce cli-surface-cleanup behavior as defined by this change.

#### Scenario: Split command suites use isolated helper state
- **WHEN** the integration suite exercises setup/doctor/branch/finish/sandbox/release
  coverage
- **THEN** those tests SHALL live in focused test files instead of one monolithic
  `test/install.test.js`
- **AND** shared helpers SHALL allocate Guardex-home state per test flow unless a
  test explicitly opts into a shared path
- **AND** helper wrappers SHALL make agent-env stripping explicit instead of silently
  removing session variables from every spawned command.

### Requirement: managed file rules derive from one registry
Setup, doctor, scan, migrate, and targeted `--force` behavior SHALL derive managed
file rules from one shared managed-file registry.

#### Scenario: one record drives required, critical, and legacy decisions
- **WHEN** the CLI evaluates a managed path
- **THEN** required-file checks, critical auto-repair, executable-bit handling,
  targeted-force eligibility, and legacy-file cleanup SHALL come from the same
  managed-file definition for that relative path.

### Requirement: public CLI help stays on canonical surfaces
The public command/help output SHALL emphasize canonical user-facing commands and
hide internal backdoors.

#### Scenario: help output omits internal-only commands
- **WHEN** the user runs `gx help`, `gx`, or command catalogs derived from the public
  registry
- **THEN** internal shell-dispatch commands SHALL be hidden
- **AND** the user-facing setup surface SHALL expose skill installation through
  `gx setup`
- **AND** deprecated aliases SHALL not require duplicate public command entries.

### Requirement: default status/update flows avoid surprise side effects
The default status path SHALL favor explicit user action over automatic mutation.

#### Scenario: update checks report manual next steps
- **WHEN** a newer GitGuardex version is detected during the default invocation or
  `gx version`
- **THEN** the CLI SHALL print the manual install command needed to update
- **AND** SHALL NOT auto-install or restart into a different binary during that
  invocation.
