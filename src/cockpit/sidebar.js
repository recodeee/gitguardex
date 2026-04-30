const path = require('node:path');

const DEFAULT_WIDTH = 36;
const MIN_WIDTH = 12;

const STATUS_DOTS = new Map([
  ['active', '*'],
  ['running', '*'],
  ['working', '*'],
  ['thinking', 'o'],
  ['idle', 'o'],
  ['ready', 'o'],
  ['done', '+'],
  ['complete', '+'],
  ['completed', '+'],
  ['merged', '+'],
  ['blocked', '!'],
  ['error', '!'],
  ['failed', '!'],
  ['stalled', '!'],
  ['dead', '!'],
]);

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  inverse: '\x1b[7m',
};

function text(value, fallback = '') {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim() || fallback;
}

function sidebarWidth(options = {}) {
  const width = Number(options.width);
  if (!Number.isFinite(width)) {
    return DEFAULT_WIDTH;
  }
  return Math.max(MIN_WIDTH, Math.floor(width));
}

function truncate(value, width) {
  const raw = value === null || value === undefined ? '' : String(value);
  if (width <= 0) {
    return '';
  }
  if (raw.length <= width) {
    return raw;
  }
  if (width <= 3) {
    return raw.slice(0, width);
  }
  return `${raw.slice(0, width - 3)}...`;
}

function boundLine(value, width) {
  return truncate(value, width);
}

function repoName(state = {}, options = {}) {
  const explicit = text(options.repoName || state.repoName || state.projectName || state.repo);
  if (explicit) {
    return explicit;
  }

  const repoPath = text(state.repoPath);
  if (!repoPath) {
    return '-';
  }
  return path.basename(repoPath) || repoPath;
}

function agentLabel(agentName) {
  const compact = text(agentName, 'agent').replace(/[^a-z0-9]/gi, '').toUpperCase();
  return truncate(compact || 'AGENT', 3).padEnd(3, ' ');
}

function statusDot(session = {}) {
  if (session.worktreeExists === false) {
    return 'x';
  }
  const status = text(session.status, 'unknown').toLowerCase();
  return STATUS_DOTS.get(status) || '.';
}

function lockCount(session = {}) {
  if (Array.isArray(session.locks)) {
    return session.locks.length;
  }
  const count = Number(session.lockCount);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function sessionId(session = {}) {
  return text(session.id || session.sessionId || session.branch);
}

function isSelected(session, index, state = {}, options = {}) {
  const selectedId = text(options.selectedId || options.selectedSessionId || state.selectedId || state.selectedSessionId);
  if (selectedId && sessionId(session) === selectedId) {
    return true;
  }

  const selectedBranch = text(options.selectedBranch || state.selectedBranch);
  if (selectedBranch && text(session.branch) === selectedBranch) {
    return true;
  }

  const selectedIndex = Number.isInteger(options.selectedIndex) ? options.selectedIndex : state.selectedIndex;
  return Number.isInteger(selectedIndex) && selectedIndex === index;
}

function colorize(value, color, options = {}) {
  if (options.noColor || options.color !== true) {
    return value;
  }
  const code = ANSI[color];
  return code ? `${code}${value}${ANSI.reset}` : value;
}

function statusColor(dot) {
  if (dot === '*') {
    return 'green';
  }
  if (dot === '!') {
    return 'yellow';
  }
  if (dot === 'x') {
    return 'red';
  }
  if (dot === '+') {
    return 'cyan';
  }
  return 'dim';
}

function renderSessionRow(session, index, state, options) {
  const width = sidebarWidth(options);
  const selected = isSelected(session, index, state, options);
  const marker = selected ? '>' : ' ';
  const dot = statusDot(session);
  const label = agentLabel(session.agentName);
  const branch = text(session.branch, '(no branch)');
  const task = text(session.task, '(no task)');
  const missing = session.worktreeExists === false ? ' missing worktree' : '';

  const firstPrefix = `${marker} ${dot} ${label} `;
  const first = `${firstPrefix}${truncate(branch, width - firstPrefix.length)}`;
  const taskPrefix = '    ';
  const taskLine = `${taskPrefix}${truncate(task, width - taskPrefix.length)}`;
  const meta = `    locks: ${lockCount(session)}${missing}`;

  return [
    selected ? colorize(boundLine(first, width), 'inverse', options) : boundLine(first, width),
    boundLine(taskLine, width),
    colorize(boundLine(meta, width), statusColor(dot), options),
  ];
}

function renderSidebar(state = {}, options = {}) {
  const width = sidebarWidth(options);
  const title = text(options.title || state.title, 'gx cockpit').toLowerCase() === 'gitguardex'
    ? 'gitguardex'
    : text(options.title || state.title, 'gx cockpit');
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  const lines = [
    boundLine(title, width),
    boundLine(`repo ${repoName(state, options)}`, width),
    boundLine('-'.repeat(width), width),
    boundLine('lanes', width),
  ];

  if (sessions.length === 0) {
    lines.push(boundLine('  no active lanes', width));
  } else {
    sessions.forEach((session, index) => {
      lines.push(...renderSessionRow(session, index, state, options));
    });
  }

  lines.push(
    boundLine('-'.repeat(width), width),
    boundLine('[n] new agent', width),
    boundLine('[t] terminal', width),
    boundLine('[s] settings', width),
  );

  return `${lines.join('\n')}\n`;
}

module.exports = {
  renderSidebar,
  agentLabel,
  statusDot,
  truncate,
};
