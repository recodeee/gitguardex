'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  defaultCockpitSettings,
  readCockpitSettings,
  writeCockpitSettings,
  updateCockpitSettings,
  normalizeCockpitSettings,
} = require('../src/cockpit/settings');

function tempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'guardex-cockpit-settings-'));
}

function settingsPath(repoRoot) {
  return path.join(repoRoot, '.guardex', 'cockpit', 'settings.json');
}

test('defaultCockpitSettings returns a fresh default settings object', () => {
  const first = defaultCockpitSettings();
  const second = defaultCockpitSettings();

  first.theme = 'dim';

  assert.deepEqual(second, {
    theme: 'default',
    sidebarWidth: 32,
    refreshMs: 2000,
    defaultAgent: 'codex',
    defaultBase: 'main',
    showLocks: true,
    showWorktreePaths: true,
    autopilotDefault: false,
    editorCommand: '',
  });
});

test('readCockpitSettings returns defaults when no settings file exists', () => {
  const repoRoot = tempRepo();

  assert.deepEqual(readCockpitSettings(repoRoot), defaultCockpitSettings());
  assert.equal(fs.existsSync(settingsPath(repoRoot)), false);
});

test('normalizeCockpitSettings filters enums and clamps numeric settings', () => {
  assert.deepEqual(
    normalizeCockpitSettings({
      theme: 'high-contrast',
      sidebarWidth: 999,
      refreshMs: 1,
      defaultAgent: 'gemini',
      defaultBase: ' dev ',
      showLocks: false,
      showWorktreePaths: false,
      autopilotDefault: true,
      editorCommand: ' code --reuse-window ',
      ignored: 'value',
    }),
    {
      theme: 'high-contrast',
      sidebarWidth: 80,
      refreshMs: 500,
      defaultAgent: 'gemini',
      defaultBase: 'dev',
      showLocks: false,
      showWorktreePaths: false,
      autopilotDefault: true,
      editorCommand: 'code --reuse-window',
    },
  );

  assert.deepEqual(
    normalizeCockpitSettings({
      theme: 'neon',
      sidebarWidth: Number.NaN,
      refreshMs: Infinity,
      defaultAgent: 'unknown',
      defaultBase: '',
      showLocks: 'yes',
      showWorktreePaths: 0,
      autopilotDefault: 'false',
      editorCommand: 123,
    }),
    defaultCockpitSettings(),
  );
});

test('writeCockpitSettings persists normalized settings under .guardex cockpit path', () => {
  const repoRoot = tempRepo();

  const settings = writeCockpitSettings(repoRoot, {
    theme: 'dim',
    sidebarWidth: 10,
    refreshMs: 90000,
    defaultAgent: 'opencode',
    defaultBase: 'release',
    showLocks: false,
    showWorktreePaths: true,
    autopilotDefault: true,
    editorCommand: 'vim',
    extra: 'ignored',
  });

  assert.deepEqual(settings, {
    theme: 'dim',
    sidebarWidth: 20,
    refreshMs: 60000,
    defaultAgent: 'opencode',
    defaultBase: 'release',
    showLocks: false,
    showWorktreePaths: true,
    autopilotDefault: true,
    editorCommand: 'vim',
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(settingsPath(repoRoot), 'utf8')), settings);
  assert.deepEqual(readCockpitSettings(repoRoot), settings);
});

test('updateCockpitSettings merges a patch with stored settings', () => {
  const repoRoot = tempRepo();
  writeCockpitSettings(repoRoot, {
    theme: 'dim',
    sidebarWidth: 44,
    refreshMs: 3000,
    defaultAgent: 'claude',
    defaultBase: 'dev',
    showLocks: false,
    showWorktreePaths: false,
    autopilotDefault: true,
    editorCommand: 'code',
  });

  const updated = updateCockpitSettings(repoRoot, {
    refreshMs: 100,
    showLocks: true,
    editorCommand: 'nano',
  });

  assert.deepEqual(updated, {
    theme: 'dim',
    sidebarWidth: 44,
    refreshMs: 500,
    defaultAgent: 'claude',
    defaultBase: 'dev',
    showLocks: true,
    showWorktreePaths: false,
    autopilotDefault: true,
    editorCommand: 'nano',
  });
  assert.deepEqual(readCockpitSettings(repoRoot), updated);
});

test('readCockpitSettings normalizes existing files and tolerates malformed JSON', () => {
  const repoRoot = tempRepo();
  fs.mkdirSync(path.dirname(settingsPath(repoRoot)), { recursive: true });
  fs.writeFileSync(
    settingsPath(repoRoot),
    JSON.stringify({ theme: 'dim', sidebarWidth: 35, refreshMs: 2500, defaultAgent: 'cursor' }),
    'utf8',
  );

  assert.deepEqual(readCockpitSettings(repoRoot), {
    ...defaultCockpitSettings(),
    theme: 'dim',
    sidebarWidth: 35,
    refreshMs: 2500,
    defaultAgent: 'cursor',
  });

  fs.writeFileSync(settingsPath(repoRoot), '{bad json', 'utf8');

  assert.deepEqual(readCockpitSettings(repoRoot), defaultCockpitSettings());
});
