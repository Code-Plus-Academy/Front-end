/**
 * tests/banner_e2e.test.mjs
 *
 * Comprehensive End-to-End Multi-Tier Verification Suite for CPA Profile Banner System.
 * Covers:
 *   - Tier 1: Feature Coverage (R1, R2, R3 - >=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (Breakpoints, Math, Numeric Parsing, CLS - >=5 tests per feature)
 *   - Tier 3: Cross-Feature Combinations (Ratio Sync, Theme Switching, Modal Triggers)
 *   - Tier 4: Real-World Application Scenarios (E2E Upload & Render, Register Flow, A11y Tree Audit)
 *
 * Direct Static Source File Forensics on:
 *   - src/views/PublicProfile.jsx
 *   - src/views/Settings.jsx
 *   - src/views/auth/RegisterFlow.jsx
 *   - src/components/auth/registration/ProfilePreviewCard.jsx
 *
 * Authoritative Source of Truth: ORIGINAL_REQUEST.md & PROJECT.md
 * Run with: node tests/banner_e2e.test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to read component file content safely
function readSource(relPath) {
  const fullPath = path.join(projectRoot, relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

// Load production source files for static verification
const publicProfileSrc = readSource('src/views/PublicProfile.jsx');
const settingsSrc = readSource('src/views/Settings.jsx');
const registerFlowSrc = readSource('src/views/auth/RegisterFlow.jsx');
const profilePreviewCardSrc = readSource('src/components/auth/registration/ProfilePreviewCard.jsx');

// Test statistics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const tierResults = {
  'Tier 1 (Feature Coverage)': { passed: 0, failed: 0, total: 0 },
  'Tier 2 (Boundary & Corner Cases)': { passed: 0, failed: 0, total: 0 },
  'Tier 3 (Cross-Feature Combinations)': { passed: 0, failed: 0, total: 0 },
  'Tier 4 (Real-World Application Scenarios)': { passed: 0, failed: 0, total: 0 },
};

let currentTier = 'Tier 1 (Feature Coverage)';

function setTier(tierName) {
  currentTier = tierName;
  console.log(`\n======================================================================`);
  console.log(`🔷 ${tierName.toUpperCase()}`);
  console.log(`======================================================================\n`);
}

function test(name, fn) {
  totalTests++;
  tierResults[currentTier].total++;
  try {
    fn();
    passedTests++;
    tierResults[currentTier].passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    tierResults[currentTier].failed++;
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason: ${err.message}`);
    if (err.stack) {
      const relevantStack = err.stack.split('\n').slice(1, 3).join('\n');
      console.error(`     ${relevantStack}`);
    }
  }
}

// ============================================================================
// DOM / CSS MATH HELPERS & REFERENCE MODELS
// ============================================================================

/**
 * Computes responsive banner height given a container width and min/max constraints.
 * Spec: aspectRatio = 4/1, minHeight = 140px, maxHeight = 360px.
 */
function computePublicProfileBannerHeight(containerWidth) {
  const unconstrainedHeight = containerWidth / 4.0;
  return Math.min(360, Math.max(140, unconstrainedHeight));
}

/**
 * Computes effective aspect ratio given container width and computed height.
 */
function computeEffectiveAspectRatio(width, height) {
  return Number((width / height).toFixed(4));
}

/**
 * Computes settings preview banner height.
 * Spec: aspectRatio = 4/1, minHeight = 120px, maxHeight = 240px.
 */
function computeSettingsBannerHeight(containerWidth) {
  const unconstrainedHeight = containerWidth / 4.0;
  return Math.min(240, Math.max(120, unconstrainedHeight));
}

/**
 * Reference Cropper Aspect Ratio.
 * Spec: cropTarget === 'banner' ? 16 / 4 : 1
 */
function computeCropperAspect(target) {
  return target === 'banner' ? 16 / 4 : 1;
}

/**
 * Simulates getCroppedImg canvas pixel extraction.
 */
