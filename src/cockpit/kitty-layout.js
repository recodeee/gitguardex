'use strict';

const DEFAULT_SESSION_NAME = 'guardex';
const DEFAULT_COLUMNS = 120;
const DEFAULT_KITTY_BIN = 'kitty';
const DEFAULT_WELCOME_COMMAND = 'gx';

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

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function commandShape(args, kittyBin = DEFAULT_KITTY_BIN) {
  return {
    cmd: text(kittyBin, DEFAULT_KITTY_BIN),
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

function launchCommand(window, kittyBin) {
  const args = [
    '@',
    'launch',
    '--type=window',
  ];
  if (window.location) {
    args.push(`--location=${window.location}`);
  }
  args.push(
    '--cwd',
    window.cwd,
    '--title',
    window.title,
  );
  appendShellCommand(args, window.command);
  return commandShape(args, kittyBin);
}

function focusCommand(window, kittyBin) {
  return commandShape(['@', 'focus-window', '--match', window.match], kittyBin);
}

function matchTitle(title) {
  return `title:${title}`;
}

function agentId(agent, index) {
  return firstText(
    agent.id,
    agent.sessionId,
    agent.agentId,
    agent.branch,
    `agent-${index + 1}`,
  );
}

function agentLabel(agent, index) {
  const explicitTitle = text(agent.title);
  if (explicitTitle) return explicitTitle;
  const id = agentId(agent, index);
  const label = firstText(
    agent.label,
    agent.agentName,
    agent.agent,
    agent.name,
  );
  if (label && id && label !== id) return `${label} ${id}`;
  return firstText(
    label,
    id,
    `agent-${index + 1}`,
  );
}

function agentTitle(agent, index) {
  return `${String(index + 1).padStart(2, '0')}: ${agentLabel(agent, index)}`;
}

function normalizeAgent(agent, index, repoRoot, total) {
  const source = agent && typeof agent === 'object' ? agent : {};
  const cwd = requireText(
    firstText(source.cwd, source.worktree, source.worktreePath, source.path, repoRoot),
    `agents[${index}].cwd`,
  );
  const title = agentTitle(source, index);
  return {
    id: agentId(source, index),
    index,
    total,
    title,
    cwd,
    worktree: firstText(source.worktree, source.worktreePath, source.path, source.cwd),
    command: firstText(source.command, source.launchCommand, source.shellCommand, 'exec ${SHELL:-bash}'),
    branch: text(source.branch),
    match: matchTitle(title),
  };
}

function createKittyCockpitPlan(options = {}) {
  const repoRoot = requireText(options.repoRoot, 'repoRoot');
  const sessionName = text(options.sessionName, DEFAULT_SESSION_NAME);
  const agents = Array.isArray(options.agents) ? options.agents : [];
  const columns = positiveInteger(options.columns, DEFAULT_COLUMNS);
  const kittyBin = text(options.kittyBin, DEFAULT_KITTY_BIN);
  const controlCommand = text(
    options.controlCommand,
    `gx cockpit control --target ${shellQuote(repoRoot)}`,
  );
  const welcomeCommand = text(options.welcomeCommand, DEFAULT_WELCOME_COMMAND);

  const controlTitle = `${sessionName}: control`;
  const agentAreaTitle = `${sessionName}: agents`;
  const controlWindow = {
    id: 'control',
    role: 'control',
    title: controlTitle,
    cwd: repoRoot,
    command: controlCommand,
    match: matchTitle(controlTitle),
    persistent: true,
  };
  const agentAreaWindow = {
    id: 'agent-area',
    role: 'agent-area',
    title: agentAreaTitle,
    cwd: repoRoot,
    command: welcomeCommand,
    match: matchTitle(agentAreaTitle),
    location: 'vsplit',
  };
  const agentWindows = agents.map((agent, index) => ({
    ...normalizeAgent(agent, index, repoRoot, agents.length),
    role: 'agent',
    location: 'vsplit',
  }));

  const steps = [
    {
      id: 'launch-control',
      role: 'control',
      action: 'launch',
      window: controlWindow,
      command: launchCommand(controlWindow, kittyBin),
    },
    {
      id: 'launch-agent-area',
      role: 'agent-area',
      action: 'launch',
      window: agentAreaWindow,
      command: launchCommand(agentAreaWindow, kittyBin),
    },
    ...agentWindows.map((window) => ({
      id: `launch-agent-${window.index + 1}`,
      role: 'agent',
      action: 'launch',
      agentId: window.id,
      window,
      command: launchCommand(window, kittyBin),
    })),
  ];

  if (options.focusControl !== false) {
    steps.push({
      id: 'focus-control',
      role: 'control',
      action: 'focus',
      window: controlWindow,
      command: focusCommand(controlWindow, kittyBin),
    });
  }

  return {
    schemaVersion: 1,
    backend: 'kitty',
    dryRun: Boolean(options.dryRun),
    sessionName,
    repoRoot,
    columns,
    layout: {
      control: controlWindow,
      agentArea: agentAreaWindow,
      agents: agentWindows,
    },
    steps,
    commands: steps.map((step) => step.command),
  };
}

module.exports = {
  DEFAULT_COLUMNS,
  DEFAULT_SESSION_NAME,
  createKittyCockpitPlan,
};
