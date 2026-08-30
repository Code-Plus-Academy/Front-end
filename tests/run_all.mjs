/**
 * tests/run_all.mjs
 *
 * Master Automated Test Suite Runner for Code Plus Academy (CPA)
 * Executes all test tiers and reports aggregate pass/fail metrics.
 *
 * Usage:
 *   node tests/run_all.mjs
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const testSuites = [
  { name: 'Banner E2E Multi-Tier Verification Suite', file: 'tests/banner_e2e.test.mjs' },
  { name: 'DOM & Accessibility (A11y) Static Contract Suite', file: 'tests/a11y_dom.test.mjs' },
  { name: 'Adversarial Stress & Viewport Resolution Matrix', file: 'tests/stress_challenge.test.mjs' },
  { name: 'Network DM Navigation & URL Synchronization Suite', file: 'tests/network_dm_navigation.test.mjs' },
];

console.log(`\n======================================================================`);
console.log(`🚀 CODE PLUS ACADEMY (CPA) - TEST SUITE RUNNER`);
console.log(`======================================================================\n`);
console.log(`Project Root: ${projectRoot}`);
console.log(`Executing ${testSuites.length} test suites...\n`);

let overallSuccess = true;

async function runSuite(suite) {
  return new Promise((resolve) => {
    console.log(`▶ Running: ${suite.name} (${suite.file})`);
    console.log(`${'─'.repeat(70)}`);
    
    const child = spawn(process.execPath, [path.join(projectRoot, suite.file)], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      console.log(`\n[Suite Exit Code]: ${code}\n`);
      if (code !== 0) {
        overallSuccess = false;
      }
      resolve(code);
    });

    child.on('error', (err) => {
      console.error(`Error executing ${suite.file}:`, err);
      overallSuccess = false;
      resolve(1);
    });
  });
}

for (const suite of testSuites) {
  await runSuite(suite);
}

console.log(`======================================================================`);
console.log(`🏁 MASTER TEST RUNNER COMPLETION REPORT`);
console.log(`======================================================================`);

if (overallSuccess) {
  console.log(`\n✅ ALL SUITES PASSED! System conforms to all specifications in ORIGINAL_REQUEST.md.\n`);
  process.exit(0);
} else {
  console.error(`\n❌ ONE OR MORE SUITES REPORTED FAILURES. See above for details.\n`);
  process.exit(1);
}
