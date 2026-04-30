'use strict';

const DEFAULT_SETTINGS = {
  theme: 'default',
  sidebarWidth: 32,
  refreshMs: 2000,
  defaultAgent: 'codex',
  defaultBase: 'main',
  showLocks: true,
  showWorktreePaths: true,
  autopilotDefault: false,
  editorCommand: '',
};

const SECTION_DEFINITIONS = [
  {
    title: 'Appearance',
    fields: [
      ['theme', 'Theme', 'default, dim, high-contrast'],
    ],
  },
  {
    title: 'Layout',
    fields: [
      ['sidebarWidth', 'Sidebar width', '20-80 columns'],
      ['refreshMs', 'Refresh interval', '500-60000 ms'],
      ['showWorktreePaths', 'Show worktree paths', 'true, false'],
    ],
  },
  {
    title: 'Agents',
    fields: [
      ['defaultAgent', 'Default agent', 'codex, claude, opencode, cursor, gemini'],
      ['defaultBase', 'Default base', 'any branch name'],
      ['autopilotDefault', 'Autopilot default', 'true, false'],
    ],
  },
  {
    title: 'Safety',
    fields: [
      ['showLocks', 'Show locks', 'true, false'],
    ],
  },
  {
    title: 'Editor',
    fields: [
      ['editorCommand', 'Editor command', 'any shell command, blank'],
    ],
  },
];

const KEYBINDINGS = [
  '↑/↓ navigate',
  'Enter edit',
  'Esc back',
  'q quit',
];

function normalizeSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
}

function formatValue(value) {
  if (value === '') {
    return '(blank)';
  }
  if (value === undefined || value === null) {
    return '-';
  }
  return String(value);
}

function fieldLine(field, label, available, settings, selectedField) {
  const marker = field === selectedField ? '>' : ' ';
  return `${marker} ${label}: ${formatValue(settings[field])} (available: ${available})`;
}

function resolveSelectedField(options) {
  if (!options || typeof options !== 'object') {
    return null;
  }
  if (typeof options.selectedField === 'string') {
    return options.selectedField;
  }

  return null;
}

function renderSection(section, settings, selectedField) {
  const lines = [`[${section.title}]`];
  for (const [field, label, available] of section.fields) {
    lines.push(fieldLine(field, label, available, settings, selectedField));
  }
  return lines.join('\n');
}

function renderSettingsScreen(settings, options = {}) {
  const current = normalizeSettings(settings);
  const selectedField = resolveSelectedField(options);
  const lines = [
    'gx cockpit settings',
    'Plain terminal settings view',
    '',
  ];

  for (const section of SECTION_DEFINITIONS) {
    lines.push(renderSection(section, current, selectedField));
    lines.push('');
  }

  lines.push('[Keybindings]');
  for (const keybinding of KEYBINDINGS) {
    lines.push(`  ${keybinding}`);
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  renderSettingsScreen,
};
