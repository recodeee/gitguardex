'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const cockpit = require('../src/cockpit');
const {
  normalizeBackendName,
  selectTerminalBackend,
  kitty,
} = require('../src/terminal');

test('backend selection prefers kitty for auto when remote control is available', () => {
  const backend = selectTerminalBackend('auto', {
    kittyBackend: {
      name: 'kitty',
      isAvailable: () => true,
    },
    tmuxBackend: {
      name: 'tmux',
      isAvailable: () => true,
    },
  });

  assert.equal(backend.name, 'kitty');
});

test('backend selection falls back to tmux when kitty is unavailable', () => {
  const backend = selectTerminalBackend('auto', {
    kittyBackend: {
      name: 'kitty',
      isAvailable: () => false,
    },
    tmuxBackend: {
      name: 'tmux',
      isAvailable: () => true,
    },
  });

  assert.equal(backend.name, 'tmux');
});

test('backend names reject unsupported cockpit backends', () => {
  assert.equal(normalizeBackendName('kitty'), 'kitty');
  assert.equal(normalizeBackendName('tmux'), 'tmux');
  assert.equal(normalizeBackendName('auto'), 'auto');
  assert.throws(() => normalizeBackendName('screen'), /--backend requires auto, kitty, or tmux/);
});

test('kitty command construction is stable', () => {
  assert.deepEqual(
    kitty.buildOpenCockpitLayoutCommand({
      repoRoot: '/repo/gitguardex',
      command: "gx cockpit control --target '/repo/gitguardex'",
    }),
    {
      cmd: 'kitty',
      args: [
        '@',
        'launch',
        '--type=window',
        '--cwd',
        '/repo/gitguardex',
        '--title',
        'gx cockpit',
        '--',
        'sh',
        '-lc',
        "gx cockpit control --target '/repo/gitguardex'",
      ],
    },
  );

  assert.deepEqual(
    kitty.buildLaunchAgentPaneCommand({
      session: { id: 'agent-1' },
      worktree: '/repo/worktree',
      command: 'gx status',
      title: 'agent one',
    }),
    {
      cmd: 'kitty',
      args: [
        '@',
        'launch',
        '--type=window',
        '--location=vsplit',
        '--cwd',
        '/repo/worktree',
        '--title',
        'agent one',
        '--',
        'sh',
        '-lc',
        'gx status',
      ],
    },
  );

  assert.deepEqual(kitty.buildFocusPaneCommand({ id: '12' }), {
    cmd: 'kitty',
    args: ['@', 'focus-window', '--match', 'id:12'],
  });
  assert.deepEqual(kitty.buildClosePaneCommand('12'), {
    cmd: 'kitty',
    args: ['@', 'close-window', '--match', 'id:12'],
  });
  assert.deepEqual(kitty.buildSendTextCommand({ windowId: '12' }), {
    cmd: 'kitty',
    args: ['@', 'send-text', '--match', 'id:12', '--stdin'],
  });
  assert.equal(kitty.sendTextInput('gx status', { submit: true }), 'gx status\n');
});

test('cockpit --backend kitty opens through the selected backend', () => {
  const stdout = [];
  const calls = [];
  const result = cockpit.openCockpit(['--backend', 'kitty', '--session', 'guardex-dev', '--target', '/repo/gitguardex'], {
    resolveRepoRoot: (target) => target,
    toolName: 'gx',
    stdout: {
      write(chunk) {
        stdout.push(String(chunk));
      },
    },
    terminalBackends: {
      kitty: {
        name: 'kitty',
        isAvailable: () => true,
        openCockpitLayout(options) {
          calls.push(options);
          return { action: 'created' };
        },
      },
    },
  });

  assert.equal(result.backend, 'kitty');
  assert.equal(result.sessionName, 'guardex-dev');
  assert.deepEqual(calls, [
    {
      repoRoot: '/repo/gitguardex',
      sessionName: 'guardex-dev',
      command: "gx cockpit control --target '/repo/gitguardex'",
      attach: false,
    },
  ]);
  assert.match(stdout.join(''), /Created kitty cockpit window 'guardex-dev'/);
  assert.match(stdout.join(''), /Control pane: gx cockpit control --target '\/repo\/gitguardex'/);
});