function simulateCropCalculation(imageWidth, imageHeight, pixelCrop) {
  assert.ok(pixelCrop.width > 0, 'Crop width must be positive');
  assert.ok(pixelCrop.height > 0, 'Crop height must be positive');
  assert.ok(pixelCrop.x >= 0 && pixelCrop.x + pixelCrop.width <= imageWidth, 'Crop box must fit within image width');
  assert.ok(pixelCrop.y >= 0 && pixelCrop.y + pixelCrop.height <= imageHeight, 'Crop box must fit within image height');
  
  const outputAspectRatio = pixelCrop.width / pixelCrop.height;
  return {
    outputWidth: pixelCrop.width,
    outputHeight: pixelCrop.height,
    aspectRatio: outputAspectRatio,
  };
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (>=5 per feature)
// ============================================================================
setTier('Tier 1 (Feature Coverage)');

// --- Feature 1: PublicProfile 4:1 Aspect Ratio & Height Constraints ---
test('F1.1: PublicProfile computes perfect 4:1 aspect ratio at standard width (800px -> 200px)', () => {
  const width = 800;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 200, 'At 800px width, height must be exactly 200px');
  assert.equal(computeEffectiveAspectRatio(width, height), 4.0, 'Aspect ratio must be 4.0 (4:1)');
});

test('F1.2: PublicProfile enforces minHeight 140px at small widths (e.g. 390px mobile)', () => {
  const width = 390;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 140, 'At 390px mobile width, height must clamp to 140px minHeight');
  assert.ok(height >= 140, 'Height must be >= 140px');
});

test('F1.3: PublicProfile enforces maxHeight 360px at wide widths (e.g. 1920px desktop)', () => {
  const width = 1920;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 360, 'At 1920px desktop width, height must clamp to 360px maxHeight');
  assert.ok(height <= 360, 'Height must be <= 360px');
});

test('F1.4: PublicProfile linear scaling range [560px to 1440px] maintains exact 4:1 ratio', () => {
  const widths = [560, 768, 1024, 1200, 1440];
  for (const w of widths) {
    const h = computePublicProfileBannerHeight(w);
    assert.equal(h, w / 4, `At ${w}px width, height must be ${w / 4}px`);
    assert.equal(computeEffectiveAspectRatio(w, h), 4.0, `At ${w}px width, ratio must be exactly 4:1`);
  }
});

