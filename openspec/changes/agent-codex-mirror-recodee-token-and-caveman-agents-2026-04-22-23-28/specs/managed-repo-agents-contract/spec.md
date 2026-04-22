## ADDED Requirements

### Requirement: Managed repos inherit low-overhead execution guidance
The Guardex-managed `AGENTS.md` block SHALL include repo-generic token/context
budget guidance so freshly bootstrapped repos inherit the same low-overhead
execution rules used in `recodee`.

#### Scenario: Setup installs token budget guidance
- **GIVEN** `gx setup` or `gx install` creates or refreshes `AGENTS.md`
- **WHEN** the managed block is written into a repo
- **THEN** it includes a `## Token / Context Budget` section
- **AND** that section tells agents to keep startup summaries tiny, batch work
  by phase, and collapse fragmented runs back to inspect once / patch once /
  verify once.

### Requirement: Managed repos inherit Caveman output rules
The Guardex-managed `AGENTS.md` block SHALL include repo-generic Caveman output
rules so downstream repos match the same commentary and literal-preservation
behavior used in `recodee`.

#### Scenario: Prompt snippet exposes Caveman rules
- **WHEN** a user runs `gx prompt --snippet`
- **THEN** the printed managed block includes `## OMX Caveman Style`
- **AND** it preserves the answer-first / cause-next / next-step-last ordering
  plus the rule that literals stay exact.
