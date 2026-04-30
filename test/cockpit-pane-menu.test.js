'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PANE_MENU_ACTIONS,
  PANE_MENU_ACTION_IDS,
  PANE_MENU_FOOTER,
  applyPaneMenuKey,
  createPaneMenuState,
  normalizePaneMenuKey,
  renderPaneMenu,
} = require('../src/cockpit/pane-menu');

function session(overrides = {}) {
  return {
    id: 'session-1',
    agentName: 'codex',
    branch: 'agent/codex/example',
    worktreePath: '/repo/.omx/agent-worktrees/example',
    worktreeExists: true,
    ...overrides,
  };
}

test('renderPaneMenu renders the dmux-style title, items, hotkeys, and footer', () => {
  const state = createPaneMenuState({ session: session({ name: 'example-pane' }) });
  const output = renderPaneMenu(state, { width: 64 });

  assert.match(output, /^┌/);
  assert.match(output, /Menu: example-pane/);
  assert.match(output, /View\s+\[j\]/);
  assert.match(output, /Hide Pane\s+\[h\]/);
  assert.match(output, /Close\s+\[x\]/);
  assert.match(output, /Merge\s+\[m\]/);
  assert.match(output, /Create GitHub PR/);
  assert.match(output, /Project Focus\s+\[P\]/);
  assert.match(output, /Rename/);
  assert.match(output, /Copy Path/);
  assert.match(output, /Open in Editor/);
  assert.match(output, /Toggle Autopilot/);
  assert.match(output, /Create Child Worktree\s+\[b\]/);
  assert.match(output, /Browse Files\s+\[f\]/);
  assert.match(output, /Add Terminal to Worktree\s+\[A\]/);
  assert.match(output, /Add Agent to Worktree\s+\[a\]/);
  assert.match(output, /Reopen Closed Worktree\s+\[r\]/);
  assert.match(output, new RegExp(PANE_MENU_FOOTER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('pane menu action constants expose stable action ids', () => {
  assert.equal(PANE_MENU_ACTIONS.VIEW, 'view');
  assert.equal(PANE_MENU_ACTIONS.HIDE_PANE, 'hide-pane');
  assert.equal(PANE_MENU_ACTIONS.CREATE_PR, 'create-pr');
  assert.equal(PANE_MENU_ACTIONS.PROJECT_FOCUS, 'project-focus');
  assert.equal(PANE_MENU_ACTIONS.ADD_AGENT, 'add-agent');
  assert.equal(PANE_MENU_ACTIONS.REOPEN_CLOSED_WORKTREE, 'reopen-closed-worktree');
  assert.equal(PANE_MENU_ACTION_IDS.MERGE, 'merge');
});

test('renderPaneMenu supports deterministic ASCII and narrow output', () => {
  const state = createPaneMenuState({ session: session({ name: 'very-long-selected-pane-name' }) });
  const output = renderPaneMenu(state, { ascii: true, width: 40 });
  const secondOutput = renderPaneMenu(state, { ascii: true, width: 40 });
  const lines = output.trimEnd().split('\n');

  assert.equal(output, secondOutput);
  assert.match(output, /^\+/);
  assert.match(output, /\| Menu: very-long-selected-pane-name\s+\|/);
  assert.ok(lines.every((line) => line.length <= 40), lines.join('\n'));
});

test('applyPaneMenuKey navigates with j/k and arrows by default', () => {
  let state = createPaneMenuState({ session: session() });

  state = applyPaneMenuKey(state, '\u001b[B').state;
  assert.equal(state.selectedIndex, 1);

  state = applyPaneMenuKey(state, 'j').state;
  assert.equal(state.selectedIndex, 2);

  state = applyPaneMenuKey(state, '\u001b[A').state;
  assert.equal(state.selectedIndex, 1);

  state = applyPaneMenuKey(state, 'k').state;
  assert.equal(state.selectedIndex, 0);
});

test('applyPaneMenuKey selects the focused item with Enter', () => {
  const state = createPaneMenuState({ session: session(), selectedIndex: 3 });
  const result = applyPaneMenuKey(state, '\r');

  assert.equal(result.action, 'select');
  assert.equal(result.actionId, PANE_MENU_ACTION_IDS.MERGE);
  assert.equal(result.state.selectedActionId, PANE_MENU_ACTION_IDS.MERGE);
});

test('applyPaneMenuKey selects direct hotkeys', () => {
  const cases = [
    ['h', PANE_MENU_ACTION_IDS.HIDE_PANE],
    ['x', PANE_MENU_ACTION_IDS.CLOSE],
    ['m', PANE_MENU_ACTION_IDS.MERGE],
    ['P', PANE_MENU_ACTION_IDS.PROJECT_FOCUS],
    ['b', PANE_MENU_ACTION_IDS.CREATE_CHILD_WORKTREE],
    ['f', PANE_MENU_ACTION_IDS.BROWSE_FILES],
    ['A', PANE_MENU_ACTION_IDS.ADD_TERMINAL],
    ['a', PANE_MENU_ACTION_IDS.ADD_AGENT],
    ['r', PANE_MENU_ACTION_IDS.REOPEN_CLOSED_WORKTREE],
  ];

  for (const [key, actionId] of cases) {
    const result = applyPaneMenuKey(createPaneMenuState({ session: session() }), key);
    assert.equal(result.action, 'select', key);
    assert.equal(result.actionId, actionId, key);
  }
});

test('applyPaneMenuKey can prioritize j as the View hotkey when requested', () => {
  const result = applyPaneMenuKey(createPaneMenuState({ session: session(), hotkeyPriority: true }), 'j');

  assert.equal(result.action, 'select');
  assert.equal(result.actionId, PANE_MENU_ACTION_IDS.VIEW);
});

test('applyPaneMenuKey cancels with Escape and Ctrl-C', () => {
  const state = createPaneMenuState({ session: session() });

  assert.equal(applyPaneMenuKey(state, '\u001b').action, 'cancel');
  assert.equal(applyPaneMenuKey(state, '\u0003').state.canceled, true);
});

test('applyPaneMenuKey leaves disabled actions open with a clear status', () => {
  const state = createPaneMenuState({
    session: session({ worktreePath: '', worktreeExists: false }),
  });
  const result = applyPaneMenuKey(state, 'm');

  assert.equal(result.action, 'render');
  assert.equal(result.actionId, '');
  assert.match(result.state.message, /Worktree missing/);
});

test('normalizePaneMenuKey recognizes terminal escape sequences', () => {
  assert.equal(normalizePaneMenuKey(Buffer.from('\u001b[B')), 'down');
  assert.equal(normalizePaneMenuKey('\u001b[A'), 'up');
  assert.equal(normalizePaneMenuKey('\r'), 'enter');
  assert.equal(normalizePaneMenuKey('\u001b'), 'escape');
  assert.equal(normalizePaneMenuKey('\u001bM'), 'alt-shift-m');
  assert.equal(normalizePaneMenuKey({ name: 'm', alt: true, shift: true }), 'alt-shift-m');
  assert.equal(normalizePaneMenuKey('\u0003'), 'ctrl-c');
});
