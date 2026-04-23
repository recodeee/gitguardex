## Why

- The repo now ships a VS Code Source Control companion for Active Agents, but the Explorer still lacks repo-specific visual cues for OpenSpec folders, agent surfaces, and hook files.
- Active Agents rows also do not distinguish Codex/OpenAI versus Claude sessions, snapshot identity, or branch-group semantics in the place operators watch most closely: the working row beside the loader.

## What Changes

- Add a bundled `GitGuardex File Icons` theme to the shipped VS Code companion with distinct icons for OpenSpec `changes`, `plan`, `specs`, agent surfaces, hook paths, and related config/context files.
- Surface provider-aware Active Agents row copy and badges so Codex/OpenAI sessions read as `OpenAI`, Claude sessions read as `Claude`, snapshot-backed rows show the snapshot name and initial badge, and raw agent branch groups use a branch icon plus `working: agent` state copy.
- Keep the live extension, template extension, packaging metadata, docs, and focused tests aligned.

## Impact

- Affected surfaces: `vscode/guardex-active-agents/*`, `templates/vscode/guardex-active-agents/*`, `src/context.js`, `test/vscode-active-agents-session-state.test.js`, `test/metadata.test.js`, and `test/setup.test.js`.
- Risk stays narrow: this is presentation-only work inside the VS Code companion bundle and its packaging metadata.
- Operator caveat: Explorer icons require selecting the bundled file icon theme inside VS Code; the Active Agents row/provider badges work immediately once the updated extension is installed.
