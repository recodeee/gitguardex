const registry = require('./registry');
const { run } = require('../core/runtime');

function registryEntries() {
  const source =
    registry.agents ||
    registry.AGENTS ||
    registry.registry ||
    registry.entries ||
    registry.default ||
    registry;

  if (Array.isArray(source)) {
    return source;
  }

  if (source && typeof source === 'object') {
    return Object.entries(source)
      .filter(([, entry]) => entry && typeof entry === 'object')
      .map(([id, entry]) => ({ id, ...entry }));
  }

  return [];
}

function findAgent(agentId) {
  if (typeof registry.getAgent === 'function') {
    const entry = registry.getAgent(agentId);
    if (entry) return entry;
  }

  return registryEntries().find((entry) => entry.id === agentId);
}

function normalizeDetectCommand(detectCommand) {
  if (Array.isArray(detectCommand)) {
    const [cmd, ...args] = detectCommand;
    return { cmd, args, command: detectCommand.join(' ') };
  }

  if (typeof detectCommand === 'string') {
    const [cmd, ...args] = detectCommand.trim().split(/\s+/).filter(Boolean);
    return { cmd, args, command: detectCommand.trim() };
  }

  if (detectCommand && typeof detectCommand === 'object') {
    const cmd = detectCommand.cmd || detectCommand.command || detectCommand.bin;
    const args = Array.isArray(detectCommand.args) ? detectCommand.args : [];
    return {
      cmd,
      args,
      command: [cmd, ...args].filter(Boolean).join(' '),
    };
  }

  return { cmd: null, args: [], command: null };
}

function resultError(result) {
  if (result.error) {
    return result.error.message || String(result.error);
  }

  const output = `${result.stderr || ''}${result.stdout || ''}`.trim();
  if (output) return output;

  if (typeof result.status === 'number') {
    return `detect command exited with status ${result.status}`;
  }

  return 'detect command failed';
}

function detectionResult(entry, available, command, error = null) {
  return {
    id: entry.id,
    label: entry.label || entry.id,
    available,
    command,
    error,
  };
}

function detectAgent(agentId) {
  const entry = findAgent(agentId);
  if (!entry) {
    return detectionResult({ id: agentId, label: agentId }, false, null, `unknown agent: ${agentId}`);
  }

  const { cmd, args, command } = normalizeDetectCommand(entry.detectCommand);
  if (!cmd) {
    return detectionResult(entry, false, command, 'missing detectCommand');
  }

  const result = run(cmd, args, { stdio: 'pipe' });
  if (!result.error && result.status === 0) {
    return detectionResult(entry, true, command, null);
  }

  return detectionResult(entry, false, command, resultError(result));
}

function detectAgents(agentIds) {
  const ids = Array.isArray(agentIds) ? agentIds : registryEntries().map((entry) => entry.id);
  return ids.map((agentId) => detectAgent(agentId));
}

function detectAvailableAgents() {
  return detectAgents().filter((agent) => agent.available);
}

module.exports = {
  detectAgent,
  detectAgents,
  detectAvailableAgents,
};
