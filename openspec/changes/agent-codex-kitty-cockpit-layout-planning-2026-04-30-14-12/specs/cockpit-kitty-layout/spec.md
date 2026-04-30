## ADDED Requirements

### Requirement: Kitty cockpit layout command plans
GitGuardEx SHALL provide a pure Kitty cockpit layout planner that returns a deterministic command plan for a persistent control/welcome area and right-side agent terminals.

#### Scenario: One agent layout
- **GIVEN** a repo root, session name, control command, welcome command, and one agent with a worktree
- **WHEN** the Kitty cockpit layout planner is called
- **THEN** the plan includes one control launch command
- **AND** the plan includes one agent terminal launch command rooted at that agent worktree.

#### Scenario: Many agent layout
- **GIVEN** multiple agents in a fixed input order
- **WHEN** the Kitty cockpit layout planner is called more than once with the same input
- **THEN** the plan uses stable ordered titles for the agents
- **AND** both planner calls return identical output.

#### Scenario: Safety ownership remains external
- **GIVEN** agents that already have cwd or worktree paths
- **WHEN** the Kitty cockpit layout planner builds commands
- **THEN** the plan preserves those cwd values
- **AND** the planner does not create branches, worktrees, locks, or other GitGuardEx ownership state.
