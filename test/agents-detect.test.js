const { test, assert } = require('./helpers/install-test-helpers');
const Module = require('node:module');
const path = require('node:path');

const detectPath = path.resolve(__dirname, '..', 'src', 'agents', 'detect.js');
const registryPath = path.resolve(__dirname, '..', 'src', 'agents', 'registry.js');
const runtimePath = path.resolve(__dirname, '..', 'src', 'core', 'runtime.js');

function withMockedDetection({ registry, run }, fn) {
  const originalLoad = Module._load;
  delete require.cache[detectPath];

  Module._load = function load(request, parent, isMain) {
    if (parent?.filename === detectPath && request === './registry') {
      return registry;
    }
    if (parent?.filename === detectPath && request === '../core/runtime') {
      return { run };
    }

    const resolved = Module._resolveFilename(request, parent, isMain);
    if (resolved === registryPath) {
      return registry;
    }
    if (resolved === runtimePath) {
      return { run };
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    return fn(require(detectPath));
  } finally {
    delete require.cache[detectPath];
    Module._load = originalLoad;
  }
}

test('detectAgent reports an available registered agent without launching it', () => {
  const calls = [];
  const registry = {
    agents: [
      { id: 'codex', label: 'Codex', detectCommand: ['codex', '--version'] },
      { id: 'claude', label: 'Claude', detectCommand: ['claude', '--version'] },
    ],
  };

  withMockedDetection(
    {
      registry,
      run: (cmd, args, options) => {
        calls.push({ cmd, args, options });
        return { status: 0, stdout: 'codex 1.2.3\n', stderr: '' };
      },
    },
    ({ detectAgent }) => {
      assert.deepEqual(detectAgent('codex'), {
        id: 'codex',
        label: 'Codex',
        available: true,
        command: 'codex --version',
        error: null,
      });
    },
  );

  assert.deepEqual(calls, [
    { cmd: 'codex', args: ['--version'], options: { stdio: 'pipe' } },
  ]);
});

test('detectAgent reports command failures as unavailable with error text', () => {
  const registry = {
    agents: [
      { id: 'claude', label: 'Claude', detectCommand: { command: 'claude', args: ['--version'] } },
    ],
  };

  withMockedDetection(
    {
      registry,
      run: () => ({ status: 127, stdout: '', stderr: 'claude: command not found\n' }),
    },
    ({ detectAgent }) => {
      assert.deepEqual(detectAgent('claude'), {
        id: 'claude',
        label: 'Claude',
        available: false,
        command: 'claude --version',
        error: 'claude: command not found',
      });
    },
  );
});

test('detectAgents preserves requested order and supports registry maps', () => {
  const registry = {
    codex: { label: 'Codex', detectCommand: 'codex --version' },
    gemini: { label: 'Gemini', detectCommand: ['gemini', '--version'] },
  };

  withMockedDetection(
    {
      registry,
      run: (cmd) => ({ status: cmd === 'gemini' ? 1 : 0, stdout: '', stderr: '' }),
    },
    ({ detectAgents }) => {
      assert.deepEqual(detectAgents(['gemini', 'codex']).map((agent) => agent.id), ['gemini', 'codex']);
      assert.deepEqual(detectAgents(['gemini', 'codex']).map((agent) => agent.available), [false, true]);
    },
  );
});

test('detectAvailableAgents returns only successful detections', () => {
  const registry = {
    agents: [
      { id: 'codex', label: 'Codex', detectCommand: ['codex', '--version'] },
      { id: 'missing', label: 'Missing', detectCommand: ['missing-agent', '--version'] },
      { id: 'broken', label: 'Broken' },
    ],
  };

  withMockedDetection(
    {
      registry,
      run: (cmd) => ({ status: cmd === 'codex' ? 0 : 127, stdout: '', stderr: '' }),
    },
    ({ detectAvailableAgents }) => {
      assert.deepEqual(detectAvailableAgents(), [
        {
          id: 'codex',
          label: 'Codex',
          available: true,
          command: 'codex --version',
          error: null,
        },
      ]);
    },
  );
});

test('detectAgent reports unknown agents without running commands', () => {
  let callCount = 0;

  withMockedDetection(
    {
      registry: { agents: [] },
      run: () => {
        callCount += 1;
        return { status: 0, stdout: '', stderr: '' };
      },
    },
    ({ detectAgent }) => {
      assert.deepEqual(detectAgent('ghost'), {
        id: 'ghost',
        label: 'ghost',
        available: false,
        command: null,
        error: 'unknown agent: ghost',
      });
    },
  );

  assert.equal(callCount, 0);
});
