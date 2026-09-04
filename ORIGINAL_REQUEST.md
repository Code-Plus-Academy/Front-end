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

## Follow-up — 2026-09-04T10:04:12Z

Implement production-grade audit remediation for the Story Editor subsystem (Fabric.js v7, Next.js 16, React 19), resolving the interaction layer blackout where images cannot be moved or dragged, isolating the canvas DOM host, and completing multi-phase reliability fixes.

Working directory: e:\code_plus_academy\Front-end
Integrity mode: development

## Verification Resources
- Empirical Challenger Stress Test Suite: tests/story_editor_empirical.test.mjs
- Core Story Editor Source Files:
  - src/components/story-editor/StoryEditor.jsx
  - src/components/story-editor/StoryEditorCanvas.jsx
  - src/components/story-editor/hooks/useFabricCanvas.js
  - src/components/story-editor/hooks/useCanvasHistory.js
  - src/components/story-editor/utils/canvasConfig.js
  - src/components/story-editor/utils/imageLayerUtils.js
  - src/components/story-editor/utils/typographyUtils.js
  - src/components/story-editor/utils/stickerUtils.js
  - src/components/story-editor/utils/drawingUtils.js
  - src/components/story-editor/utils/exportUtils.js
  - src/components/story-editor/utils/sanitizeUtils.js

## Requirements

### R1. Core Canvas Interactivity & DOM Host Isolation (Phase 0)
Eliminate the initialization issue where upperCanvasEl inherits display: none from the initial lower canvas render, ensuring Fabric's interaction layer is visible and receiving all pointer, mouse, and touch events. Isolate Fabric's generated canvas hierarchy inside a dedicated host element (<div className="canvas-stage-host">) to prevent React 19 virtual DOM reconciler collisions with dynamic sibling HUD elements.

### R2. Object Lock Preservation & Coordinate Synchronization (Phase 0)
Ensure default control styling preserves caller-specified object configurations (lockMovementX/Y: true, selectable: false), guaranteeing background cover images remain permanently locked and unmovable. Synchronize initial image coordinates (fabricCanvas.add -> img.setCoords() -> setActiveObject) so transform handles and bounding hitboxes are active immediately upon placement.

### R3. Viewport Stability, Drawing Engine & Metadata Precision (Phase 1)
Remove geometric CSS transitions (transition-all duration-300) from the 9:16 viewport container to ensure Fabric's cached document offsets (calcOffset()) are calculated against stable geometry. Correct interactive metadata extraction in stickerUtils.js to convert center-origin coordinates into true top-left (x, y) bounding boxes matching Story viewer tap zones. Scope vector drawing and eraser state to canvas instances to eliminate memory leaks and cross-instance collisions. Refactor text pill background rendering and await web font loading via document.fonts.load() before updating text metrics.

### R4. Export Normalization, History Integrity & Boundary Clamping (Phase 2 & 3)
Normalize export image resolution against device pixel ratio (devicePixelRatio) to guarantee exact 1080x1920 PNG export output without high-DPI distortion or compositional clipping. Ensure canvas history snapshots handle local image assets safely without creating broken states upon blob URL revocation. Clamp duplicated objects within canvas boundary limits.

## Acceptance Criteria

### Interactivity & Controls (Phase 0)
- [ ] Added images can be immediately selected, dragged, rotated, resized, and deleted across the canvas.
- [ ] Background cover images remain locked and cannot be dragged or accidentally selected.
- [ ] Multiple objects (images, textboxes, stickers) can be selected and moved independently.
- [ ] Switching tool modes (Select -> Draw -> Text -> Select) preserves pointer interactivity for all existing canvas objects.
- [ ] Re-rendering the React parent component does not duplicate canvas elements or detach event listeners.

### Precision & Enhancements (Phase 1)
- [ ] Canvas resize and window resize operations maintain accurate hit testing without coordinate drift.
- [ ] Interactive location and link metadata JSON records top-left (x, y) coordinates matching visual sticker bounds.
- [ ] Freehand vector drawing and eraser can be activated and deactivated across multiple modal sessions without leaking listeners or state.
- [ ] Web fonts update text object bounding boxes cleanly after loading.

### Export & Reliability (Phase 2 & 3)
- [ ] Story export produces exact 1080x1920 PNG files on 1x, 2x, and 3x display pixel ratios.
- [ ] Undo and Redo operations cleanly restore image states without broken image placeholders.
- [ ] Duplicating an object keeps the clone within visible canvas bounds.
- [ ] All automated tests in tests/story_editor_empirical.test.mjs pass cleanly.
