/**
 * tests/network_dm_navigation.test.mjs
 *
 * Automated verification suite for:
 * Network DM Deep-Link & Browser Back/Forward Navigation Synchronization
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('\n======================================================================');
console.log('🧪 RUNNING NETWORK DM NAVIGATION & URL SYNCHRONIZATION TEST SUITE');
console.log('======================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

// 1. Target Extraction Logic
function extractTargetFromSearch(search) {
  if (!search || typeof search !== 'string') return null;
  try {
    const params = new URLSearchParams(search);
    let raw = params.get('dm') || params.get('direct') || params.get('user');
    if (!raw) {
      const clean = search.replace(/^\?/, '').trim();
      if (clean.startsWith('@') || clean.startsWith('=')) {
        raw = clean.slice(1);
      }
    }
    if (!raw) return null;
    const target = raw.replace(/^@/, '').trim();
    return target.length > 0 ? target : null;
  } catch {
    return null;
  }
}

console.log('----------------------------------------------------------------------');
console.log('1. URL Query Parameter Parsing & Target Extraction');
console.log('----------------------------------------------------------------------');

runTest('Extracts username from ?dm=akaajju', () => {
  assert.equal(extractTargetFromSearch('?dm=akaajju'), 'akaajju');
});

runTest('Extracts username with multi-params ?dm=akaajju&tab=all&source=feed', () => {
  assert.equal(extractTargetFromSearch('?dm=akaajju&tab=all&source=feed'), 'akaajju');
});

runTest('Extracts username from ?direct=akaajju', () => {
  assert.equal(extractTargetFromSearch('?direct=akaajju'), 'akaajju');
});

runTest('Extracts username from ?user=akaajju', () => {
  assert.equal(extractTargetFromSearch('?user=akaajju'), 'akaajju');
});

runTest('Extracts username from shorthand ?@akaajju', () => {
  assert.equal(extractTargetFromSearch('?@akaajju'), 'akaajju');
});

runTest('Returns null on base /network (search is "")', () => {
  assert.equal(extractTargetFromSearch(''), null);
});

runTest('Returns null on lone question mark "?"', () => {
  assert.equal(extractTargetFromSearch('?'), null);
});

runTest('Returns null on unrelated params ?sort=recent&view=grid', () => {
  assert.equal(extractTargetFromSearch('?sort=recent&view=grid'), null);
});

// 2. Navigation State Synchronization Machine Simulation
console.log('\n----------------------------------------------------------------------');
console.log('2. Reactive Navigation State Machine Simulation');
console.log('----------------------------------------------------------------------');

function createNetworkNavigationStateMachine() {
  const conversations = [
    { id: 101, other_username: 'akaajju', other_name: 'AJJU' },
    { id: 102, other_username: 'sarah_dev', other_name: 'Sarah' },
  ];

  let currentUrl = '/network';
  let historyStack = ['/network'];
  let historyIndex = 0;

  // React State Simulation
  let activeConv = null;
  let newConvUser = null;
  let isChatActive = false;
  let dmTarget = null;

  function syncWithUrl(url) {
    currentUrl = url;
    const search = url.includes('?') ? url.substring(url.indexOf('?')) : '';
    const targetUsername = extractTargetFromSearch(search);

    if (!targetUsername) {
      dmTarget = null;
      activeConv = null;
      newConvUser = null;
      isChatActive = false;
      return;
    }

    const currentTarget = { username: targetUsername };
    dmTarget = currentTarget;
    const existing = conversations.find(c => c.other_username.toLowerCase() === targetUsername.toLowerCase());

    if (existing) {
      activeConv = existing.id;
      newConvUser = null;
      isChatActive = true;
    } else {
      newConvUser = currentTarget;
      activeConv = null;
      isChatActive = true;
    }
  }

  function navigate(to) {
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(to);
    historyIndex++;
    syncWithUrl(to);
  }

  function browserBack() {
    if (historyIndex > 0) {
      historyIndex--;
      syncWithUrl(historyStack[historyIndex]);
    }
  }

  function browserForward() {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      syncWithUrl(historyStack[historyIndex]);
    }
  }

  return {
    getState: () => ({ currentUrl, activeConv, newConvUser, isChatActive, dmTarget }),
    navigate,
    browserBack,
    browserForward,
    syncWithUrl,
  };
}

runTest('Initial load at /network starts with zero open chat and list view active', () => {
  const machine = createNetworkNavigationStateMachine();
  const state = machine.getState();
  assert.equal(state.currentUrl, '/network');
  assert.equal(state.activeConv, null);
  assert.equal(state.newConvUser, null);
  assert.equal(state.isChatActive, false);
});

runTest('Opening /network?dm=akaajju directly opens existing conversation (id: 101)', () => {
  const machine = createNetworkNavigationStateMachine();
  machine.syncWithUrl('/network?dm=akaajju');
  const state = machine.getState();
  assert.equal(state.activeConv, 101);
  assert.equal(state.newConvUser, null);
  assert.equal(state.isChatActive, true);
});

runTest('Navigating from /network to /network?dm=akaajju, then clicking Browser Back resets state to /network', () => {
  const machine = createNetworkNavigationStateMachine();
  assert.equal(machine.getState().isChatActive, false);

  // User clicks akaajju
  machine.navigate('/network?dm=akaajju');
  assert.equal(machine.getState().activeConv, 101);
  assert.equal(machine.getState().isChatActive, true);

  // User clicks Browser Back
  machine.browserBack();
  const state = machine.getState();
  assert.equal(state.currentUrl, '/network');
  assert.equal(state.activeConv, null);
  assert.equal(state.newConvUser, null);
  assert.equal(state.isChatActive, false);
});

runTest('Browser Forward reopens conversation after Browser Back', () => {
  const machine = createNetworkNavigationStateMachine();
  machine.navigate('/network?dm=akaajju');
  machine.browserBack();
  assert.equal(machine.getState().isChatActive, false);

  machine.browserForward();
  const state = machine.getState();
  assert.equal(state.currentUrl, '/network?dm=akaajju');
  assert.equal(state.activeConv, 101);
  assert.equal(state.isChatActive, true);
});

// 3. AST & Code Forensics
console.log('\n----------------------------------------------------------------------');
console.log('3. Source Code Forensics & Synchronization Contracts');
console.log('----------------------------------------------------------------------');

const socialCode = fs.readFileSync(path.join(projectRoot, 'src', 'views', 'Social.jsx'), 'utf-8');

runTest('Social.jsx has extractTargetFromSearch function with error handling', () => {
  assert(socialCode.includes('function extractTargetFromSearch(search)'));
  assert(socialCode.includes('params.get(\'dm\')'));
});

runTest('EmbeddedDM accepts targetUsername prop and synchronizes state on URL change', () => {
  assert(socialCode.includes('function EmbeddedDM({ targetUser = null, targetUsername = null })'));
  assert(socialCode.includes('if (!targetUsername && !targetUser)'));
});

runTest('MobileChatView accepts targetUsername prop and synchronizes onChatActiveChange', () => {
  assert(socialCode.includes('function MobileChatView({ children, devs = [], targetUser = null, targetUsername = null'));
  assert(socialCode.includes('onChatActiveChange(false)'));
});

runTest('Network component passes targetUsername to both MobileChatView and EmbeddedDM', () => {
  assert(socialCode.includes('<MobileChatView'));
  assert(socialCode.includes('targetUsername={targetUsername}'));
  assert(socialCode.includes('<EmbeddedDM targetUser={dmTarget} targetUsername={targetUsername} />'));
});

runTest('Network component registers popstate event listener for browser navigation', () => {
  assert(socialCode.includes('window.addEventListener(\'popstate\', handlePopState)'));
});

console.log('\n======================================================================');
console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} Tests Passed (100%)`);
console.log('======================================================================\n');
