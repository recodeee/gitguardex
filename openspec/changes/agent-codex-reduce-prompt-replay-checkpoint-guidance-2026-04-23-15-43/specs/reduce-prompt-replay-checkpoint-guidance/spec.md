# reduce-prompt-replay-checkpoint-guidance Specification

## ADDED Requirements

### Requirement: Token-efficiency guidance teaches checkpoint compaction
Guardex prompt and template guidance MUST tell operators to replace long rolling transcripts with compact checkpoints when a run becomes fragmented or crosses multiple milestones.

#### Scenario: Managed AGENTS template covers checkpoint-only context
- **WHEN** an operator uses the managed multi-agent safety template for token-sensitive work
- **THEN** the template tells them to keep raw terminal interaction out of long-lived context
- **AND** it instructs them to retain only the latest one or two checkpoints plus the latest tool-result summary
- **AND** it names a fixed checkpoint shape containing `Task`, `Done`, `Current status`, and `Next`

### Requirement: gx prompt task loop teaches transcript-vs-context separation
The `gx prompt` task loop MUST describe how to checkpoint a run instead of replaying raw terminal chatter.

#### Scenario: Task loop output includes checkpoint instructions
- **WHEN** an operator runs `gx prompt`
- **THEN** the task loop output includes checkpoint wording that names `Task -> Done -> Current status -> Next`
- **AND** it tells operators to keep only the latest checkpoint(s) in active context
- **AND** it tells operators to summarize tool results while keeping execution logs separate from reasoning context
