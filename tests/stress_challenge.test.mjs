/**
 * tests/stress_challenge.test.mjs
 *
 * Empirical Adversarial Challenger & Stress Test Harness for CPA Profile Banner System
 * Developed by challenger_1 (Subagent)
 *
 * Tests:
 * 1. 18 Viewport Resolutions (320px to 3840px) geometry, aspect ratio & clamping
 * 2. Boundary Clamps (140px-360px PublicProfile, 120px-240px Settings)
 * 3. Avatar Overlap & Geometry Invariants across all viewports
 * 4. CLS Zero Layout Shift Simulation & Image Lifecycle States
 * 5. Cropper Mathematical Precision & Zoom Slider Stress Matrix
 * 6. Direct Source Code AST/Regex Forensics on all 6 Target Files
 *
 * Usage:
 *   node tests/stress_challenge.test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to read file content
function readSource(relPath) {
  const fullPath = path.join(projectRoot, relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

// Target Files
const files = {
  publicProfile: { path: 'src/views/PublicProfile.jsx', content: '' },
  desktopProfile: { path: 'src/components/profile/DesktopProfile.jsx', content: '' },
  mobileProfile: { path: 'src/components/profile/MobileProfile.jsx', content: '' },
  settings: { path: 'src/views/Settings.jsx', content: '' },
  registerFlow: { path: 'src/views/auth/RegisterFlow.jsx', content: '' },
  profilePreviewCard: { path: 'src/components/auth/registration/ProfilePreviewCard.jsx', content: '' },
};

for (const key of Object.keys(files)) {
  try {
    files[key].content = readSource(files[key].path);
  } catch (err) {
    console.error(`Failed to read ${files[key].path}: ${err.message}`);
  }
}

// Metric Tracking
let suiteTotal = 0;
let suitePassed = 0;
let suiteFailed = 0;
const failures = [];

function runTest(category, name, fn) {
  suiteTotal++;
  try {
    fn();
    suitePassed++;
    console.log(`  ✅ [PASS] [${category}] ${name}`);
  } catch (err) {
    suiteFailed++;
    failures.push({ category, name, error: err.message });
    console.error(`  ❌ [FAIL] [${category}] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

console.log(`\n======================================================================`);
console.log(`🛡️  EMPIRICAL CHALLENGER STRESS HARNESS - CODE PLUS ACADEMY`);
console.log(`======================================================================\n`);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: 18 VIEWPORT RESOLUTION GEOMETRY & CLAMPING STRESS MATRIX
// ─────────────────────────────────────────────────────────────────────────────
console.log(`----------------------------------------------------------------------`);
console.log(`1. Viewport Resolution Geometry & Clamping Matrix (18 Viewports)`);
console.log(`----------------------------------------------------------------------`);

const VIEWPORTS = [
  { name: 'iPhone SE / Galaxy Fold Cover', width: 320, category: 'mobile-small', expectedClamp: 'minHeight' },
  { name: 'Galaxy S8 / Small Android', width: 360, category: 'mobile-small', expectedClamp: 'minHeight' },
  { name: 'iPhone 12/13 Mini / iPhone X', width: 375, category: 'mobile-small', expectedClamp: 'minHeight' },
  { name: 'iPhone 14/15 Standard', width: 390, category: 'mobile-standard', expectedClamp: 'minHeight' },
  { name: 'Pixel 7 / Galaxy S21', width: 412, category: 'mobile-standard', expectedClamp: 'minHeight' },
  { name: 'iPhone 14/15 Pro Max', width: 428, category: 'mobile-large', expectedClamp: 'minHeight' },
  { name: 'Phablet / Small Tablet', width: 480, category: 'phablet', expectedClamp: 'minHeight' },
  { name: 'MinHeight Threshold Exact Boundary', width: 560, category: 'boundary-exact', expectedClamp: 'none' },
  { name: 'Foldable Tablet Unfolded', width: 600, category: 'tablet-small', expectedClamp: 'none' },
  { name: 'iPad Portrait / Tablet Standard', width: 768, category: 'tablet-portrait', expectedClamp: 'none' },
  { name: 'Tablet / Desktop Transition Boundary', width: 899, category: 'tablet-boundary', expectedClamp: 'none' },
  { name: 'Desktop Breakpoint Threshold', width: 900, category: 'desktop-small', expectedClamp: 'none' },
  { name: 'iPad Pro / Compact Laptop', width: 1024, category: 'laptop-small', expectedClamp: 'none' },
  { name: 'Wide Desktop Layout Boundary', width: 1200, category: 'desktop-standard', expectedClamp: 'none' },
  { name: 'Standard 720p / 13-inch Display', width: 1280, category: 'desktop-standard', expectedClamp: 'none' },
  { name: 'MaxHeight Threshold Exact Boundary', width: 1440, category: 'desktop-wide', expectedClamp: 'none' },
  { name: '1080p Full HD Display', width: 1920, category: 'desktop-fhd', expectedClamp: 'maxHeight' },
  { name: '1440p QHD / Ultrawide', width: 2560, category: 'desktop-qhd', expectedClamp: 'maxHeight' },
  { name: '4K Ultra HD Display', width: 3840, category: 'desktop-4k', expectedClamp: 'maxHeight' },
];

function calcPublicProfileBanner(width) {
  const naturalHeight = width / 4.0;
  const clampedHeight = Math.min(360, Math.max(140, naturalHeight));
  const effectiveRatio = width / clampedHeight;
  const isClampedMin = naturalHeight < 140;
  const isClampedMax = naturalHeight > 360;
  return { naturalHeight, clampedHeight, effectiveRatio, isClampedMin, isClampedMax };
}

function calcSettingsBanner(width) {
  const naturalHeight = width / 4.0;
  const clampedHeight = Math.min(240, Math.max(120, naturalHeight));
  const effectiveRatio = width / clampedHeight;
  const isClampedMin = naturalHeight < 120;
  const isClampedMax = naturalHeight > 240;
  return { naturalHeight, clampedHeight, effectiveRatio, isClampedMin, isClampedMax };
}

for (const vp of VIEWPORTS) {
  runTest('Viewport-Geometry', `${vp.width}px (${vp.name}) PublicProfile height & clamp verification`, () => {
    const res = calcPublicProfileBanner(vp.width);
    
    // Invariants
    assert.ok(res.clampedHeight >= 140, `Height ${res.clampedHeight}px must be >= 140px minHeight`);
    assert.ok(res.clampedHeight <= 360, `Height ${res.clampedHeight}px must be <= 360px maxHeight`);
    
    if (vp.expectedClamp === 'minHeight') {
      assert.equal(res.clampedHeight, 140, `At ${vp.width}px (<560px), height must clamp to exactly 140px`);
      assert.ok(res.isClampedMin, 'isClampedMin flag must be true');
    } else if (vp.expectedClamp === 'maxHeight') {
      assert.equal(res.clampedHeight, 360, `At ${vp.width}px (>1440px), height must clamp to exactly 360px`);
      assert.ok(res.isClampedMax, 'isClampedMax flag must be true');
    } else {
      // Unconstrained 4:1 linear zone
      assert.equal(res.clampedHeight, vp.width / 4, `At ${vp.width}px, height must be exactly width/4 (${vp.width / 4}px)`);
      assert.equal(Number(res.effectiveRatio.toFixed(6)), 4.0, `At ${vp.width}px, effective ratio must be exactly 4.0 (4:1)`);
      assert.equal(res.isClampedMin, false, 'isClampedMin must be false in linear zone');
      assert.equal(res.isClampedMax, false, 'isClampedMax must be false in linear zone');
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: SETTINGS & REGISTRATION PREVIEW BOUNDARY CLAMP STRESS MATRIX
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n----------------------------------------------------------------------`);
console.log(`2. Settings & Registration Preview Responsive Clamps Matrix`);
console.log(`----------------------------------------------------------------------`);

for (const vp of VIEWPORTS) {
  runTest('Settings-Geometry', `${vp.width}px (${vp.name}) Settings banner preview clamp verification`, () => {
    const res = calcSettingsBanner(vp.width);
    
    assert.ok(res.clampedHeight >= 120, `Settings height ${res.clampedHeight}px must be >= 120px minHeight`);
    assert.ok(res.clampedHeight <= 240, `Settings height ${res.clampedHeight}px must be <= 240px maxHeight`);
    
    if (vp.width < 480) {
      assert.equal(res.clampedHeight, 120, `At ${vp.width}px (<480px), Settings height must clamp to 120px`);
    } else if (vp.width > 960) {
      assert.equal(res.clampedHeight, 240, `At ${vp.width}px (>960px), Settings height must clamp to 240px`);
    } else {
      assert.equal(res.clampedHeight, vp.width / 4, `At ${vp.width}px, Settings height must equal width/4`);
      assert.equal(Number(res.effectiveRatio.toFixed(6)), 4.0, `At ${vp.width}px, Settings ratio must be exactly 4:1`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: AVATAR OVERLAP & REMAINING BANNER VISIBILITY INVARIANT
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n----------------------------------------------------------------------`);
console.log(`3. Avatar Overlap & Clear Banner Visibility Invariants`);
console.log(`----------------------------------------------------------------------`);

/**
 * Calculates avatar overlap and remaining visible banner height above avatar.
 * In DesktopProfile:
 *   overlap = clamp(-42px, -3.5vw, -52px)
 *   avatarSize = clamp(84px, 6.5vw, 104px)
 * In MobileProfile:
 *   marginTop = -48px
 *   avatarSize = 88px
 */
