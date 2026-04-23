## ADDED Requirements

### Requirement: Active Agents rows show provider-aware working state

Active Agents session rows SHALL surface provider identity for Codex/OpenAI and Claude sessions without sacrificing higher-priority warning badges.

#### Scenario: Codex session shows OpenAI branding in the row

- **GIVEN** an active session record whose CLI or agent identity resolves to Codex/OpenAI
- **WHEN** the Active Agents tree renders the session row
- **THEN** the row description includes `OpenAI`
- **AND** the session decoration exposes an `AI` badge whenever no blocked/dead/stalled/idle-threshold badge overrides it

#### Scenario: Snapshot session shows the snapshot name and badge

- **GIVEN** an active session or managed worktree telemetry record carries snapshot identity such as `nagyviktor@edixa.com`
- **WHEN** the Active Agents tree renders the session row
- **THEN** the row description includes the snapshot name
- **AND** the session decoration exposes the first alphanumeric snapshot initial, such as `N`, ahead of provider-only badges

#### Scenario: Claude session shows Claude branding in the row

- **GIVEN** an active session record whose CLI or agent identity resolves to Claude
- **WHEN** the Active Agents tree renders the session row
- **THEN** the row description includes `Claude`
- **AND** the session decoration exposes a `CL` badge whenever no blocked/dead/stalled/idle-threshold badge overrides it

#### Scenario: Raw agent branch groups use branch presentation

- **GIVEN** the Active Agents raw tree groups sessions by worktree branch
- **WHEN** a worktree group is rendered
- **THEN** the row uses the VS Code `git-branch` icon instead of the generic folder icon
- **AND** the row description includes the current state plus agent name, such as `working: codex`

### Requirement: Bundled Explorer file icon theme highlights repo workflow surfaces

The shipped VS Code companion SHALL bundle an optional file icon theme that gives workflow-critical repo paths distinct Explorer icons.

#### Scenario: OpenSpec and workflow folders receive semantic icons

- **GIVEN** the bundled `GitGuardex File Icons` theme is selected in VS Code
- **WHEN** the Explorer renders folders named `changes`, `plan`, `specs`, `.agents`, `agent-worktrees`, `.githooks`, or `rules`
- **THEN** each folder uses a bundled semantic icon instead of the generic default

#### Scenario: Key workflow files receive semantic icons

- **GIVEN** the bundled `GitGuardex File Icons` theme is selected in VS Code
- **WHEN** the Explorer renders workflow files such as `AGENTS.md`, `CLAUDE.md`, `proposal.md`, `tasks.md`, `plan.md`, `spec.md`, `config.yaml`, `.openspec.yaml`, `context-docs-cue.md`, `pre-commit`, `pre-push`, or `post-checkout`
- **THEN** each file uses the corresponding bundled semantic icon

#### Scenario: Install bundle ships the icon theme assets

- **GIVEN** maintainers install the workspace extension bundle through `scripts/install-vscode-active-agents-extension.js`
- **WHEN** the extension payload is copied into the VS Code extensions directory
- **THEN** the installed bundle contains the icon-theme manifest plus the SVG assets referenced by it
