const {
  test,
  assert,
  fs,
  path,
  runNode,
  runCmd,
  initRepo,
  seedCommit,
} = require('./helpers/install-test-helpers');
const { createAgentSession, readAgentSession } = require('../src/agents/sessions');

function makeRepo() {
  const repoDir = initRepo();
  seedCommit(repoDir);
  return repoDir;
}

function createBranch(repoDir, branch) {
  const result = runCmd('git', ['branch', branch], repoDir);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function oldTimestamp(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60000).toISOString();
}

function createSession(repoDir, overrides = {}) {
  const worktreePath = overrides.worktreePath || path.join(repoDir, '.omx', 'agent-worktrees', overrides.id || 'session');
  if (overrides.createWorktree !== false) {
    fs.mkdirSync(worktreePath, { recursive: true });
  }
  const session = createAgentSession(repoDir, {
    id: overrides.id || 'session',
    agent: 'codex',
    task: overrides.task || 'Cleanup session',
    branch: overrides.branch || 'agent/codex/session',
    base: 'main',
    status: overrides.status || 'active',
    worktreePath,
  });
  if (overrides.updatedAt) {
    const filePath = path.join(repoDir, '.guardex', 'agents', 'sessions', `${session.id}.json`);
    const stored = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    stored.updatedAt = overrides.updatedAt;
    fs.writeFileSync(filePath, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
  }
  return session;
}

test('agents cleanup-sessions removes a session with a missing worktree', () => {
  const repoDir = makeRepo();
  createBranch(repoDir, 'agent/codex/missing-worktree');
  createSession(repoDir, {
    id: 'missing-worktree',
    branch: 'agent/codex/missing-worktree',
    createWorktree: false,
  });

  const result = runNode(['agents', 'cleanup-sessions', '--target', repoDir], repoDir);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /removed missing-worktree/);
  assert.equal(readAgentSession(repoDir, 'missing-worktree'), null);
  const branch = runCmd('git', ['show-ref', '--verify', '--quiet', 'refs/heads/agent/codex/missing-worktree'], repoDir);
  assert.equal(branch.status, 0, 'cleanup-sessions must not remove branches');
});

test('agents cleanup-sessions removes a session with a missing branch', () => {
  const repoDir = makeRepo();
  createSession(repoDir, {
    id: 'missing-branch',
    branch: 'agent/codex/missing-branch',
  });

  const result = runNode(['agents', 'cleanup-sessions', '--target', repoDir, '--json'], repoDir);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.removed, ['missing-branch']);
  assert.deepEqual(payload.candidates[0].reasons, ['missing-branch']);
  assert.equal(readAgentSession(repoDir, 'missing-branch'), null);
  assert.equal(fs.existsSync(payload.candidates[0].worktreePath), true, 'cleanup-sessions must not remove worktrees');
});

test('agents cleanup-sessions preserves active sessions with existing branch and worktree', () => {
  const repoDir = makeRepo();
  createBranch(repoDir, 'agent/codex/active');
  const session = createSession(repoDir, {
    id: 'active-session',
    branch: 'agent/codex/active',
    status: 'active',
  });

  const result = runNode(['agents', 'cleanup-sessions', '--target', repoDir], repoDir);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /removed 0 of 1/);
  assert.deepEqual(readAgentSession(repoDir, 'active-session'), {
    ...session,
    status: 'active',
  });
});

test('agents cleanup-sessions removes old terminal sessions by configurable age', () => {
  const repoDir = makeRepo();
  createBranch(repoDir, 'agent/codex/finished-old');
  createSession(repoDir, {
    id: 'finished-old',
    branch: 'agent/codex/finished-old',
    status: 'finished',
    updatedAt: oldTimestamp(90),
  });

  const result = runNode([
    'agents',
    'cleanup-sessions',
    '--target',
    repoDir,
    '--older-than-minutes',
    '60',
  ], repoDir);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /reasons=terminal-status-old/);
  assert.equal(readAgentSession(repoDir, 'finished-old'), null);
});

test('agents cleanup-sessions --dry-run does not delete stale sessions', () => {
  const repoDir = makeRepo();
  createBranch(repoDir, 'agent/codex/dry-run');
  createSession(repoDir, {
    id: 'dry-run-session',
    branch: 'agent/codex/dry-run',
    createWorktree: false,
  });

  const result = runNode(['agents', 'cleanup-sessions', '--target', repoDir, '--dry-run'], repoDir);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /would remove dry-run-session/);
  assert.notEqual(readAgentSession(repoDir, 'dry-run-session'), null);
});
