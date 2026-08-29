# Project: FocusGram Platform Production Release (powered by Code Plus Academy)

## Architecture
- **Tech Stack**: Next.js 16 (React 19 / ES Modules), Tailwind CSS, semantic CSS tokens (`tokens.css`, `tokens.js`), inline responsive styles with `clamp()`.
- **Branding Architecture**:
  - Primary Brand Identity: **FocusGram (powered by Code Plus Academy)**.
  - SEO / Page Titles: `FocusGram — Learn, Connect & Grow (powered by Code Plus Academy)` or `FocusGram | [Page] (powered by Code Plus Academy)`.
  - Layout: `src/components/layout/Navbar.jsx`, `src/components/layout/Footer.jsx`, `src/components/layout/AuthTerminalLayout.jsx`.
  - Views: `src/views/AboutUs.jsx`, `src/views/Builders.jsx`, `src/views/BuilderDetail.jsx`, `src/views/Partners.jsx`, `src/views/Feed.jsx`, `src/views/PublicProfile.jsx`, `src/views/Landing.jsx`.
  - App Router: `app/layout.jsx`, `app/**/page.jsx`.
  - Email: `src/components/email/NotesArenaProductUpdateEmail.jsx`.
- **Legal & Statutory DPDP Compliance Architecture**:
  - `src/views/Static.jsx`: Terms of Service (/terms), Privacy Policy (/privacy), Cookie Policy (/cookie-policy), Support & Grievance Desk (/support), Copyright & Takedown (/copyright-policy), FAQ (/faq).
  - Legal Entity: FocusGram (operated under Code Plus Academy Private Limited, Pune, Maharashtra, India).
  - Intermediary Safe Harbor: Section 79 Information Technology Act, 2000 & IT Rules 2021.
  - Dispute Resolution: Arbitration and Conciliation Act, 1996 with seat/venue in Pune, India.
  - Data Protection: Digital Personal Data Protection (DPDP) Act, 2023 Data Fiduciary & Data Principal roles, Sections 11–14 rights (access, correction, erasure, nomination, grievance redressal).
  - Minor Safety: <13 prohibited, 13–18 verifiable parental consent, zero tracking/profiling, no targeted ads for minors.
  - Grievance Redressal: Grievance Officer Mr. Atharva Kapse (`grievance@focusgram.in`), 24h acknowledgement SLA, 15-day resolution SLA, GAC escalation (`https://gac.gov.in`).
  - Consent Management: `ConsentBanner.jsx` mounted in `AppLayout` with Google Consent Mode v2 and Footer preferences trigger.
- **Fluid Responsive & Accessibility (A11y) Architecture**:
  - Viewport Scaling: 320px (iPhone SE) to 4K Ultrawide, no fixed-width overflows (`minmax(min(100%, 280px), 1fr)`).
  - Safe Area Insets: `env(safe-area-inset-bottom)`, `pb-safe`, `viewportFit: 'cover'`.
  - Adaptive Typography: CSS `clamp()` for headings and body text.
  - Theme Tokens: WCAG AA contrast (>= 4.5:1) in light and dark modes.
  - ARIA Semantics: `aria-label` on interactive buttons/inputs, `aria-expanded` on accordions, `aria-hidden="true"` on decorative overlays.
- **Verification Architecture**:
  - Master Runner: `tests/run_all.mjs`.
  - Suites: `banner_e2e.test.mjs`, `a11y_dom.test.mjs`, `stress_challenge.test.mjs`, `rebranding_contracts.test.mjs`, `legal_dpdp_compliance.test.mjs`.
  - Package Script: `"test": "node tests/run_all.mjs"`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F1. FocusGram Views & Component Rebranding | Transition branding to FocusGram (powered by Code Plus Academy) across AboutUs, Builders, Partners, Feed, PublicProfile, Landing, ShareSheet, ErrorBoundary, and Email templates. | M1 | Survey (R1) |
