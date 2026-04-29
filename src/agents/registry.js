const AGENT_DEFINITIONS = [
  {
    id: 'codex',
    label: 'Codex',
    shortLabel: 'CX',
    description: 'OpenAI Codex CLI for repository-aware coding tasks.',
    command: 'codex',
    detectCommand: 'codex --version',
    defaultEnabled: true,
    promptMode: 'argument',
    resumeCommandTemplate: 'codex resume {sessionId}',
  },
  {
    id: 'claude',
    label: 'Claude Code',
    shortLabel: 'CC',
    description: 'Anthropic Claude Code CLI for interactive coding sessions.',
    command: 'claude',
    detectCommand: 'claude --version',
    defaultEnabled: true,
    promptMode: 'argument',
    resumeCommandTemplate: 'claude --resume {sessionId}',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    shortLabel: 'OC',
    description: 'OpenCode CLI for terminal-native AI coding workflows.',
    command: 'opencode',
    detectCommand: 'opencode --version',
    defaultEnabled: true,
    promptMode: 'argument',
  },
  {
    id: 'cursor',
    label: 'Cursor Agent',
    shortLabel: 'CA',
    description: 'Cursor command-line agent for AI coding tasks.',
    command: 'cursor-agent',
    detectCommand: 'cursor-agent --version',
    defaultEnabled: true,
    promptMode: 'argument',
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    shortLabel: 'GM',
    description: 'Google Gemini CLI for AI-assisted development workflows.',
    command: 'gemini',
    detectCommand: 'gemini --version',
    defaultEnabled: true,
    promptMode: 'argument',
  },
];

function validateAgentDefinitions(definitions) {
  const ids = new Set();
  const shortLabels = new Set();

  for (const definition of definitions) {
    if (ids.has(definition.id)) {
      throw new Error(`Duplicate agent id: ${definition.id}`);
    }
    ids.add(definition.id);

    if (shortLabels.has(definition.shortLabel)) {
      throw new Error(`Duplicate agent short label: ${definition.shortLabel}`);
    }
    shortLabels.add(definition.shortLabel);
  }
}

validateAgentDefinitions(AGENT_DEFINITIONS);

const AGENT_IDS = Object.freeze(AGENT_DEFINITIONS.map((definition) => definition.id));
const AGENT_REGISTRY = Object.freeze(
  Object.fromEntries(
    AGENT_DEFINITIONS.map((definition) => [
      definition.id,
      Object.freeze({ ...definition }),
    ]),
  ),
);

function isAgentId(value) {
  return Object.prototype.hasOwnProperty.call(AGENT_REGISTRY, value);
}

function getAgentDefinition(id) {
  return AGENT_REGISTRY[id];
}

function getAgentDefinitions() {
  return AGENT_IDS.map((id) => AGENT_REGISTRY[id]);
}

function getDefaultEnabledAgents() {
  return getAgentDefinitions().filter((definition) => definition.defaultEnabled);
}

module.exports = {
  AGENT_IDS,
  AGENT_REGISTRY,
  isAgentId,
  getAgentDefinition,
  getAgentDefinitions,
  getDefaultEnabledAgents,
};
