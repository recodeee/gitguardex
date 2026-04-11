#!/usr/bin/env bash
set -euo pipefail

TASK_NAME="${MUSAFETY_TASK_NAME:-task}"
AGENT_NAME="${MUSAFETY_AGENT_NAME:-agent}"
BASE_BRANCH="${MUSAFETY_BASE_BRANCH:-}"
BASE_BRANCH_EXPLICIT=0
CODEX_BIN="${MUSAFETY_CODEX_BIN:-codex}"

if [[ -n "$BASE_BRANCH" ]]; then
  BASE_BRANCH_EXPLICIT=1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task)
      TASK_NAME="${2:-$TASK_NAME}"
      shift 2
      ;;
    --agent)
      AGENT_NAME="${2:-$AGENT_NAME}"
      shift 2
      ;;
    --base)
      BASE_BRANCH="${2:-$BASE_BRANCH}"
      BASE_BRANCH_EXPLICIT=1
      shift 2
      ;;
    --codex-bin)
      CODEX_BIN="${2:-$CODEX_BIN}"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      break
      ;;
    *)
      TASK_NAME="$1"
      shift
      if [[ $# -gt 0 && "${1:-}" != -* ]]; then
        AGENT_NAME="$1"
        shift
      fi
      if [[ $# -gt 0 && "${1:-}" != -* ]]; then
        BASE_BRANCH="$1"
        BASE_BRANCH_EXPLICIT=1
        shift
      fi
      break
      ;;
  esac
done

if [[ "$BASE_BRANCH_EXPLICIT" -eq 1 && -z "$BASE_BRANCH" ]]; then
  echo "[codex-agent] --base requires a non-empty branch name." >&2
  exit 1
fi

if ! command -v "$CODEX_BIN" >/dev/null 2>&1; then
  echo "[codex-agent] Missing Codex CLI command: $CODEX_BIN" >&2
  echo "[codex-agent] Install Codex first, then retry." >&2
  exit 127
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[codex-agent] Not inside a git repository." >&2
  exit 1
fi
repo_root="$(git rev-parse --show-toplevel)"

if [[ ! -x "${repo_root}/scripts/agent-branch-start.sh" ]]; then
  echo "[codex-agent] Missing scripts/agent-branch-start.sh. Run: gx setup" >&2
  exit 1
fi

start_args=("$TASK_NAME" "$AGENT_NAME")
if [[ "$BASE_BRANCH_EXPLICIT" -eq 1 ]]; then
  start_args+=("$BASE_BRANCH")
fi

start_output="$(bash "${repo_root}/scripts/agent-branch-start.sh" "${start_args[@]}")"
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
set +e
"$CODEX_BIN" "$@"
codex_exit="$?"
set -e

cd "$repo_root"

if [[ -x "${repo_root}/scripts/agent-worktree-prune.sh" ]]; then
  echo "[codex-agent] Session ended (exit=${codex_exit}). Running worktree cleanup..."
  prune_args=()
  if [[ "$BASE_BRANCH_EXPLICIT" -eq 1 ]]; then
    prune_args+=(--base "$BASE_BRANCH")
  fi
  if ! bash "${repo_root}/scripts/agent-worktree-prune.sh" "${prune_args[@]}"; then
    echo "[codex-agent] Warning: automatic worktree cleanup failed." >&2
  fi
fi

if [[ ! -d "$worktree_path" ]]; then
  echo "[codex-agent] Auto-cleaned sandbox worktree: $worktree_path"
else
  worktree_branch="$(git -C "$worktree_path" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  echo "[codex-agent] Sandbox worktree kept: $worktree_path"
  if [[ -n "$worktree_branch" && "$worktree_branch" != "HEAD" ]]; then
    echo "[codex-agent] If finished, merge + clean with: bash scripts/agent-branch-finish.sh --branch \"${worktree_branch}\""
  fi
fi

exit "$codex_exit"