| 2 | F2. SEO <Helmet> & App Router Metadata Rebranding | Update all view `<Helmet>` titles and `app/layout.jsx` / `app/**/page.jsx` metadata to FocusGram standards. | M1 | Survey (R1) |
| 3 | F3. Terms of Service & Intermediary Safe Harbor | Section 79 IT Act 2000 safe harbor, educational code "AS IS" disclaimer, Pune binding arbitration, and fix stray JSX tags in `Static.jsx`. | M2 | Survey (R2) |
| 4 | F4. DPDP Act 2023 Privacy Policy & Rights | Define Data Fiduciary/Principal roles, Purpose Limitation, and Sections 11–14 Data Principal rights (including Right to Nominate) in `Static.jsx`. | M2 | Survey (R2) |
| 5 | F5. Minor Protection Controls & Age Gate | Prohibit <13, require 13–18 parental consent, add Step 1 validation in `RegisterFlow.jsx`, zero tracking/ads for minors. | M2 | Survey (R2) |
| 6 | F6. Support & Grievance Redressal SLA Desk | 24h acknowledgement SLA, 15-day resolution SLA, Grievance Officer details, 7-day appeal timeline, GAC escalation link, 3-strike repeat infringer policy. | M2 | Survey (R2) |
| 7 | F7. ConsentBanner Mount & Cookie Preferences Trigger | Mount `ConsentBanner` in `src/App.jsx` (`AppLayout`) and wire "Cookie Preferences" modal trigger in `src/components/layout/Footer.jsx`. | M2 | Survey (R2) |
| 8 | F8. Fluid Responsive Grids & Safe Area Inset Support | Clamp grid minimums in `Builders.jsx` and `Partners.jsx` to `minmax(min(100%, 280px), 1fr)`; maintain safe area insets on mobile nav and media players. | M3 | Survey (R3) |
| 9 | F9. Adaptive Typography with CSS clamp() | Standardize fixed px integer headings in `Static.jsx` to CSS `clamp(1.75rem, 4vw, 2.25rem)`. | M3 | Survey (R3) |
| 10 | F10. WCAG AA Contrast & Semantic Theme Tokens | Replace hardcoded cyan `#00dbe9` and black-on-blue buttons with semantic theme tokens in `AboutUs.jsx`, `Partners.jsx`, `Builders.jsx`. | M3 | Survey (R3) |
| 11 | F11. ARIA Attributes & Keyboard Accessibility | Add `aria-label` on icon buttons in `MobileBottomNav.jsx` and `Navbar.jsx`, `aria-expanded` on `Static.jsx` accordions, `aria-label` on `ConsentBanner.jsx` checkboxes, and `aria-hidden` on decorative visual overlays. | M3 | Survey (R3) |
| 12 | F12. Automated Multi-Tier Verification Suite | Create `rebranding_contracts.test.mjs` and `legal_dpdp_compliance.test.mjs`, wire into `tests/run_all.mjs`, and add `"test"` script in `package.json`. | M4 | Survey (R4) |
| 13 | F13. Production Next.js Build & Zero Compilation Errors | Verify clean compilation of Next.js production build (`npm run build`) with zero lint/TypeScript errors and 100% test pass rate. | M4 | Survey (R4) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Codebase Survey & Feature Mapping | 3 parallel Explorers mapping R1, R2, R3, R4 | none | DONE |
| M1 | FocusGram Rebranding & UI Cohesion | F1, F2 (Views, Layouts, App Router, Email, Metadata) | M0 | PLANNED |
| M2 | Statutory Legal & DPDP Compliance Suite | F3, F4, F5, F6, F7 (Static.jsx, ConsentBanner, Footer, RegisterFlow) | M0 | PLANNED |
| M3 | Responsive Fluid Layout & WCAG A11y Hardening | F8, F9, F10, F11 (Grids, Clamp Typography, Contrast, ARIA) | M0 | PLANNED |
| M4 | Multi-Tier Verification & Production Build Quality | F12, F13 (Automated Test Suites, Build Verification, 100% Pass) | M1, M2, M3 | PLANNED |

## Interface Contracts
### FocusGram Branding Contract
- Public display name: `FocusGram (powered by Code Plus Academy)` or `FocusGram`.
- Page title format: `<title>FocusGram — Learn, Connect & Grow (powered by Code Plus Academy)</title>` or `<title>[Page] | FocusGram (powered by Code Plus Academy)</title>`.
- Token consistency: Preserve CSS variable names (`--primary`, `--surface`, `--text`, etc.) and image asset paths (`/cpa-logo-name-dark.png`, `/favicon-dark.png`) for backwards compatibility.

### Statutory DPDP & Intermediary Legal Contract
- Governing Law: Laws of India.
- Dispute Jurisdiction: Binding arbitration under Arbitration and Conciliation Act, 1996 in Pune, Maharashtra, India.
- Intermediary Protection: Section 79 of Information Technology Act, 2000.
- Privacy Standard: DPDP Act 2023 (Data Fiduciary / Data Principal, Section 11–14 Rights).
- Grievance Officer: Mr. Atharva Kapse (`grievance@focusgram.in`), 24h acknowledgement SLA, 15-day resolution SLA.
- Escalation: Grievance Appellate Committee (`https://gac.gov.in`).
- Minor Protection: <13 prohibited, 13–18 parental consent, zero tracking/profiling.

### Fluid & A11y Layout Contract
- Responsive Grid: `gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'` (320px to 4K).
- Heading Typography: `fontSize: 'clamp(1.75rem, 4vw, 2.5rem)'`.
- Contrast: Normal text >= 4.5:1, Large text >= 3:1 in both light and dark modes.
- ARIA: All interactive button elements have non-empty accessible name (`aria-label` or visible text). All accordion triggers have `aria-expanded`. Decorative SVGs/overlays have `aria-hidden="true"`.

## Code Layout
- `src/views/`: Application views (`AboutUs.jsx`, `Builders.jsx`, `BuilderDetail.jsx`, `Partners.jsx`, `Feed.jsx`, `PublicProfile.jsx`, `Landing.jsx`, `Static.jsx`, `Notifications.jsx`, `DM.jsx`, `ShortsPage.jsx`, `Settings.jsx`).
- `src/components/layout/`: Layout components (`Navbar.jsx`, `Footer.jsx`, `AuthTerminalLayout.jsx`, `MobileBottomNav.jsx`, `ConsentBanner.jsx`).
- `src/components/email/`: Transactional email templates (`NotesArenaProductUpdateEmail.jsx`).
- `src/components/ui/`: UI components (`ReportModal.jsx`, `ShareSheet.jsx`, `CommentSheet.jsx`).
- `app/`: Next.js App Router metadata and server routes (`app/layout.jsx`, `app/**/page.jsx`).
- `tests/`: Multi-tier test suites (`tests/run_all.mjs`, `tests/rebranding_contracts.test.mjs`, `tests/legal_dpdp_compliance.test.mjs`, `tests/banner_e2e.test.mjs`, `tests/a11y_dom.test.mjs`, `tests/stress_challenge.test.mjs`).
