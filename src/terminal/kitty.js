'use strict';

const cp = require('node:child_process');

const DEFAULT_KITTY_BIN = 'kitty';
const DEFAULT_COCKPIT_TITLE = 'gx cockpit';
const DEFAULT_AGENT_TITLE = 'agent';
const DEFAULT_TERMINAL_TITLE = 'terminal';

function text(value, fallback = '') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function requireText(value, name) {
  const normalized = text(value);
  if (!normalized) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return normalized;
}

function firstText(...values) {
  for (const value of values) {
    const normalized = text(value);
    if (normalized) return normalized;
  }
  return '';
}

function kittyBin(config = {}) {
  return text(config.kittyBin || process.env.GUARDEX_KITTY_BIN, DEFAULT_KITTY_BIN);
}

function commandShape(args, config = {}) {
  return {
    cmd: kittyBin(config),
    args,
  };
}

function appendShellCommand(args, command) {
  const normalized = text(command);
  if (normalized) {
    args.push('--', 'sh', '-lc', normalized);
  }
  return args;
}

function buildAvailabilityCommand(config = {}) {
  return commandShape(['@', 'ls'], config);
}

function buildOpenCockpitLayoutCommand(options = {}, config = {}) {
  const repoRoot = requireText(options.repoRoot, 'kitty cockpit repoRoot');
  const args = [
    '@',
    'launch',
    '--type=window',
    '--cwd',
    repoRoot,
    '--title',
    text(options.title, DEFAULT_COCKPIT_TITLE),
  ];
  appendShellCommand(args, options.command);
  return commandShape(args, config);
}

function agentTitle(session = {}, title) {
  return firstText(
    title,
    session.title,
    session.agentName,
    session.sessionId,
    session.id,
    session.branch,
    DEFAULT_AGENT_TITLE,
  );
}

function buildLaunchAgentPaneCommand(options = {}, config = {}) {
  const session = options.session && typeof options.session === 'object' ? options.session : {};
  const cwd = requireText(firstText(options.worktree, session.worktreePath, session.path), 'kitty agent worktree');
  const args = [
    '@',
    'launch',
    '--type=window',
    '--location=vsplit',
    '--cwd',
    cwd,
    '--title',
    agentTitle(session, options.title),
  ];
  appendShellCommand(args, options.command);
  return commandShape(args, config);
}

function buildLaunchTerminalPaneCommand(options = {}, config = {}) {
  const cwd = requireText(options.cwd, 'kitty terminal cwd');
  const args = [
    '@',
    'launch',
    '--type=window',
    '--location=vsplit',
    '--cwd',
    cwd,
    '--title',
    text(options.title, DEFAULT_TERMINAL_TITLE),
  ];
  appendShellCommand(args, options.command);
  return commandShape(args, config);
}

function targetId(target) {
  const raw = target && typeof target === 'object'
    ? firstText(target.id, target.windowId, target.paneId, target.target)
    : text(target);
  return requireText(raw, 'kitty target id');
}

function targetMatch(target) {
  return `id:${targetId(target)}`;
}

function buildFocusPaneCommand(target, config = {}) {
  return commandShape(['@', 'focus-window', '--match', targetMatch(target)], config);
}

function buildClosePaneCommand(target, config = {}) {
  return commandShape(['@', 'close-window', '--match', targetMatch(target)], config);
}

function buildSendTextCommand(target, config = {}) {
  return commandShape(['@', 'send-text', '--match', targetMatch(target), '--stdin'], config);
}

function sendTextInput(value, options = {}) {
  const body = value === undefined || value === null ? '' : String(value);
  return options.submit ? `${body}\n` : body;
}

function defaultRunner(cmd, args, options = {}) {
  return cp.spawnSync(cmd, args, {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    encoding: 'utf8',
    input: options.input,
    stdio: options.stdio || 'pipe',
    timeout: options.timeout,
  });
}

function assertResult(result, message) {
  if (result && result.error) throw result.error;
  if (!result || result.status === 0) return result;
  const detail = String(result.stderr || result.stdout || '').trim();
  throw new Error(`${message}${detail ? `: ${detail}` : '.'}`);
}

function createBackend(config = {}) {
  const runner = typeof config.runner === 'function' ? config.runner : defaultRunner;
  const run = (shape, options = {}) => runner(shape.cmd, shape.args, options);

  return {
    name: 'kitty',
    isAvailable() {
      const result = run(buildAvailabilityCommand(config), { stdio: 'pipe' });
      return Boolean(result && result.status === 0 && !result.error);
    },
    openCockpitLayout(options = {}) {
      const result = run(buildOpenCockpitLayoutCommand(options, config), { cwd: options.repoRoot });
      return assertResult(result, 'kitty could not open cockpit layout');
    },
    launchAgentPane(options = {}) {
      const result = run(buildLaunchAgentPaneCommand(options, config), { cwd: options.worktree });
      return assertResult(result, 'kitty could not launch agent pane');
    },
    launchTerminalPane(options = {}) {
      const result = run(buildLaunchTerminalPaneCommand(options, config), { cwd: options.cwd });
      return assertResult(result, 'kitty could not launch terminal pane');
    },
    focusPane(target) {
      const result = run(buildFocusPaneCommand(target, config));
      return assertResult(result, 'kitty could not focus pane');
    },
    closePane(target) {
      const result = run(buildClosePaneCommand(target, config));
      return assertResult(result, 'kitty could not close pane');
    },
    sendText(target, value, options = {}) {
      const result = run(buildSendTextCommand(target, config), {
        input: sendTextInput(value, options),
        stdio: 'pipe',
      });
      return assertResult(result, 'kitty could not send text');
    },
  };
}

module.exports = {
  DEFAULT_KITTY_BIN,
  buildAvailabilityCommand,
  buildOpenCockpitLayoutCommand,
  buildLaunchAgentPaneCommand,
  buildLaunchTerminalPaneCommand,
  buildFocusPaneCommand,
  buildClosePaneCommand,
  buildSendTextCommand,
  createBackend,
  sendTextInput,
  targetMatch,
};
