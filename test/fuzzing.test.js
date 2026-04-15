const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
let fc = null;
try {
  fc = require('fast-check');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
}

const cliPath = path.resolve(__dirname, '..', 'bin', 'multiagent-safety.js');

const KNOWN_COMMON_FLAGS = new Set([
  '--target',
  '--dry-run',
  '--skip-agents',
  '--skip-package-json',
  '--force',
  '--keep-stale-locks',
  '--json',
  '--yes-global-install',
  '--no-global-install',
  '--no-gitignore',
]);

function runNode(args, cwd) {
  return cp.spawnSync('node', [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
}

function runCmd(cmd, args, cwd) {
  return cp.spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
}

function initRepo() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'musafety-fuzz-'));
  const repoDir = path.join(tempDir, 'repo');
  fs.mkdirSync(repoDir);

  let result = runCmd('git', ['init', '-b', 'dev'], repoDir);
  assert.equal(result.status, 0, result.stderr);
  result = runCmd('git', ['config', 'user.email', 'bot@example.com'], repoDir);
  assert.equal(result.status, 0, result.stderr);
  result = runCmd('git', ['config', 'user.name', 'Bot'], repoDir);
  assert.equal(result.status, 0, result.stderr);

  fs.writeFileSync(
    path.join(repoDir, 'package.json'),
    JSON.stringify({ name: 'demo', private: true, scripts: {} }, null, 2) + '\n',
    'utf8',
  );

  return repoDir;
}

test(
  'fuzz: status rejects unknown option patterns',
  { skip: fc === null ? 'fast-check is not installed' : false },
  () => {
  const repoDir = initRepo();
  const unknownFlag = fc
    .stringMatching(/^--[a-z][a-z-]{0,14}$/)
    .filter((flag) => !KNOWN_COMMON_FLAGS.has(flag));

  fc.assert(
    fc.property(unknownFlag, (flag) => {
      const result = runNode(['status', flag], repoDir);
      assert.equal(result.status, 1, `expected non-zero for ${flag}`);
      const output = `${result.stderr}${result.stdout}`.trim();
      assert.ok(
        output === '' || /Unknown option:/.test(output),
        `expected unknown option output for ${flag}, got ${JSON.stringify(output)}`,
      );
    }),
    { numRuns: 30 },
  );
},
);
