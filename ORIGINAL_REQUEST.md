# Original User Request

## Initial Request — 2026-08-29T16:53:12Z

Lead the full multi-agent team to execute a production-grade implementation of Google Analytics 4 (GA4) with minute-to-minute interaction tracking, responsive breakpoint analytics, engagement heartbeat, and zero-loss event instrumentation across CPA (Code Plus Academy).

Key Requirements:
1. Unified Enterprise Analytics Client & Consent Architecture (Fix race conditions in Consent Mode v2, eliminate duplicate event firing between window.dataLayer and gtag, strict COPPA / minor privacy safeguards, typed contract-driven dispatch pipeline).
2. Minute-to-Minute Engagement, Session Heartbeat & Micro-Interactions (Active vs idle session heartbeat timer, UX friction indicators [rage clicks, dead clicks, form abandonment, error triggers], active tab visibility [Page Visibility API], scroll depth telemetry [25%, 50%, 75%, 90%, 100%]).
3. Responsive Breakpoint & Device Telemetry (Dynamic viewport transitions [mobile, tablet, desktop, ultrawide], orientation switches, correlate with funnels).
4. Comprehensive Domain-Specific Event Instrumentation (Notes Arena, Creator Studio & Video/HLS Player, Articles & Discovery, Auth & Security).
5. Core Web Vitals & Error Observability (LCP, INP, CLS, FCP, TTFB custom metrics, sanitized error codes).

Acceptance Criteria:
- No dual event emissions on single user actions.
- Google Consent Mode v2 initializes before any tag execution with default denied states and respects local storage preferences.
- Zero PII in dataLayer or network payloads; minor safeguards active.
- Viewport transitions tracked with debouncing across resize events.
- Minute-to-minute engagement stops counting during backgrounded tabs or idle states (>60s inactivity).
- Scroll tracking fires each depth milestone exactly once per page view.
- Video playback milestones (25%, 50%, 75%, 100%) fire monotonically without duplicate triggers on seek.
- Analytics dispatch fails silently without blocking UI thread (`try/catch` insulated).
- Build passes clean with zero Next.js hydration mismatches and strict type validation.
