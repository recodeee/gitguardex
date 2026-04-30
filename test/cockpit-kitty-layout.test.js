'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createKittyCockpitPlan } = require('../src/cockpit/kitty-layout');

function agent(id, extra = {}) {
  return {
    id,
    agent: 'codex',
    worktree: `/repo/.omx/agent-worktrees/${id}`,
    command: `cd /repo/.omx/agent-worktrees/${id} && exec codex`,
    ...extra,
  };
}

test('one agent creates control and agent launch commands', () => {
  const plan = createKittyCockpitPlan({
    repoRoot: '/repo/gitguardex',
    sessionName: 'guardex-dev',
    agents: [agent('alpha')],
    controlCommand: "gx cockpit control --target '/repo/gitguardex'",
    welcomeCommand: 'gx',
    dryRun: true,
  });

  assert.equal(plan.backend, 'kitty');
  assert.equal(plan.dryRun, true);
  assert.deepEqual(
    plan.steps.map((step) => step.id),
    ['launch-control', 'launch-agent-area', 'launch-agent-1', 'focus-control'],
  );
  assert.deepEqual(plan.steps[0].command, {
    cmd: 'kitty',
    args: [
      '@',
      'launch',
      '--type=window',
      '--cwd',
      '/repo/gitguardex',
      '--title',
      'guardex-dev: control',
      '--',
      'sh',
      '-lc',
      "gx cockpit control --target '/repo/gitguardex'",
    ],
  });
  assert.deepEqual(plan.steps[2].command.args, [
    '@',
    'launch',
    '--type=window',
    '--location=vsplit',
    '--cwd',
    '/repo/.omx/agent-worktrees/alpha',
    '--title',
    '01: codex alpha',
    '--',
    'sh',
    '-lc',
    'cd /repo/.omx/agent-worktrees/alpha && exec codex',
  ]);
});

test('many agents create stable titles', () => {
  const agents = Array.from({ length: 12 }, (_, index) => agent(`agent-${index + 1}`, {
    agent: index % 2 === 0 ? 'codex' : 'claude',
  }));
  const plan = createKittyCockpitPlan({
    repoRoot: '/repo/gitguardex',
    sessionName: 'guardex',
    agents,
  });

  assert.deepEqual(
    plan.layout.agents.map((entry) => entry.title),
    [
      '01: codex agent-1',
      '02: claude agent-2',
      '03: codex agent-3',
      '04: claude agent-4',
      '05: codex agent-5',
      '06: claude agent-6',
      '07: codex agent-7',
      '08: claude agent-8',
      '09: codex agent-9',
      '10: claude agent-10',
      '11: codex agent-11',
      '12: claude agent-12',
    ],
  );
  assert.equal(new Set(plan.layout.agents.map((entry) => entry.match)).size, 12);
});

test('repoRoot and worktree cwd are preserved', () => {
  const plan = createKittyCockpitPlan({
    repoRoot: '/repo/gitguardex',
    agents: [
      agent('alpha', {
        cwd: '/repo/worktrees/alpha',
        worktree: '/repo/worktrees/alpha',
        title: 'alpha lane',
      }),
    ],
  });

  assert.equal(plan.layout.control.cwd, '/repo/gitguardex');
  assert.equal(plan.layout.agentArea.cwd, '/repo/gitguardex');
  assert.equal(plan.layout.agents[0].cwd, '/repo/worktrees/alpha');
  assert.equal(plan.layout.agents[0].worktree, '/repo/worktrees/alpha');
  assert.equal(plan.steps[2].command.args[5], '/repo/worktrees/alpha');
});

test('plan is deterministic', () => {
  const input = {
    repoRoot: '/repo/gitguardex',
    sessionName: 'guardex-dev',
    agents: [agent('alpha'), agent('beta', { agent: 'claude' })],
    controlCommand: 'gx cockpit control',
    welcomeCommand: 'gx',
    columns: 160,
    dryRun: true,
  };

  assert.deepEqual(
    createKittyCockpitPlan(JSON.parse(JSON.stringify(input))),
    createKittyCockpitPlan(JSON.parse(JSON.stringify(input))),
  );
});