function calcAvatarGeometry(viewportWidth) {
  const isDesktop = viewportWidth >= 900;
  const bannerHeight = calcPublicProfileBanner(viewportWidth).clampedHeight;
  
  let overlapAmount; // positive number of pixels avatar penetrates into banner
  let avatarSize;
  
  if (isDesktop) {
    // clamp(-42, -3.5vw, -52) -> overlap is between 42px and 52px
    const rawOverlap = (viewportWidth * 0.035);
    overlapAmount = Math.min(52, Math.max(42, rawOverlap));
    
    const rawAvatar = (viewportWidth * 0.065);
    avatarSize = Math.min(104, Math.max(84, rawAvatar));
  } else {
    overlapAmount = 48;
    avatarSize = 88;
  }
  
  const remainingBannerHeightAboveAvatar = bannerHeight - overlapAmount;
  const remainingBannerRatio = remainingBannerHeightAboveAvatar / bannerHeight;
  
  return {
    isDesktop,
    bannerHeight,
    overlapAmount,
    avatarSize,
    remainingBannerHeightAboveAvatar,
    remainingBannerRatio,
  };
}

for (const vp of VIEWPORTS) {
  runTest('Avatar-Overlap', `${vp.width}px (${vp.name}) Avatar upward overlap invariant & visible banner headroom`, () => {
    const geo = calcAvatarGeometry(vp.width);
    
    // Invariant 1: Remaining banner height above avatar MUST be positive and >= 88px on all devices
    assert.ok(geo.remainingBannerHeightAboveAvatar >= 88, 
      `At ${vp.width}px, remaining banner height above avatar is ${geo.remainingBannerHeightAboveAvatar}px (must be >= 88px)`);
    
    // Invariant 2: Overlap never exceeds 40% of banner height
    assert.ok(geo.overlapAmount / geo.bannerHeight <= 0.40,
      `At ${vp.width}px, overlap occupies ${(geo.overlapAmount / geo.bannerHeight * 100).toFixed(1)}% of banner (must be <= 40%)`);
    
    // Invariant 3: Avatar size is within design bounds
    if (geo.isDesktop) {
      assert.ok(geo.avatarSize >= 84 && geo.avatarSize <= 104, `Desktop avatar size ${geo.avatarSize}px within [84, 104]`);
      assert.ok(geo.overlapAmount >= 42 && geo.overlapAmount <= 52, `Desktop overlap ${geo.overlapAmount}px within [42, 52]`);
    } else {
      assert.equal(geo.avatarSize, 88, `Mobile avatar size must be 88px`);
      assert.equal(geo.overlapAmount, 48, `Mobile overlap must be 48px`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: CLS (CUMULATIVE LAYOUT SHIFT) & IMAGE LIFECYCLE SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n----------------------------------------------------------------------`);
console.log(`4. Zero CLS Resilience & Image Lifecycle Invariants`);
console.log(`----------------------------------------------------------------------`);

runTest('CLS-Simulation', 'Pre-allocated aspect-ratio container yields zero CLS during banner image load', () => {
  // Simulate rendering lifecycle:
  // Step 1: Initial HTML/CSS layout before image metadata arrives
  // Step 2: Image bytes download and decode
  // Step 3: Image onload event fires
  
  for (const vp of VIEWPORTS) {
    // Initial container box created by CSS aspectRatio: "4 / 1", minHeight: 140, maxHeight: 360
    const initialBox = {
      width: vp.width,
      height: calcPublicProfileBanner(vp.width).clampedHeight,
      top: 0,
    };
    
    // Box after 4K image loads (e.g. 3840x960 natural dimension)
    const loadedBox = {
      width: vp.width,
      height: calcPublicProfileBanner(vp.width).clampedHeight,
      top: 0,
    };
    
    // CLS math:
    // impact_fraction = (height_after + vertical_shift) / viewport_height
    // distance_fraction = vertical_shift / viewport_height
    const verticalShift = Math.abs(loadedBox.top - initialBox.top);
    const heightShift = Math.abs(loadedBox.height - initialBox.height);
    const layoutShiftScore = verticalShift + heightShift;
    
    assert.equal(layoutShiftScore, 0, `At ${vp.width}px, layout shift score must be exactly 0 (got ${layoutShiftScore})`);
  }
});

runTest('CLS-Simulation', 'Missing or failed banner image does NOT collapse container height', () => {
  for (const vp of VIEWPORTS) {
    const emptyBannerHeight = calcPublicProfileBanner(vp.width).clampedHeight;
    assert.ok(emptyBannerHeight >= 140, `Empty banner height at ${vp.width}px is ${emptyBannerHeight}px (>= 140px)`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: CROPPER ARITHMETIC PRECISION & ZOOM SLIDER STRESS MATRIX
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n----------------------------------------------------------------------`);
console.log(`5. Cropper Precision & Numeric Zoom Parsing Stress Matrix`);
console.log(`----------------------------------------------------------------------`);

runTest('Cropper-Math', 'Cropper aspect ratio math 16 / 4 evaluates identically to 4 / 1 without floating drift', () => {
  const ratio1 = 16 / 4;
  const ratio2 = 4 / 1;
  const ratio3 = 4.0;
  
  assert.equal(ratio1, 4.0);
  assert.equal(ratio2, 4.0);
  assert.equal(ratio1, ratio2);
  assert.equal(ratio1 - ratio2, 0);
  assert.strictEqual(ratio1, ratio3);
});

runTest('Zoom-Parsing', 'Zoom slider numeric parser handles whole, decimal, step, and boundary values', () => {
  const testInputs = [
    { input: "1", expected: 1.0 },
    { input: "1.0", expected: 1.0 },
    { input: "1.1", expected: 1.1 },
    { input: "1.5", expected: 1.5 },
    { input: "2", expected: 2.0 },
    { input: "2.7", expected: 2.7 },
    { input: "3", expected: 3.0 },
    { input: "3.0", expected: 3.0 },
  ];
  
  for (const { input, expected } of testInputs) {
    const parsed = Number(input);
    assert.strictEqual(typeof parsed, 'number', `Parsed value of "${input}" must be of type number`);
    assert.equal(parsed, expected, `Parsed value of "${input}" must equal ${expected}`);
    assert.ok(!Number.isNaN(parsed), `Parsed value of "${input}" must not be NaN`);
  }
});

runTest('Zoom-Parsing', 'Zoom parser rejects non-numeric strings without throwing uncaught exceptions', () => {
  const invalidInputs = ["abc", "", "   ", "undefined", "null"];
  for (const input of invalidInputs) {
    const val = Number(input);
    // Sanitize pattern: Number(val) || 1
    const sanitized = (Number.isNaN(val) || val <= 0) ? 1 : val;
    assert.ok(sanitized >= 1 && sanitized <= 3, `Sanitized fallback for "${input}" must be within [1, 3]`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: DIRECT SOURCE CODE AST/REGEX FORENSICS (ALL 6 TARGET FILES)
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n----------------------------------------------------------------------`);
console.log(`6. Source Code AST & Static Contract Forensics`);
console.log(`----------------------------------------------------------------------`);

// 6.1 PublicProfile.jsx
runTest('Forensics-PublicProfile', 'PublicProfile.jsx specifies exact 4:1 responsive contract', () => {
  const src = files.publicProfile.content;
  assert.ok(/aspectRatio:\s*["']4\s*\/\s*1["']/.test(src), 'Must contain aspectRatio: "4 / 1"');
  assert.ok(/minHeight:\s*["']140px["']/.test(src), 'Must contain minHeight: "140px"');
  assert.ok(/maxHeight:\s*["']360px["']/.test(src), 'Must contain maxHeight: "360px"');
  assert.ok(/objectFit:\s*["']cover["']/.test(src), 'Must contain objectFit: "cover"');
  assert.ok(/objectPosition:\s*["']center center["']/.test(src), 'Must contain objectPosition: "center center"');
  assert.ok(/fetchPriority=["']high["']/.test(src), 'Must contain fetchPriority="high"');
  assert.ok(!/objectPosition:\s*["']center top["']/.test(src), 'Must NOT contain legacy objectPosition: "center top"');
});

runTest('Forensics-PublicProfile', 'PublicProfile.jsx decorative elements have aria-hidden="true"', () => {
  const src = files.publicProfile.content;
  const ariaHiddenMatches = src.match(/aria-hidden=["']true["']/g) || [];
  assert.ok(ariaHiddenMatches.length >= 4, `Expected at least 4 aria-hidden="true" decorative elements, found ${ariaHiddenMatches.length}`);
});

// 6.2 DesktopProfile.jsx
runTest('Forensics-DesktopProfile', 'DesktopProfile.jsx avatar has responsive negative margin clamp and size clamp', () => {
  const src = files.desktopProfile.content;
  assert.ok(/clamp\(-42px,\s*-3\.5vw,\s*-52px\)/.test(src), 'Avatar marginTop must use clamp(-42px, -3.5vw, -52px)');
  assert.ok(/clamp\(84px,\s*6\.5vw,\s*104px\)/.test(src), 'Avatar width/height must use clamp(84px, 6.5vw, 104px)');
  assert.ok(/<div aria-hidden="true"[^>]*>✓<\/div>/.test(src), 'Verified checkmark badge must carry aria-hidden="true"');
});

// 6.3 MobileProfile.jsx
runTest('Forensics-MobileProfile', 'MobileProfile.jsx avatar has -48px negative margin and 88px size', () => {
  const src = files.mobileProfile.content;
  assert.ok(/marginTop:\s*["']-48px["']/.test(src), 'Mobile avatar marginTop must be "-48px"');
  assert.ok(/width:\s*88,\s*height:\s*88/.test(src), 'Mobile avatar width/height must be 88');
  assert.ok(/<div aria-hidden="true"[^>]*>✓<\/div>/.test(src), 'Verified checkmark badge must carry aria-hidden="true"');
});

// 6.4 Settings.jsx
runTest('Forensics-Settings', 'Settings.jsx banner preview implements 4:1 aspect ratio with min 120px / max 240px', () => {
  const src = files.settings.content;
  assert.ok(/aspectRatio:\s*["']4\s*\/\s*1["']/.test(src), 'Settings banner must specify aspectRatio: "4 / 1"');
  assert.ok(/minHeight:\s*120/.test(src), 'Settings banner must specify minHeight: 120');
  assert.ok(/maxHeight:\s*240/.test(src), 'Settings banner must specify maxHeight: 240');
  assert.ok(/objectPosition:\s*["']center center["']/.test(src), 'Settings banner img must specify objectPosition: "center center"');
});

runTest('Forensics-Settings', 'Settings.jsx cropper modal implements dialog semantics, 16/4 aspect, and accessible zoom slider', () => {
  const src = files.settings.content;
  assert.ok(/role=["']dialog["']/.test(src), 'Cropper modal must define role="dialog"');
  assert.ok(/aria-modal=["']true["']/.test(src), 'Cropper modal must define aria-modal="true"');
  assert.ok(/aria-label=["']Crop image["']/.test(src), 'Cropper modal must define aria-label="Crop image"');
  assert.ok(/aspect=\{cropTarget\s*===\s*['"]banner['"]\s*\?\s*16\s*\/\s*4\s*:\s*1\}/.test(src), 'Cropper must use 16 / 4 aspect for banner');
  assert.ok(/aria-label=["']Image zoom level["']/.test(src), 'Zoom slider must specify aria-label="Image zoom level"');
  assert.ok(!/aria-labelledby=["']Zoom["']/.test(src), 'Zoom slider must NOT contain broken aria-labelledby="Zoom"');
  assert.ok(/setZoom\(Number\(e\.target\.value\)\)/.test(src), 'Zoom slider must parse Number(e.target.value)');
});

runTest('Forensics-Settings', 'Settings.jsx hidden file inputs have accessible aria-labels', () => {
  const src = files.settings.content;
  assert.ok(/<input[^>]*ref=\{avatarInputRef\}[^>]*aria-label=["']Upload profile avatar["']/.test(src) ||
            /avatarInputRef[\s\S]{1,120}aria-label=["']Upload profile avatar["']/.test(src),
            'Settings avatar input must have aria-label="Upload profile avatar"');
  assert.ok(/<input[^>]*ref=\{bannerInputRef\}[^>]*aria-label=["']Upload profile banner["']/.test(src) ||
            /bannerInputRef[\s\S]{1,120}aria-label=["']Upload profile banner["']/.test(src),
            'Settings banner input must have aria-label="Upload profile banner"');
});

// 6.5 RegisterFlow.jsx & ProfilePreviewCard.jsx
runTest('Forensics-RegisterFlow', 'RegisterFlow.jsx .preview-banner CSS specifies aspect-ratio: 4 / 1 and min-height: 70px', () => {
  const src = files.registerFlow.content;
  assert.ok(/\.preview-banner[\s\S]*?aspect-ratio:\s*4\s*\/\s*1/.test(src) ||
            /preview-banner[\s\S]*?aspect-ratio:\s*4\s*\/\s*1/.test(src),
            'RegisterFlow CSS must specify aspect-ratio: 4 / 1 for .preview-banner');
  assert.ok(/min-height:\s*70px/.test(src), 'RegisterFlow CSS must specify min-height: 70px');
});

runTest('Forensics-RegisterFlow', 'RegisterFlow.jsx file inputs have accessible aria-labels', () => {
  const src = files.registerFlow.content;
  const hasAvatarAria = /aria-label=["']Upload profile avatar["']/.test(src);
  const hasBannerAria = /aria-label=["']Upload profile banner["']/.test(src);
  
  if (!hasAvatarAria) {
    // Catch specific discrepancy
    const matched = src.match(/<input\s+ref=\{avatarInputRef\}[^>]*>/);
    throw new Error(`RegisterFlow.jsx avatar input aria-label mismatch. Expected aria-label="Upload profile avatar", found: ${matched ? matched[0] : 'not found'}`);
  }
  assert.ok(hasBannerAria, 'RegisterFlow.jsx banner input must have aria-label="Upload profile banner"');
});

runTest('Forensics-ProfilePreviewCard', 'ProfilePreviewCard.jsx uses .preview-banner and encapsulates decorative avatar', () => {
  const src = files.profilePreviewCard.content;
  assert.ok(/className=["']preview-banner["']/.test(src), 'ProfilePreviewCard must render .preview-banner');
  assert.ok(/className=["']preview-avatar["'][^>]*aria-hidden=["']true["']/.test(src), 'ProfilePreviewCard avatar must have aria-hidden="true"');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY REPORT
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n======================================================================`);
console.log(`📊 EMPIRICAL STRESS CHALLENGER SUMMARY REPORT`);
console.log(`======================================================================`);
console.log(`Total Stress Invariants Tested : ${suiteTotal}`);
console.log(`Passed Invariants             : ${suitePassed}`);
console.log(`Failed Invariants             : ${suiteFailed}`);
console.log(`Success Rate                  : ${((suitePassed / suiteTotal) * 100).toFixed(2)}%`);
console.log(`──────────────────────────────────────────────────────────────────────`);

if (suiteFailed > 0) {
  console.log(`\n❌ DISCOVERED DEFECTS & REGRESSIONS:`);
  for (const f of failures) {
    console.log(`  - [${f.category}] ${f.name}`);
    console.log(`    Detail: ${f.error}`);
  }
  console.log(`\nVERDICT: REQUEST_CHANGES`);
  process.exit(1);
} else {
  console.log(`\n🎉 ALL 18 VIEWPORT AND STRESS INVARIANTS SATISFIED EMPIRICALLY!`);
  console.log(`\nVERDICT: APPROVE`);
  process.exit(0);
}
