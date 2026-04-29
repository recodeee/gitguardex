const { TOOL_NAME } = require('../context');
const finishCommands = require('../finish');
const {
  readAgentSession,
  updateAgentSession,
  listAgentSessions,
} = require('./sessions');

function resolveSessionByBranch(repoRoot, branch) {
  const matches = listAgentSessions(repoRoot).filter((session) => session.branch === branch);
  if (matches.length === 0) {
    return null;
  }
  if (matches.length > 1) {
    throw new Error(`Multiple agent sessions found for branch: ${branch}`);
  }
  return matches[0];
}

function resolveAgentSessionForFinish(repoRoot, options) {
  if (options.sessionId) {
    const session = readAgentSession(repoRoot, options.sessionId);
    if (!session) {
      throw new Error(`Agent session not found: ${options.sessionId}`);
    }
    return session;
  }

  if (options.branch) {
    const session = resolveSessionByBranch(repoRoot, options.branch);
    if (!session) {
      throw new Error(`Agent session not found for branch: ${options.branch}`);
    }
    return session;
  }

  throw new Error('agents finish requires --session <id> or --branch <agent/...>');
}

function sessionStatusAfterFinish(finishArgs) {
  const modeIndex = finishArgs.indexOf('--mode');
  const directMode = finishArgs.includes('--direct-only') || finishArgs[modeIndex + 1] === 'direct';
  return finishArgs.includes('--no-wait-for-merge') && !directMode ? 'pr-opened' : 'finished';
}

function finishAgentSession(repoRoot, options, deps = {}) {
  const finishRunner = deps.finishRunner || finishCommands.finish;
  const output = deps.output || process.stdout;
  const session = resolveAgentSessionForFinish(repoRoot, options);

  if (!session.branch) {
    throw new Error(`Agent session '${session.id}' has no branch metadata.`);
  }

  updateAgentSession(repoRoot, session.id, { status: 'finishing' });

  const finishArgs = [
    '--target',
    repoRoot,
    '--branch',
    session.branch,
    ...options.finishArgs,
  ];

  output.write(`[${TOOL_NAME}] Agent session: ${session.id}\n`);
  output.write(`[${TOOL_NAME}] Branch: ${session.branch}\n`);
  output.write(`[${TOOL_NAME}] Worktree: ${session.worktreePath || '(unknown)'}\n`);

  try {
    const result = finishRunner(finishArgs);
    const status = sessionStatusAfterFinish(finishArgs);
    updateAgentSession(repoRoot, session.id, { status });
    output.write(`[${TOOL_NAME}] Finish result: ${status}\n`);
    return { session, status, result, finishArgs };
  } catch (error) {
    updateAgentSession(repoRoot, session.id, { status: 'failed' });
    output.write(`[${TOOL_NAME}] Finish result: failed\n`);
    throw error;
  }
}

module.exports = {
  finishAgentSession,
  resolveAgentSessionForFinish,
};
