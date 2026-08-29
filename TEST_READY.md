# TEST READY: Profile Banner 4:1 Responsive UI/UX & A11y System (Hardened Forensics)

## Executive Summary
The end-to-end multi-tier automated test suite for the **Code Plus Academy (CPA) Profile Banner System** is fully authored, structurally hardened with genuine static AST/code inspections (zero synthetic in-memory dummy assertions), and ready for continuous execution.

The test harness provides comprehensive coverage across all requirements in `ORIGINAL_REQUEST.md` and `PROJECT.md` spanning layout geometry, viewport scaling, avatar positioning, image fitting, accessibility trees, hidden inputs, range sliders, and multi-surface ratio synchronization.

---

## 1. Quick Execution Guide

Run all tests via the master test orchestrator:
```bash
node tests/run_all.mjs
```

Or execute targeted suites individually:
```bash
# Tier 1 - Tier 4 E2E Behavioral, Mathematical & Static Source Verification
node tests/banner_e2e.test.mjs

# Static JSX DOM & Accessibility Contract Audit
node tests/a11y_dom.test.mjs

# Adversarial 18-Viewport Resolution & Empirical Stress Harness
node tests/stress_challenge.test.mjs
```

---

## 2. Comprehensive Test Suite Catalog

### Tier 1: Feature Coverage (>=5 tests per feature)
| Category | Test Case | Target Requirement | Status |
|---|---|---|---|
| **PublicProfile 4:1 Ratio** | `F1.1: 800px standard width -> 200px height (4.0:1)` | R1 | READY |
| | `F1.2: 390px mobile width -> 140px minHeight clamp` | R1 | READY |
| | `F1.3: 1920px desktop width -> 360px maxHeight clamp` | R1 | READY |
| | `F1.4: Linear scaling range [560px-1440px] maintains exact 4:1` | R1 | READY |
| | `F1.5: Style contract verifies aspectRatio, minHeight, maxHeight from PublicProfile.jsx` | R1 | READY |
| **Object-Fit & Position** | `F2.1: Image objectFit is strictly "cover" in PublicProfile.jsx` | R1 | READY |
| | `F2.2: Image objectPosition is strictly "center center" in PublicProfile.jsx` | R1 | READY |
| | `F2.3: Rejection of legacy "center top" position in PublicProfile.jsx` | R1 | READY |
| | `F2.4: Full inset bounding box (position absolute, inset 0) in PublicProfile.jsx` | R1 | READY |
| | `F2.5: Image element carries fetchPriority="high" in PublicProfile.jsx` | R1 | READY |
| **Settings Preview 4:1** | `F3.1: Settings banner container specifies aspectRatio: "4 / 1" in Settings.jsx` | R2 | READY |
| | `F3.2: Settings banner container enforces minHeight: 120px` | R2 | READY |
| | `F3.3: Settings banner container enforces maxHeight: 240px` | R2 | READY |
| | `F3.4: Settings banner preview image uses cover & center center in Settings.jsx` | R2 | READY |
| | `F3.5: Settings banner replaces legacy fixed 110px height` | R2 | READY |
| **Zoom Slider A11y** | `F4.1: Slider contains explicit aria-label="Image zoom level" in Settings.jsx` | R3 | READY |
| | `F4.2: Absence of broken aria-labelledby="Zoom" in Settings.jsx` | R3 | READY |
| | `F4.3: Range slider bounds min=1, max=3, step=0.1 in Settings.jsx` | R2/R3 | READY |
| | `F4.4: Initial zoom level is 1 in Settings.jsx useState` | R2 | READY |
| | `F4.5: Event onChange parses value to Number float in Settings.jsx` | R2 | READY |
| **Hidden File Inputs** | `F5.1: Settings avatar input aria-label="Upload profile avatar" in Settings.jsx` | R3 | READY |
| | `F5.2: Settings banner input aria-label="Upload profile banner" in Settings.jsx` | R3 | READY |
| | `F5.3: RegisterFlow avatar input aria-label="Upload profile avatar" in RegisterFlow.jsx` | R3 | READY |
| | `F5.4: RegisterFlow banner input aria-label="Upload profile banner" in RegisterFlow.jsx` | R3 | READY |
| | `F5.5: Inputs hidden from visual layout while maintaining delegation` | R3 | READY |