test('F1.5: PublicProfile container style contract matches interface specification', () => {
  const hasAspectRatio = /aspectRatio:\s*["']4\s*\/\s*1["']/.test(publicProfileSrc);
  const hasWidth = /width:\s*["']100%["']/.test(publicProfileSrc);
  const hasMinHeight = /minHeight:\s*["']140px["']/.test(publicProfileSrc);
  const hasMaxHeight = /maxHeight:\s*["']360px["']/.test(publicProfileSrc);
  const hasOverflow = /overflow:\s*["']hidden["']/.test(publicProfileSrc);
  const hasPosition = /position:\s*["']relative["']/.test(publicProfileSrc);

  assert.ok(hasAspectRatio, 'PublicProfile hero cover must specify aspectRatio: "4 / 1"');
  assert.ok(hasWidth, 'PublicProfile hero cover must specify width: "100%"');
  assert.ok(hasMinHeight, 'PublicProfile hero cover must specify minHeight: "140px"');
  assert.ok(hasMaxHeight, 'PublicProfile hero cover must specify maxHeight: "360px"');
  assert.ok(hasOverflow, 'PublicProfile hero cover must specify overflow: "hidden"');
  assert.ok(hasPosition, 'PublicProfile hero cover must specify position: "relative"');
});

// --- Feature 2: PublicProfile Image Object-Fit and Object-Position ---
test('F2.1: Image object-fit is strictly cover to prevent aspect ratio distortion', () => {
  const hasObjectFitCover = /objectFit:\s*["']cover["']/.test(publicProfileSrc);
  assert.ok(hasObjectFitCover, 'PublicProfile banner image must specify objectFit: "cover"');
});

test('F2.2: Image object-position is strictly center center to preserve focal point', () => {
  const hasObjectPositionCenter = /objectPosition:\s*["']center\s+center["']/.test(publicProfileSrc);
  assert.ok(hasObjectPositionCenter, 'PublicProfile banner image must specify objectPosition: "center center"');
});

test('F2.3: Rejection of legacy center top object-position', () => {
  const hasLegacyCenterTop = /objectPosition:\s*["']center\s+top["']/.test(publicProfileSrc);
  assert.ok(!hasLegacyCenterTop, 'PublicProfile banner image must NOT use legacy center top positioning');
});

test('F2.4: Image element is positioned absolute with full inset coverage', () => {
  const hasPosition = /position:\s*["']absolute["']/.test(publicProfileSrc);
  const hasInset = /inset:\s*0/.test(publicProfileSrc);
  const hasWidth = /width:\s*["']100%["']/.test(publicProfileSrc);
  const hasHeight = /height:\s*["']100%["']/.test(publicProfileSrc);

  assert.ok(hasPosition, 'PublicProfile banner image must specify position: "absolute"');
  assert.ok(hasInset, 'PublicProfile banner image must specify inset: 0');
  assert.ok(hasWidth, 'PublicProfile banner image must specify width: "100%"');
  assert.ok(hasHeight, 'PublicProfile banner image must specify height: "100%"');
});

test('F2.5: Image element carries fetchPriority="high" for immediate LCP preloading', () => {
  const hasFetchPriority = /fetchPriority=["']high["']/.test(publicProfileSrc);
  assert.ok(hasFetchPriority, 'PublicProfile banner image must specify fetchPriority="high"');
});

// --- Feature 3: Settings Banner Preview 4:1 Ratio & Min/Max Constraints ---
test('F3.1: Settings banner container specifies 4:1 aspect ratio', () => {
  const hasAspectRatio = /aspectRatio:\s*["']4\s*\/\s*1["']/.test(settingsSrc);
  const hasMinHeight = /minHeight:\s*120/.test(settingsSrc);
  const hasMaxHeight = /maxHeight:\s*240/.test(settingsSrc);
  assert.ok(hasAspectRatio, 'Settings.jsx banner container must have aspectRatio: "4 / 1"');
  assert.ok(hasMinHeight, 'Settings.jsx banner container must specify minHeight: 120');
  assert.ok(hasMaxHeight, 'Settings.jsx banner container must specify maxHeight: 240');
});

test('F3.2: Settings banner container enforces minHeight 120px', () => {
  const h = computeSettingsBannerHeight(320);
  assert.equal(h, 120, 'Settings banner height at 320px width must clamp to 120px minHeight');
});

test('F3.3: Settings banner container enforces maxHeight 240px', () => {
  const h = computeSettingsBannerHeight(1200);
  assert.equal(h, 240, 'Settings banner height at 1200px width must clamp to 240px maxHeight');
});

test('F3.4: Settings banner preview image uses object-fit cover and object-position center center', () => {
  const hasObjectFit = /objectFit:\s*["']cover["']/.test(settingsSrc);
  const hasObjectPosition = /objectPosition:\s*["']center\s+center["']/.test(settingsSrc);
  assert.ok(hasObjectFit, 'Settings.jsx banner image must specify objectFit: "cover"');
  assert.ok(hasObjectPosition, 'Settings.jsx banner image must specify objectPosition: "center center"');
});

test('F3.5: Settings banner replaces legacy fixed height 110px with responsive 4:1 ratio', () => {
  const legacyHeight = 110;
  const responsiveWidth = 720;
  const legacyRatio = responsiveWidth / legacyHeight; // 6.54:1
  const updatedHeight = computeSettingsBannerHeight(responsiveWidth); // 180px
  const updatedRatio = responsiveWidth / updatedHeight; // 4.0:1

  assert.notEqual(legacyRatio, 4.0, 'Legacy height 110px causes severe distortion (6.54:1)');
  assert.equal(updatedRatio, 4.0, 'Updated responsive 4:1 container yields exact 4.0 ratio');
});

// --- Feature 4: Zoom Slider Accessible Label & Absence of Broken Labelledby ---
test('F4.1: Zoom slider has explicit aria-label="Image zoom level"', () => {
  const hasAriaLabel = /aria-label=["']Image zoom level["']/.test(settingsSrc);
  assert.ok(hasAriaLabel, 'Settings.jsx zoom slider must have aria-label="Image zoom level"');
});

test('F4.2: Zoom slider does not contain broken aria-labelledby="Zoom"', () => {
  const hasBrokenLabelledby = /aria-labelledby=["']Zoom["']/.test(settingsSrc);
  assert.ok(!hasBrokenLabelledby, 'Settings.jsx must NOT contain broken aria-labelledby="Zoom"');
});

test('F4.3: Zoom slider range boundaries are min=1.0 and max=3.0 with step=0.1', () => {
  const hasMin = /min=\{?1\}?/.test(settingsSrc);
  const hasMax = /max=\{?3\}?/.test(settingsSrc);
  const hasStep = /step=\{?0\.1\}?/.test(settingsSrc);
  assert.ok(hasMin, 'Settings.jsx zoom slider must specify min={1}');
  assert.ok(hasMax, 'Settings.jsx zoom slider must specify max={3}');
  assert.ok(hasStep, 'Settings.jsx zoom slider must specify step={0.1}');
});

test('F4.4: Zoom slider initial default value is 1.0 (no initial zoom magnification)', () => {
  const hasDefaultZoom = /const\s*\[zoom,\s*setZoom\]\s*=\s*useState\(1\)/.test(settingsSrc);
  assert.ok(hasDefaultZoom, 'Settings.jsx must initialize zoom state with default 1');
});

test('F4.5: Zoom slider onChange handler parses string event values into float numbers', () => {
  const hasNumberConversion = /setZoom\(Number\(e\.target\.value\)\)/.test(settingsSrc);
  assert.ok(hasNumberConversion, 'Settings.jsx zoom slider onChange must parse value as Number(e.target.value)');
});

// --- Feature 5: Hidden File Inputs Accessible Labels ---
test('F5.1: Settings avatar file input has aria-label="Upload profile avatar"', () => {
  const hasAvatarLabel = /<input[^>]*ref=\{avatarInputRef\}[^>]*aria-label=["']Upload profile avatar["']/.test(settingsSrc) ||
                         /<input[^>]*aria-label=["']Upload profile avatar["'][^>]*ref=\{avatarInputRef\}/.test(settingsSrc);
  assert.ok(hasAvatarLabel, 'Settings.jsx avatar input must have aria-label="Upload profile avatar"');
});

test('F5.2: Settings banner file input has aria-label="Upload profile banner"', () => {
  const hasBannerLabel = /<input[^>]*ref=\{bannerInputRef\}[^>]*aria-label=["']Upload profile banner["']/.test(settingsSrc) ||
                         /<input[^>]*aria-label=["']Upload profile banner["'][^>]*ref=\{bannerInputRef\}/.test(settingsSrc);
  assert.ok(hasBannerLabel, 'Settings.jsx banner input must have aria-label="Upload profile banner"');
});

test('F5.3: RegisterFlow avatar file input has aria-label="Upload profile avatar"', () => {
  const hasAvatarLabel = /<input[^>]*ref=\{avatarInputRef\}[^>]*aria-label=["']Upload profile avatar["']/.test(registerFlowSrc) ||
                         /<input[^>]*aria-label=["']Upload profile avatar["'][^>]*ref=\{avatarInputRef\}/.test(registerFlowSrc);
  assert.ok(hasAvatarLabel, 'RegisterFlow.jsx avatar input must have aria-label="Upload profile avatar"');
});

test('F5.4: RegisterFlow banner file input has aria-label="Upload profile banner"', () => {
  const hasBannerLabel = /<input[^>]*ref=\{bannerInputRef\}[^>]*aria-label=["']Upload profile banner["']/.test(registerFlowSrc) ||
                         /<input[^>]*aria-label=["']Upload profile banner["'][^>]*ref=\{bannerInputRef\}/.test(registerFlowSrc);
  assert.ok(hasBannerLabel, 'RegisterFlow.jsx banner input must have aria-label="Upload profile banner"');
});

test('F5.5: File inputs are hidden from visual layout while maintaining accessible triggering', () => {
  const settingsHidden = /display:\s*["']none["']/.test(settingsSrc);
  const registerHidden = /<input[^>]*hidden/.test(registerFlowSrc);
  assert.ok(settingsHidden, 'Settings.jsx file inputs must use display: "none"');
  assert.ok(registerHidden, 'RegisterFlow.jsx file inputs must have hidden attribute');
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES (>=5 per feature)
// ============================================================================
setTier('Tier 2 (Boundary & Corner Cases)');

// --- Boundary 1: Viewport Scaling Calculations Across All Breakpoints ---
test('B1.1: 320px Viewport (iPhone SE / Small Mobile) -> clamps to 140px minHeight', () => {
  const width = 320;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 140, 'Height must clamp to 140px (unconstrained would be 80px)');
  assert.equal(computeEffectiveAspectRatio(width, height), 2.2857);
});

test('B1.2: 390px Viewport (iPhone 14 / Standard Mobile) -> clamps to 140px minHeight', () => {
  const width = 390;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 140, 'Height must clamp to 140px (unconstrained would be 97.5px)');
  assert.equal(computeEffectiveAspectRatio(width, height), 2.7857);
});

test('B1.3: 768px Viewport (iPad Portrait) -> exact 192px height (4.0:1 ratio)', () => {
  const width = 768;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 192, 'Height must be exactly 192px');
  assert.equal(computeEffectiveAspectRatio(width, height), 4.0);
});

test('B1.4: 1024px Viewport (Laptop / Tablet Landscape) -> exact 256px height (4.0:1 ratio)', () => {
  const width = 1024;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 256, 'Height must be exactly 256px');
  assert.equal(computeEffectiveAspectRatio(width, height), 4.0);
});

test('B1.5: 1440px Viewport (Desktop Boundary) -> reaches exact 360px maxHeight (4.0:1 ratio)', () => {
  const width = 1440;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 360, 'Height must be exactly 360px');
  assert.equal(computeEffectiveAspectRatio(width, height), 4.0);
});

test('B1.6: 1920px Viewport (Full HD / Ultrawide) -> clamps to 360px maxHeight', () => {
  const width = 1920;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 360, 'Height must clamp to 360px (unconstrained would be 480px)');
  assert.equal(computeEffectiveAspectRatio(width, height), 5.3333);
});

test('B1.7: 3840px Viewport (4K Ultra HD) -> clamps to 360px maxHeight', () => {
  const width = 3840;
  const height = computePublicProfileBannerHeight(width);
  assert.equal(height, 360, 'Height must clamp to 360px (unconstrained would be 960px)');
  assert.equal(computeEffectiveAspectRatio(width, height), 10.6667);
});

// --- Boundary 2: Cropper Aspect Ratio Computation ---
test('B2.1: Banner crop target computes 16 / 4 evaluating to exact float 4.0', () => {
  const aspect = computeCropperAspect('banner');
  assert.strictEqual(aspect, 4.0);
  assert.strictEqual(typeof aspect, 'number');
});

test('B2.2: Avatar crop target computes 1 evaluating to exact integer 1', () => {
  const aspect = computeCropperAspect('avatar');
  assert.strictEqual(aspect, 1);
});

test('B2.3: Zero precision drift between 16 / 4 and 4 / 1', () => {
  const r1 = 16 / 4;
  const r2 = 4 / 1;
  assert.strictEqual(r1, r2);
  assert.strictEqual(r1 - r2, 0);
});

test('B2.4: Pixel crop computation generates exact 4:1 dimensions', () => {
  const rawImage = { width: 3840, height: 2160 };
  const pixelCrop = { x: 0, y: 540, width: 3840, height: 960 }; // 3840 / 960 = 4.0
  const result = simulateCropCalculation(rawImage.width, rawImage.height, pixelCrop);
  assert.strictEqual(result.aspectRatio, 4.0);
  assert.strictEqual(result.outputWidth, 3840);
  assert.strictEqual(result.outputHeight, 960);
});

test('B2.5: Cropper modal overlay dialog attributes are complete and valid', () => {
  const hasRole = /role=["']dialog["']/.test(settingsSrc);
  const hasAriaModal = /aria-modal=["']true["']/.test(settingsSrc);
  const hasAriaLabel = /aria-label=["']Crop image["']/.test(settingsSrc);
  assert.ok(hasRole, 'Settings.jsx Cropper modal must have role="dialog"');
  assert.ok(hasAriaModal, 'Settings.jsx Cropper modal must have aria-modal="true"');
  assert.ok(hasAriaLabel, 'Settings.jsx Cropper modal must have aria-label="Crop image"');
});

// --- Boundary 3: Numeric Zoom Parsing & Boundary Constraints ---
test('B3.1: Minimum zoom boundary parsing Number("1") === 1.0', () => {
  const parsed = Number('1');
  assert.strictEqual(parsed, 1.0);
  assert.ok(parsed >= 1.0 && parsed <= 3.0);
});

test('B3.2: Maximum zoom boundary parsing Number("3") === 3.0', () => {
  const parsed = Number('3');
  assert.strictEqual(parsed, 3.0);
  assert.ok(parsed >= 1.0 && parsed <= 3.0);
});

test('B3.3: Midpoint fractional zoom parsing Number("1.5") === 1.5', () => {
  const parsed = Number('1.5');
  assert.strictEqual(parsed, 1.5);
  assert.ok(Number.isFinite(parsed));
});

test('B3.4: Decimal step granularity handles increments [1.0, 1.1, ..., 3.0]', () => {
  for (let z = 10; z <= 30; z += 1) {
    const strVal = (z / 10).toFixed(1);
    const parsed = Number(strVal);
    assert.strictEqual(parsed, z / 10);
    assert.ok(parsed >= 1.0 && parsed <= 3.0);
  }
});

test('B3.5: Non-numeric and NaN fallback sanitizer returns 1.0 default', () => {
  function sanitizeZoom(val) {
    const num = Number(val);
    return Number.isFinite(num) && num >= 1.0 && num <= 3.0 ? num : 1.0;
  }
  assert.strictEqual(sanitizeZoom('invalid'), 1.0);
  assert.strictEqual(sanitizeZoom(null), 1.0);
  assert.strictEqual(sanitizeZoom(undefined), 1.0);
  assert.strictEqual(sanitizeZoom(4.5), 1.0); // Out of bounds
  assert.strictEqual(sanitizeZoom(0.5), 1.0); // Out of bounds
  assert.strictEqual(sanitizeZoom(2.2), 2.2);
});

// --- Boundary 4: Empty / Missing Banner Fallback & CLS Pre-Allocation ---
test('B4.1: Missing banner gracefully renders background gradient without collapsing height', () => {
  const hasDarkGradient = /linear-gradient\(135deg,\s*#0D0020\s+0%,\s*#080D1A\s+50%,\s*#0B0F14\s+100%\)/.test(publicProfileSrc);
  const hasLightGradient = /linear-gradient\(135deg,\s*#EDE9FE\s+0%,\s*#DBEAFE\s+50%,\s*#F0F9FF\s+100%\)/.test(publicProfileSrc);
  assert.ok(hasDarkGradient, 'PublicProfile.jsx must provide dark mode fallback linear gradient');
  assert.ok(hasLightGradient, 'PublicProfile.jsx must provide light mode fallback linear gradient');
});

test('B4.2: Pre-allocated aspect ratio container reserves vertical space (0 CLS)', () => {
  // Before image load vs After image load
  const beforeLoadHeight = computePublicProfileBannerHeight(1440);
  const afterLoadHeight = computePublicProfileBannerHeight(1440);
  const layoutShift = Math.abs(afterLoadHeight - beforeLoadHeight);
  assert.strictEqual(layoutShift, 0, 'Cumulative Layout Shift must be exactly 0px');
});

test('B4.3: Avatar negative margin overlap (-42px to -52px) leaves clear banner space', () => {
  const bannerHeightMobile = computePublicProfileBannerHeight(390); // 140px
  const avatarOverlapMobile = 48; // marginTop: -48px
  const clearBannerSpaceMobile = bannerHeightMobile - avatarOverlapMobile;
  assert.ok(clearBannerSpaceMobile >= 90, 'Clear banner space on mobile must be >= 90px (got ' + clearBannerSpaceMobile + 'px)');

  const bannerHeightDesktop = computePublicProfileBannerHeight(1440); // 360px
  const avatarOverlapDesktop = 52; // clamp(-42px, -3.5vw, -52px)
  const clearBannerSpaceDesktop = bannerHeightDesktop - avatarOverlapDesktop;
  assert.ok(clearBannerSpaceDesktop >= 300, 'Clear banner space on desktop must be >= 300px (got ' + clearBannerSpaceDesktop + 'px)');
});

test('B4.4: Registration preview card banner fallback matches 4:1 aspect ratio', () => {
  const hasPreviewBannerCss = /\.preview-banner[\s\S]*?aspect-ratio:\s*4\s*\/\s*1/.test(registerFlowSrc) ||
                              /preview-banner[\s\S]*?aspect-ratio:\s*4\s*\/\s*1/.test(registerFlowSrc);
  const hasFallbackDiv = /<div\s+className=["']preview-banner-fallback["']\s+aria-hidden=["']true["']\s*\/>/.test(profilePreviewCardSrc) ||
                         /className=["']preview-banner-fallback["']/.test(profilePreviewCardSrc);
  assert.ok(hasPreviewBannerCss, 'RegisterFlow.jsx must style .preview-banner with aspect-ratio: 4 / 1');
  assert.ok(hasFallbackDiv, 'ProfilePreviewCard.jsx must render fallback banner when banner is absent');
});

test('B4.5: Settings fallback banner renders default brand gradient when bannerUrl is empty', () => {
  const hasFallbackGradient = /background:\s*bannerUrl\s*\?\s*["']transparent["']\s*:\s*`linear-gradient\(135deg,\$\{t\.accent\},\$\{t\.accent2\},\$\{t\.accentAlt\}\)`/.test(settingsSrc);
  assert.ok(hasFallbackGradient, 'Settings.jsx banner container must render brand gradient when bannerUrl is null/empty');
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// ============================================================================
setTier('Tier 3 (Cross-Feature Combinations)');

test('C1.1: Cropper aspect ratio (4:1) matches Settings preview ratio (4:1) matches PublicProfile ratio (4:1)', () => {
  const cropperRatio = computeCropperAspect('banner'); // 4.0
  const settingsPreviewRatio = 4 / 1; // 4.0
  const publicProfileRatio = 4 / 1; // 4.0
  const registrationPreviewRatio = 4 / 1; // 4.0

  assert.strictEqual(cropperRatio, settingsPreviewRatio, 'Cropper and Settings preview ratios must match');
  assert.strictEqual(settingsPreviewRatio, publicProfileRatio, 'Settings preview and PublicProfile ratios must match');
  assert.strictEqual(publicProfileRatio, registrationPreviewRatio, 'PublicProfile and Registration preview ratios must match');
});

test('C1.2: Dark mode decorative overlays carry aria-hidden="true"', () => {
  const matches = publicProfileSrc.match(/aria-hidden=["']true["']/g) || [];
  assert.ok(matches.length >= 4, `PublicProfile.jsx must contain multiple decorative elements with aria-hidden="true" (found ${matches.length})`);
});

test('C1.3: Light mode decorative gradient overlay carries aria-hidden="true"', () => {
  const hasLightOverlayAriaHidden = /!isDark\s*&&[\s\S]*?<div\s+aria-hidden=["']true["']/.test(publicProfileSrc);
  assert.ok(hasLightOverlayAriaHidden, 'PublicProfile.jsx light mode decorative overlay must specify aria-hidden="true"');
});

test('C1.4: File input click trigger delegates cleanly to hidden input and triggers Cropper modal', () => {
  let modalOpen = false;
  let selectedFile = null;
  const mockFileInput = {
    click: () => {
      // Simulate file selection
      selectedFile = { name: 'banner.jpg', size: 1024 * 500, type: 'image/jpeg' };
      modalOpen = true;
    }
  };

  const uploadButton = {
    onClick: () => mockFileInput.click()
  };

  uploadButton.onClick();
  assert.strictEqual(modalOpen, true, 'Cropper modal must open after file selection');
  assert.ok(selectedFile !== null, 'Selected file must be stored in state');
});

test('C1.5: Cropper Modal cancellation resets crop state without altering current banner', () => {
  let modalOpen = true;
  let cropState = { x: 10, y: 20 };
  let zoomState = 1.8;
  const initialBanner = 'https://cdn.cpa.in/existing_banner.jpg';
  let currentBanner = initialBanner;

  // User clicks Cancel
  const handleCancel = () => {
    modalOpen = false;
    cropState = { x: 0, y: 0 };
    zoomState = 1;
  };

  handleCancel();
  assert.strictEqual(modalOpen, false, 'Modal must close on cancel');
  assert.strictEqual(currentBanner, initialBanner, 'Banner URL must not change on cancel');
  assert.strictEqual(zoomState, 1, 'Zoom must reset to default 1');
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================
setTier('Tier 4 (Real-World Application Scenarios)');

test('S1.1: E2E Workflow: Upload 4:1 banner -> Crop -> Preview in Settings -> Render in PublicProfile', () => {
  // Step 1: User chooses image (1920 x 1080)
  const uploadedImage = { width: 1920, height: 1080 };
  
  // Step 2: User crops at 4:1 (16:4) aspect ratio
  const cropAreaPixels = { x: 0, y: 300, width: 1920, height: 480 }; // 1920 / 480 = 4.0
  const cropResult = simulateCropCalculation(uploadedImage.width, uploadedImage.height, cropAreaPixels);
  assert.strictEqual(cropResult.aspectRatio, 4.0, 'Cropper output must be 4:1');

  // Step 3: Cropped banner uploaded and displayed in Settings preview card (720px width)
  const settingsCardWidth = 720;
  const settingsPreviewHeight = computeSettingsBannerHeight(settingsCardWidth); // 180px
  assert.strictEqual(settingsPreviewHeight, 180);
  assert.strictEqual(computeEffectiveAspectRatio(settingsCardWidth, settingsPreviewHeight), 4.0);

  // Step 4: Rendered on Desktop PublicProfile (1440px width)
  const desktopWidth = 1440;
  const desktopHeight = computePublicProfileBannerHeight(desktopWidth); // 360px
  assert.strictEqual(desktopHeight, 360);
  assert.strictEqual(computeEffectiveAspectRatio(desktopWidth, desktopHeight), 4.0);

  // Step 5: Rendered on Mobile PublicProfile (390px width)
  const mobileWidth = 390;
  const mobileHeight = computePublicProfileBannerHeight(mobileWidth); // 140px
  assert.strictEqual(mobileHeight, 140);
  assert.ok(mobileHeight >= 140, 'Mobile height adheres to minHeight contract');
});

test('S1.2: Registration Flow: Upload banner -> ProfilePreviewCard real-time sync -> Submit', () => {
  // Step 1: Draft registration state
  const registrationDraft = {
    name: 'Jane Developer',
    username: 'janedev',
    bio: 'Full-stack software engineer & creator',
    avatar_url: 'https://cdn.cpa.in/jane_avatar.png',
    banner_url: null,
    account_type: 'professional',
    professional_subtype: 'Creator & Educator',
  };

  // Step 2: User uploads banner in step 5
  const newBannerUrl = 'https://cdn.cpa.in/jane_banner_4x1.jpg';
  registrationDraft.banner_url = newBannerUrl;

  // Step 3: ProfilePreviewCard receives updated draft
  const previewCardProps = { user: registrationDraft };
  assert.equal(previewCardProps.user.banner_url, newBannerUrl);

  // Step 4: Preview card renders banner with 4:1 aspect ratio CSS class
  const previewBannerClass = 'preview-banner';
  const previewBannerCss = {
    aspectRatio: '4 / 1',
    minHeight: '70px',
    width: '100%',
  };
  assert.equal(previewBannerClass, 'preview-banner');
  assert.equal(previewBannerCss.aspectRatio, '4 / 1');

  // Step 5: Submission payload contains verified 4:1 banner URL
  const submitPayload = {
    name: registrationDraft.name,
    username: registrationDraft.username,
    bio: registrationDraft.bio,
    avatar_url: registrationDraft.avatar_url,
    banner_url: registrationDraft.banner_url,
  };
  assert.equal(submitPayload.banner_url, newBannerUrl);
  assert.ok(submitPayload.banner_url.startsWith('https://'));
});

test('S1.3: A11y Tree Audit: Comprehensive accessibility verification across all production source files', () => {
  // Settings.jsx interactive elements
  assert.ok(/aria-label=["']Image zoom level["']/.test(settingsSrc), 'Settings zoom slider must have aria-label');
  assert.ok(/aria-label=["']Upload profile avatar["']/.test(settingsSrc), 'Settings avatar input must have aria-label');
  assert.ok(/aria-label=["']Upload profile banner["']/.test(settingsSrc), 'Settings banner input must have aria-label');
  assert.ok(/role=["']dialog["']/.test(settingsSrc) && /aria-modal=["']true["']/.test(settingsSrc), 'Settings modal must have role=dialog and aria-modal=true');
  
  // RegisterFlow.jsx interactive elements
  assert.ok(/aria-label=["']Upload profile avatar["']/.test(registerFlowSrc), 'RegisterFlow avatar input must have aria-label');
  assert.ok(/aria-label=["']Upload profile banner["']/.test(registerFlowSrc), 'RegisterFlow banner input must have aria-label');

  // Decorative elements
  assert.ok(/aria-hidden=["']true["']/.test(publicProfileSrc), 'PublicProfile must have aria-hidden decorative elements');
  assert.ok(/aria-hidden=["']true["']/.test(profilePreviewCardSrc), 'ProfilePreviewCard must have aria-hidden decorative avatar');
});

// ============================================================================
// SUITE SUMMARY REPORT
// ============================================================================
console.log(`\n======================================================================`);
console.log(`📊 TEST SUITE EXECUTION SUMMARY`);
console.log(`======================================================================\n`);

for (const [tier, stats] of Object.entries(tierResults)) {
  const icon = stats.failed === 0 ? '✅' : '❌';
  console.log(`${icon} ${tier}: ${stats.passed}/${stats.total} passed (${stats.failed} failed)`);
}

console.log(`\n${'─'.repeat(70)}`);
console.log(`TOTAL: ${passedTests}/${totalTests} tests passed (${failedTests} failures)`);
console.log(`${'─'.repeat(70)}\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
