const { test } = require('node:test');
const assert = require('node:assert/strict');

const { renderSidebar } = require('../src/cockpit/sidebar');

function lines(output) {
  return output.trimEnd().split('\n');
}

test('renderSidebar renders an empty sidebar', () => {
  const output = renderSidebar({
    repoPath: '/work/gitguardex',
    sessions: [],
  }, { noColor: true });

  assert.match(output, /gx cockpit/);
  assert.match(output, /repo gitguardex/);
  assert.match(output, /lanes/);
  assert.match(output, /no active lanes/);
  assert.match(output, /\[n\] new agent/);
  assert.match(output, /\[t\] terminal/);
  assert.match(output, /\[s\] settings/);
});

test('renderSidebar marks the selected session', () => {
  const output = renderSidebar({
    repoName: 'gitguardex',
    selectedSessionId: 's2',
    sessions: [
      {
        id: 's1',
        agentName: 'codex',
        branch: 'agent/codex/first',
        task: 'first lane',
        status: 'idle',
        lockCount: 0,
        worktreeExists: true,
      },
      {
        id: 's2',
        agentName: 'claude',
        branch: 'agent/claude/second',
        task: 'selected lane',
        status: 'working',
        lockCount: 2,
        worktreeExists: true,
      },
    ],
  }, { noColor: true });

  assert.match(output, /^  o COD agent\/codex\/first$/m);
  assert.match(output, /^> \* CLA agent\/claude\/second$/m);
});

test('renderSidebar marks a missing worktree', () => {
  const output = renderSidebar({
    repoName: 'gitguardex',
    sessions: [
      {
        id: 'missing',
        agentName: 'codex',
        branch: 'agent/codex/missing',
        task: 'repair missing lane',
        status: 'stalled',
        lockCount: 1,
        worktreeExists: false,
      },
    ],
  }, { noColor: true });

  assert.match(output, /^  x COD agent\/codex\/missing$/m);
  assert.match(output, /locks: 1 missing worktree/);
});

test('renderSidebar truncates long branch and task text', () => {
  const output = renderSidebar({
    repoName: 'gitguardex',
    sessions: [
      {
        id: 'long',
        agentName: 'codex',
        branch: 'agent/codex/this-branch-name-is-too-long-for-the-sidebar',
        task: 'this task description is also too long for the bounded dmux-style sidebar',
        status: 'working',
        lockCount: 0,
        worktreeExists: true,
      },
    ],
  }, { width: 30, noColor: true });

  assert.ok(lines(output).every((line) => line.length <= 30));
  assert.match(output, /agent\/codex\/this-br\.\.\./);
  assert.match(output, /this task description i\.\.\./);
});

test('renderSidebar displays lock counts', () => {
  const output = renderSidebar({
    repoName: 'gitguardex',
    sessions: [
      {
        id: 'locks',
        agentName: 'codex',
        branch: 'agent/codex/locks',
        task: 'lock count lane',
        status: 'working',
        lockCount: 7,
        worktreeExists: true,
      },
    ],
  }, { noColor: true });

  assert.match(output, /locks: 7/);
});
