'use strict';

const kitty = require('./kitty');
const tmux = require('./tmux');

const BACKEND_NAMES = new Set(['auto', 'kitty', 'tmux']);
const DEFAULT_BACKEND = 'tmux';

function normalizeBackendName(value, fallback = DEFAULT_BACKEND) {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (!BACKEND_NAMES.has(normalized)) {
    throw new Error(`--backend requires auto, kitty, or tmux`);
  }
  return normalized;
}

function createBackends(options = {}) {
  return {
    kitty: options.kittyBackend || kitty.createBackend(options.kitty || {}),
    tmux: options.tmuxBackend || tmux.createBackend(options.tmux || {}),
  };
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return '';
}

function metadataOf(target = {}) {
  return target.metadata && typeof target.metadata === 'object' ? target.metadata : {};
}

function terminalOf(target = {}) {
  return target.terminal && typeof target.terminal === 'object' ? target.terminal : {};
}

function tmuxOf(target = {}) {
  return target.tmux && typeof target.tmux === 'object' ? target.tmux : {};
}

function kittyOf(target = {}) {
  return target.kitty && typeof target.kitty === 'object' ? target.kitty : {};
}

function resolveTargetBackendName(target = {}, fallback = '') {
  const metadata = metadataOf(target);
  const terminal = terminalOf(target);
  const explicit = firstText(
    target.terminalBackend,
    target.backend,
    terminal.backend,
    metadata.terminalBackend,
    metadata['terminal.backend'],
  );
  if (explicit) return normalizeBackendName(explicit);

  const tmux = tmuxOf(target);
  if (firstText(target.paneId, target.tmuxPaneId, target.tmuxTarget, tmux.paneId, tmux.target, metadata.tmuxPaneId, metadata['tmux.paneId'])) {
    return 'tmux';
  }

  const kittyTarget = kittyOf(target);
  if (firstText(
    target.kittyMatch,
    target.match,
    target.kittyWindowId,
    target.windowId,
    target.kittyTitle,
    target.windowTitle,
    terminal.match,
    terminal.windowId,
    terminal.title,
    kittyTarget.match,
    kittyTarget.windowId,
    kittyTarget.title,
    metadata.kittyMatch,
    metadata['kitty.match'],
    metadata.kittyWindowId,
    metadata['kitty.windowId'],
    metadata.kittyTitle,
    metadata['kitty.title'],
  )) {
    return 'kitty';
  }

  return fallback ? normalizeBackendName(fallback) : '';
}

function selectTerminalBackend(value = DEFAULT_BACKEND, options = {}) {
  const name = normalizeBackendName(value);
  const backends = createBackends(options);

  if (name === 'auto') {
    if (backends.kitty && typeof backends.kitty.isAvailable === 'function' && backends.kitty.isAvailable()) {
      return backends.kitty;
    }
    return backends.tmux;
  }

  return backends[name];
}

function selectTerminalBackendForTarget(target = {}, options = {}) {
  const name = resolveTargetBackendName(target, options.defaultBackend);
  if (!name) return null;
  return selectTerminalBackend(name, options);
}

module.exports = {
  DEFAULT_BACKEND,
  normalizeBackendName,
  resolveTargetBackendName,
  selectTerminalBackend,
  selectTerminalBackendForTarget,
  createBackends,
  kitty,
  tmux,
};
