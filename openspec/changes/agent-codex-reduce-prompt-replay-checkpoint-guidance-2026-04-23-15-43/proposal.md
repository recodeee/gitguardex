# Proposal: reduce prompt replay checkpoint guidance

Guardex already warns against `write_stdin` churn and fragmented loops, but the repo contract still leaves too much room for raw terminal chatter, repeated progress narration, and long execution transcripts to linger in active reasoning context. This change tightens the operator-facing guidance so prompt assembly favors checkpoints and compact tool-result summaries instead of replaying the whole run.

- teach the repo contract to checkpoint after milestones or roughly every 15-25 tool calls
- require raw interactive shell chatter to collapse into process/action/result/next summaries
- teach `gx prompt` to keep execution logs separate from reasoning context
- lock the new wording with focused prompt/snippet tests