### Tier 2: Boundary & Corner Cases (>=5 tests per feature)
| Category | Test Case | Target Requirement | Status |
|---|---|---|---|
| **Viewport Breakpoints** | `B1.1: 320px (iPhone SE) -> clamps to 140px minHeight` | R1 | READY |
| | `B1.2: 390px (iPhone 14) -> clamps to 140px minHeight` | R1 | READY |
| | `B1.3: 768px (iPad) -> exact 192px height (4.0:1)` | R1 | READY |
| | `B1.4: 1024px (Laptop) -> exact 256px height (4.0:1)` | R1 | READY |
| | `B1.5: 1440px (Desktop Wide) -> exact 360px maxHeight (4.0:1)` | R1 | READY |
| | `B1.6: 1920px (FHD) -> clamps to 360px maxHeight` | R1 | READY |
| | `B1.7: 3840px (4K) -> clamps to 360px maxHeight` | R1 | READY |
| **Cropper Computation** | `B2.1: Banner crop target computes 16 / 4 === 4.0` | R2 | READY |
| | `B2.2: Avatar crop target computes 1 (1:1 square)` | R2 | READY |
| | `B2.3: Zero precision drift between 16 / 4 and 4 / 1` | R2 | READY |
| | `B2.4: Pixel crop computation generates exact 4:1 dimensions` | R2 | READY |
| | `B2.5: Cropper modal dialog attributes (role, aria-modal, aria-label) in Settings.jsx`| R3 | READY |
| **Numeric Zoom Parsing** | `B3.1: Minimum zoom boundary parsing Number("1") === 1.0` | R2 | READY |
| | `B3.2: Maximum zoom boundary parsing Number("3") === 3.0` | R2 | READY |
| | `B3.3: Midpoint fractional zoom parsing Number("1.5") === 1.5` | R2 | READY |
| | `B3.4: Decimal step granularity handles increments [1.0..3.0]` | R2 | READY |
| | `B3.5: Non-numeric and NaN fallback sanitizer returns 1.0 default` | R2 | READY |
| **Fallback & CLS Stability** | `B4.1: Missing banner gracefully renders brand gradient in PublicProfile.jsx`| R1 | READY |
| | `B4.2: Pre-allocated aspect-ratio container yields 0px CLS` | R1 | READY |
| | `B4.3: Avatar negative margin overlap maintains clear banner space` | R1 | READY |
| | `B4.4: Registration preview fallback banner maintains 4:1 ratio in RegisterFlow/ProfilePreviewCard` | R2 | READY |
| | `B4.5: Settings fallback banner renders branded gradient in Settings.jsx` | R2 | READY |

### Tier 3: Cross-Feature Combinations
| Test Case | Scope | Status |
|---|---|---|
| `C1.1: 4-Way Ratio Congruence (Cropper = Settings = Profile = Register)` | Cross-Surface Ratio Sync | READY |
| `C1.2: Dark mode decorative overlays carry aria-hidden="true" in PublicProfile.jsx` | A11y & Theming | READY |
| `C1.3: Light mode decorative gradient carries aria-hidden="true" in PublicProfile.jsx` | A11y & Theming | READY |
| `C1.4: File input click trigger delegates cleanly to Cropper modal` | Interactive Flow | READY |
| `C1.5: Cropper modal cancellation resets state without leaking URL` | Modal State Isolation | READY |

### Tier 4: Real-World Application Scenarios
| Test Case | Scope | Status |
|---|---|---|
| `S1.1: E2E Upload -> Crop -> Settings Preview -> Public Profile Render` | Full User Journey | READY |
| `S1.2: Registration Flow: Step 5 Upload -> Live Preview Card -> Submit` | Onboarding Flow | READY |
| `S1.3: A11y Tree Audit: Interactive nodes labelled, decorative hidden across all components` | WCAG 2.1 AA Audit | READY |

---

## 3. Verification Checklist Mapping
- [x] **R1 (Responsive 4:1 Banner)**: Validated in `tests/banner_e2e.test.mjs` (F1, F2, B1, B4), `tests/a11y_dom.test.mjs`, and `tests/stress_challenge.test.mjs`
- [x] **R2 (Settings & Registration Preview)**: Validated in `tests/banner_e2e.test.mjs` (F3, B2, B3, C1, S1.1, S1.2), `tests/a11y_dom.test.mjs`, and `tests/stress_challenge.test.mjs`
- [x] **R3 (Accessibility & DOM Quality)**: Validated in `tests/banner_e2e.test.mjs` (F4, F5, B2.5, C1.2, C1.3, S1.3), `tests/a11y_dom.test.mjs`, and `tests/stress_challenge.test.mjs`
