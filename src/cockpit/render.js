function line(label, value) {
  return `${label}: ${value || '-'}`;
}

function lockSummary(locks) {
  if (!Array.isArray(locks) || locks.length === 0) {
    return 'none';
  }

  const preview = locks.slice(0, 3).join(', ');
  const suffix = locks.length > 3 ? `, +${locks.length - 3} more` : '';
  return `${locks.length} (${preview}${suffix})`;
}

function lockCountSummary(session) {
  if (Array.isArray(session.locks)) {
    return lockSummary(session.locks);
  }

  return Number.isFinite(session.lockCount) ? String(session.lockCount) : 'none';
}

function worktreeSummary(session) {
  const worktreePath = session.worktreePath || '-';
  if (session.worktreeExists === false) {
    return `${worktreePath} (missing)`;
  }
  if (session.worktreeExists === true) {
    return `${worktreePath} (present)`;
  }
  return worktreePath;
}

function renderSession(session, index) {
  const lines = [
    `${index + 1}. ${session.agentName || 'agent'} | ${session.status || 'unknown'}`,
    `   branch: ${session.branch || '-'}`,
    `   worktree: ${worktreeSummary(session)}`,
    `   locks: ${lockCountSummary(session)}`,
  ];

  if (session.task) {
    lines.push(`   task: ${session.task}`);
  }
  if (session.lastHeartbeatAt) {
    lines.push(`   heartbeat: ${session.lastHeartbeatAt}`);
  }

  return lines.join('\n');
}

function renderCockpit(state) {
  const sessions = Array.isArray(state && state.sessions) ? state.sessions : [];
  const lines = [
    'GitGuardex Cockpit',
    line('repo', state && state.repoPath),
    line('base', state && state.baseBranch),
    line('active sessions', String(sessions.length)),
    '',
  ];

  if (sessions.length === 0) {
    lines.push('No active agent sessions.');
  } else {
    sessions.forEach((session, index) => {
      if (index > 0) {
        lines.push('');
      }
      lines.push(renderSession(session, index));
    });
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  renderCockpit,
  renderSession,
  lockSummary,
  lockCountSummary,
  worktreeSummary,
};
