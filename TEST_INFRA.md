# TEST INFRA: FocusGram Platform Multi-Tier Verification Suite

## Test Philosophy
- Opaque-box, requirement-driven automated verification.
- Zero mock-polluted false positives — direct AST, DOM contract, static syntax, and live browser/runtime simulation.
- Methodology: Category-Partition + Boundary Value Analysis + Cross-Feature Combinations + Real-World Application Workloads.

## Feature Inventory & Test Coverage Mapping
| # | Feature | Target Scope | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (E2E Journey) |
|---|---------|--------------|:----------------:|:-----------------:|:----------------------:|:--------------------:|
| 1 | FocusGram Rebranding & UI Cohesion | Public views, Layout, App Router, Email | 5 | 5 | ✓ | ✓ |
| 2 | Statutory Legal Policies (Sec 79 Safe Harbor) | `Static.jsx` Terms (/terms) | 5 | 5 | ✓ | ✓ |
| 3 | DPDP Act 2023 Compliance & Rights | `Static.jsx` Privacy (/privacy) | 5 | 5 | ✓ | ✓ |
| 4 | Minor Protection & Parental Consent Flow | `RegisterFlow.jsx`, `ConsentBanner.jsx` | 5 | 5 | ✓ | ✓ |
| 5 | Support Desk SLAs & Grievance Redressal | `Static.jsx` Support (/support), GAC | 5 | 5 | ✓ | ✓ |
| 6 | ConsentBanner Mount & Cookie Preferences | `App.jsx`, `Footer.jsx` | 5 | 5 | ✓ | ✓ |
| 7 | Fluid Responsive Grids (320px to 4K) | `Builders.jsx`, `Partners.jsx` | 5 | 5 | ✓ | ✓ |
| 8 | Adaptive Typography `clamp()` | `Static.jsx`, `index.css` | 5 | 5 | ✓ | ✓ |
| 9 | WCAG AA Contrast & Theme Tokens | `AboutUs.jsx`, `Partners.jsx`, `tokens.css` | 5 | 5 | ✓ | ✓ |
| 10 | ARIA Accessibility Semantics | `MobileBottomNav.jsx`, `Navbar.jsx`, overlays | 5 | 5 | ✓ | ✓ |
| 11 | Production Build & Zero Lint Errors | Next.js compilation | 5 | 5 | ✓ | ✓ |

## Test Suite Architecture
- Master Runner: `tests/run_all.mjs`
- Test Suites:
  1. `tests/rebranding_contracts.test.mjs` — R1 FocusGram Branding, Page Titles, Metadata & Email Templates.
  2. `tests/legal_dpdp_compliance.test.mjs` — R2 Statutory Legal Policies, Sec 79 Intermediary Safe Harbor, DPDP 2023 Rights, Minor Controls, Support Desk SLAs & GAC links.
  3. `tests/a11y_dom.test.mjs` — R3 Fluid Grids, Clamp Typography, WCAG AA Contrast & ARIA Trees.
  4. `tests/banner_e2e.test.mjs` — 4:1 Banner Aspect Ratio, Cropper & Viewport Scaling.
  5. `tests/stress_challenge.test.mjs` — 18-Viewport Resolution Stress Matrix (320px to 3840px).

## Execution Commands
```bash
# Run all multi-tier test suites
node tests/run_all.mjs

# Execute individual suites
node tests/rebranding_contracts.test.mjs
node tests/legal_dpdp_compliance.test.mjs
node tests/a11y_dom.test.mjs
node tests/banner_e2e.test.mjs
node tests/stress_challenge.test.mjs

# Production Next.js Build
npm run build
```
