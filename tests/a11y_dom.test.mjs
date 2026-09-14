/**
 * tests/a11y_dom.test.mjs
 *
 * Static & Structural Accessibility (a11y) & DOM Integrity Test Suite for CPA Profile Banner System.
 * Inspects source JSX components directly to verify:
 *   - WCAG 2.1 AA compliant accessible labels on sliders and file inputs
 *   - Proper modal dialog roles and accessibility properties
 *   - Absence of broken or unresolvable aria-labelledby references
 *   - aria-hidden="true" encapsulation on all decorative background elements
 *   - Aspect-ratio, min/max responsive style constraints in component trees
 *
 * Authoritative Source of Truth: ORIGINAL_REQUEST.md & PROJECT.md
 * Run with: node tests/a11y_dom.test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to read file content safely
function readComponent(relPath) {
  const fullPath = path.join(projectRoot, relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

// Test metrics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason: ${err.message}`);
  }
}

console.log(`\n======================================================================`);
console.log(`🔷 STATIC DOM & ACCESSIBILITY (A11Y) CONTRACT SUITE`);
console.log(`======================================================================\n`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Settings.jsx Accessibility & Semantics
// ─────────────────────────────────────────────────────────────────────────────
const settingsSource = readComponent('src/views/Settings.jsx');

test('Settings.jsx: Zoom range slider contains explicit aria-label="Image zoom level"', () => {
  const hasZoomAriaLabel = /aria-label=["']Image zoom level["']/.test(settingsSource);
  assert.ok(hasZoomAriaLabel, 'Settings.jsx must specify aria-label="Image zoom level" on zoom slider');
});

test('Settings.jsx: Zoom range slider does NOT contain broken aria-labelledby="Zoom"', () => {
  const hasBrokenAriaLabelledby = /aria-labelledby=["']Zoom["']/.test(settingsSource);
  assert.ok(!hasBrokenAriaLabelledby, 'Settings.jsx must NOT contain broken aria-labelledby="Zoom"');
});

test('Settings.jsx: Avatar hidden file input contains accessible aria-label', () => {
  const hasAvatarAriaLabel = /<input[^>]*ref=\{avatarInputRef\}[^>]*aria-label=["']Upload profile avatar["']/.test(settingsSource) ||
                             /<input[^>]*aria-label=["']Upload profile avatar["'][^>]*ref=\{avatarInputRef\}/.test(settingsSource) ||
                             /avatarInputRef[\s\S]{1,120}aria-label=["']Upload profile avatar["']/.test(settingsSource);
  assert.ok(hasAvatarAriaLabel, 'Settings.jsx avatar input must have aria-label="Upload profile avatar"');
});

test('Settings.jsx: Banner hidden file input contains accessible aria-label', () => {
  const hasBannerAriaLabel = /<input[^>]*ref=\{bannerInputRef\}[^>]*aria-label=["']Upload profile banner["']/.test(settingsSource) ||
                             /<input[^>]*aria-label=["']Upload profile banner["'][^>]*ref=\{bannerInputRef\}/.test(settingsSource) ||
                             /bannerInputRef[\s\S]{1,120}aria-label=["']Upload profile banner["']/.test(settingsSource);
  assert.ok(hasBannerAriaLabel, 'Settings.jsx banner input must have aria-label="Upload profile banner"');
});

test('Settings.jsx: Cropper modal container specifies role="dialog" and aria-modal="true"', () => {
  const hasDialogRole = /role=["']dialog["']/.test(settingsSource);
  const hasAriaModal = /aria-modal=["']true["']/.test(settingsSource);
  assert.ok(hasDialogRole, 'Cropper modal must define role="dialog"');
  assert.ok(hasAriaModal, 'Cropper modal must define aria-modal="true"');
});

test('Settings.jsx: Cropper maintains 16/4 (4:1) banner aspect ratio', () => {
  const has16_4Aspect = /aspect=\{cropTarget\s*===\s*['"]banner['"]\s*\?\s*16\s*\/\s*4\s*:\s*1\}/.test(settingsSource) ||
                        /aspect=\{cropTarget\s*===\s*['"]banner['"]\s*\?\s*4\s*:\s*1\}/.test(settingsSource) ||
                        /aspect=\{cropTarget\s*===\s*['"]banner['"]\s*\?\s*4\s*\/\s*1\s*:\s*1\}/.test(settingsSource);
  assert.ok(has16_4Aspect, 'Settings.jsx Cropper must compute aspect ratio 16 / 4 (4:1) for banner target');
});

test('Settings.jsx: Banner preview container implements 4:1 aspect ratio with responsive constraints', () => {
  const hasAspectRatio = /aspectRatio:\s*["']4\s*\/\s*1["']/.test(settingsSource) || /aspect-ratio:\s*4\s*\/\s*1/.test(settingsSource);
  const hasMinHeight = /minHeight:\s*["']?120(px)?["']?/.test(settingsSource);
  const hasMaxHeight = /maxHeight:\s*["']?240(px)?["']?/.test(settingsSource);
  assert.ok(hasAspectRatio, 'Settings.jsx banner preview card must have aspectRatio: "4 / 1"');
  assert.ok(hasMinHeight, 'Settings.jsx banner preview card must specify minHeight: "120px"');
  assert.ok(hasMaxHeight, 'Settings.jsx banner preview card must specify maxHeight: "240px"');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PublicProfile.jsx Layout, Responsive Ratios, and Decorative a11y
// ─────────────────────────────────────────────────────────────────────────────
const publicProfileSource = readComponent('src/views/PublicProfile.jsx');

test('PublicProfile.jsx: Hero cover container implements aspectRatio: "4 / 1"', () => {
  const hasAspectRatio = /aspectRatio:\s*["']4\s*\/\s*1["']/.test(publicProfileSource) ||
                         /aspect-ratio:\s*4\s*\/\s*1/.test(publicProfileSource);
  assert.ok(hasAspectRatio, 'PublicProfile.jsx hero cover must specify aspectRatio: "4 / 1"');
});

test('PublicProfile.jsx: Hero cover container enforces minHeight 140px and maxHeight 360px', () => {
  const hasMinHeight = /minHeight:\s*["']?140(px)?["']?/.test(publicProfileSource);
  const hasMaxHeight = /maxHeight:\s*["']?360(px)?["']?/.test(publicProfileSource);
  assert.ok(hasMinHeight, 'PublicProfile.jsx hero cover must specify minHeight: "140px"');
  assert.ok(hasMaxHeight, 'PublicProfile.jsx hero cover must specify maxHeight: "360px"');
});

test('PublicProfile.jsx: Banner image uses objectFit: "cover" and objectPosition: "center center"', () => {
  const hasObjectFitCover = /objectFit:\s*["']cover["']/.test(publicProfileSource);
  const hasObjectPositionCenter = /objectPosition:\s*["']center\s+center["']/.test(publicProfileSource);
  assert.ok(hasObjectFitCover, 'PublicProfile.jsx banner image must specify objectFit: "cover"');
  assert.ok(hasObjectPositionCenter, 'PublicProfile.jsx banner image must specify objectPosition: "center center"');
});

test('PublicProfile.jsx: Decorative background elements have aria-hidden="true"', () => {
  // Check for presence of aria-hidden in decorative elements
  const hasAriaHidden = /aria-hidden=["']true["']/.test(publicProfileSource);
  assert.ok(hasAriaHidden, 'PublicProfile.jsx decorative elements must carry aria-hidden="true"');
});

test('PublicProfile.jsx: Banner image carries fetchPriority="high" for zero CLS', () => {
  const hasFetchPriority = /fetchPriority=["']high["']/.test(publicProfileSource);
  assert.ok(hasFetchPriority, 'PublicProfile.jsx banner image must specify fetchPriority="high"');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. RegisterFlow.jsx & ProfilePreviewCard.jsx Synchronization
// ─────────────────────────────────────────────────────────────────────────────
const registerFlowSource = readComponent('src/views/auth/RegisterFlow.jsx');
const profilePreviewCardSource = readComponent('src/components/auth/registration/ProfilePreviewCard.jsx');

test('RegisterFlow.jsx: Hidden file inputs have accessible aria-labels', () => {
  const hasAvatarLabel = /aria-label=["']Upload profile avatar["']/.test(registerFlowSource);
  const hasBannerLabel = /aria-label=["']Upload profile banner["']/.test(registerFlowSource);
  assert.ok(hasAvatarLabel, 'RegisterFlow.jsx avatar input must have aria-label="Upload profile avatar"');
  assert.ok(hasBannerLabel, 'RegisterFlow.jsx banner input must have aria-label="Upload profile banner"');
});

test('RegisterFlow.jsx: .preview-banner CSS specifies aspect-ratio: 4 / 1', () => {
  const hasPreviewBannerRatio = /\.preview-banner[\s\S]*?aspect-ratio:\s*4\s*\/\s*1/.test(registerFlowSource) ||
                                /aspect-ratio:\s*4\s*\/\s*1[\s\S]*?\.preview-banner/.test(registerFlowSource) ||
                                /preview-banner[\s\S]*?aspect-ratio:\s*4\s*\/\s*1/.test(registerFlowSource);
  assert.ok(hasPreviewBannerRatio, 'RegisterFlow.jsx .preview-banner class must specify aspect-ratio: 4 / 1');
});

test('ProfilePreviewCard.jsx: Uses .preview-banner and encapsulates decorative avatar', () => {
  const hasPreviewBanner = /className=["']preview-banner["']/.test(profilePreviewCardSource);
  const hasAriaHiddenAvatar = /className=["']preview-avatar["'][^>]*aria-hidden=["']true["']/.test(profilePreviewCardSource);
  assert.ok(hasPreviewBanner, 'ProfilePreviewCard.jsx must render .preview-banner element');
  assert.ok(hasAriaHiddenAvatar, 'ProfilePreviewCard.jsx decorative avatar container must carry aria-hidden="true"');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n======================================================================`);
console.log(`📊 A11Y & DOM TEST RESULTS`);
console.log(`======================================================================`);
console.log(`Passed: ${passedTests}/${totalTests} tests`);
console.log(`Failed: ${failedTests}/${totalTests} tests`);
console.log(`${'─'.repeat(70)}\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL DOM & A11Y TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
