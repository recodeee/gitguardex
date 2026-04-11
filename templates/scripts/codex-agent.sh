#!/usr/bin/env bash
set -euo pipefail

TASK_NAME="${1:-task}"
AGENT_NAME="${2:-agent}"
BASE_BRANCH="${3:-dev}"
CODEX_BIN="${MUSAFETY_CODEX_BIN:-codex}"

if [[ $# -ge 1 ]]; then shift; fi
if [[ $# -ge 1 ]]; then shift; fi
if [[ $# -ge 1 ]]; then shift; fi

if ! command -v "$CODEX_BIN" >/dev/null 2>&1; then
  echo "[codex-agent] Missing Codex CLI command: $CODEX_BIN" >&2
  echo "[codex-agent] Install Codex first, then retry." >&2
  exit 127
fi

if [[ ! -x "scripts/agent-branch-start.sh" ]]; then
  echo "[codex-agent] Missing scripts/agent-branch-start.sh. Run: musafety setup" >&2
  exit 1
fi

start_output="$(bash scripts/agent-branch-start.sh "$TASK_NAME" "$AGENT_NAME" "$BASE_BRANCH")"
printf '%s\n' "$start_output"

worktree_path="$(printf '%s\n' "$start_output" | sed -n 's/^\[agent-branch-start\] Worktree: //p' | tail -n1)"
if [[ -z "$worktree_path" ]]; then
  echo "[codex-agent] Could not determine sandbox worktree path from agent-branch-start output." >&2
  exit 1
fi

if [[ ! -d "$worktree_path" ]]; then
  echo "[codex-agent] Reported worktree path does not exist: $worktree_path" >&2
  exit 1
fi

echo "[codex-agent] Launching ${CODEX_BIN} in sandbox: $worktree_path"
cd "$worktree_path"
exec "$CODEX_BIN" "$@"
