const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  AGENT_IDS,
  AGENT_REGISTRY,
  isAgentId,
  getAgentDefinition,
  getAgentDefinitions,
  getDefaultEnabledAgents,
} = require('../src/agents/registry');

const repoRoot = path.resolve(__dirname, '..');
const registryPath = path.join(repoRoot, 'src', 'agents', 'registry.js');

test('AGENT_IDS lists the supported agent ids in registry order', () => {
  assert.deepEqual(AGENT_IDS, ['codex', 'claude', 'opencode', 'cursor', 'gemini']);
});

test('AGENT_REGISTRY exposes complete definitions keyed by id', () => {
  for (const id of AGENT_IDS) {
    const definition = AGENT_REGISTRY[id];

    assert.equal(definition.id, id);
    assert.equal(typeof definition.label, 'string');
    assert.equal(typeof definition.shortLabel, 'string');
    assert.equal(typeof definition.description, 'string');
    assert.equal(typeof definition.command, 'string');
    assert.equal(typeof definition.detectCommand, 'string');
    assert.equal(typeof definition.defaultEnabled, 'boolean');
    assert.equal(typeof definition.promptMode, 'string');
  }

  assert.equal(AGENT_REGISTRY.codex.command, 'codex');
  assert.equal(AGENT_REGISTRY.claude.command, 'claude');
  assert.equal(AGENT_REGISTRY.opencode.command, 'opencode');
  assert.equal(AGENT_REGISTRY.cursor.command, 'cursor-agent');
  assert.equal(AGENT_REGISTRY.gemini.command, 'gemini');
});

test('isAgentId recognizes only supported agent ids', () => {
  assert.equal(isAgentId('codex'), true);
  assert.equal(isAgentId('claude'), true);
  assert.equal(isAgentId('missing'), false);
  assert.equal(isAgentId(null), false);
});

test('getAgentDefinition returns matching definitions', () => {
  assert.equal(getAgentDefinition('codex'), AGENT_REGISTRY.codex);
  assert.equal(getAgentDefinition('gemini'), AGENT_REGISTRY.gemini);
  assert.equal(getAgentDefinition('missing'), undefined);
});

test('getAgentDefinitions returns all definitions in AGENT_IDS order', () => {
  assert.deepEqual(
    getAgentDefinitions().map((definition) => definition.id),
    AGENT_IDS,
  );
});

test('getDefaultEnabledAgents returns only default-enabled definitions', () => {
  assert.deepEqual(
    getDefaultEnabledAgents().map((definition) => definition.id),
    AGENT_IDS.filter((id) => AGENT_REGISTRY[id].defaultEnabled),
  );
});

test('registry load validates duplicate ids', () => {
  assert.throws(
    () => loadRegistrySourceWith({
      from: "id: 'claude'",
      to: "id: 'codex'",
    }),
    /Duplicate agent id: codex/,
  );
});

test('registry load validates duplicate short labels', () => {
  assert.throws(
    () => loadRegistrySourceWith({
      from: "shortLabel: 'CC'",
      to: "shortLabel: 'CX'",
    }),
    /Duplicate agent short label: CX/,
  );
});

function loadRegistrySourceWith({ from, to }) {
  const source = fs.readFileSync(registryPath, 'utf8').replace(from, to);
  const context = {
    module: { exports: {} },
    exports: {},
    require,
  };

  vm.runInNewContext(source, context, { filename: registryPath });
  return context.module.exports;
}
