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

## Follow-up — 2026-09-05T10:17:31Z

# Phase 3 — Recommendation System Architecture, Feature Stores & Behavioral Signal Modeling

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full multi-agent teamwork system

Design the complete Phase 3 Recommendation System Architecture, Feature Store Schemas, Behavioral Signal Weights, Multi-Horizon Interest Models, and Multi-Tier Storage Strategy (PostgreSQL, DynamoDB, Redis, S3) for Focusgram (Code Plus Academy), based on a deep read-only audit of the existing codebase and verified Phase 2 telemetry pipeline.

Working directory: `e:/code_plus_academy`
Output file: `docs/recommendations/phase3_feature_store_architecture.md`
Integrity mode: development

---

## Requirements

### R1. Phase 2 Telemetry Audit & Recommendation Signal Mapping
Perform a comprehensive, read-only audit of every Phase 2 telemetry event in the codebase. Document:
- Event name, generation trigger, validation layer, and storage path.
- Available event metadata.
- Behavioral classification (positive, negative, neutral, or contextual).
- Recommendation signal produced and signal strength.
- Affected dimensions (user interests, content features, creator affinity, user-content affinity).
- Processing requirement (immediate, aggregated, or over-time).
- Normalization, deduplication, and time-decay requirements.
- Known limitations, missing signals, redundant events, and privacy-sensitive data to exclude.
Produce a complete event-to-signal mapping table.

### R2. User Recommendation Feature Schema
Design the complete User Recommendation Feature Schema based on actual PostgreSQL schemas (`users`, `user_interests`, `follows`, `claps`, `comments`, `saved_posts`), Phase 2 telemetry, and Redis session states. Features must cover:
- Explicit profile attributes and onboarding interests.
- Technology/language affinity, topic affinity, content-type preference, and difficulty preference.
- Creator affinity, positive behavioral affinity, and negative preferences.
- Short-term vs long-term interests, recent activity, engagement tendencies, and consumption preferences.
- Exploration tendency, session-level intent, freshness signals, and confidence scores.
Classify features into raw attributes, aggregated metrics, derived affinities, and temporary/session states with explicit datatype, source, update trigger/frequency, decay/normalization rules, and target storage.

### R3. Content Recommendation Feature Schema
Design the complete Content Recommendation Feature Schema based on actual `posts`, `post_media`, tags, difficulty, language, post_type, engagement counters, and Elasticsearch index mappings. Features must cover:
- Content identity, creator, format, topic, tags, language/technology, and difficulty.
- Freshness, age, popularity, and engagement.
- CTR, dwell metrics, video consumption/completion rates, skip rates, save/clap/comment/share rates, code-copy rates, and download rates.
- Negative feedback (skips, not-interested, reports), quality/trust, and moderation status.
- Semantic representation requirements for future candidate retrieval.
Specify datatypes, sources, calculation formulas, update frequencies, normalization, decay, and target storage for each feature.

### R4. User–Content & Creator Affinity Feature Model
Formalize relationship models for User ↔ Content and User ↔ Creator.
- Detail contributions of impressions, dwell, clicks, video milestones, rewatches, saves, claps, comments, shares, code copying, downloads, follows, profile views, skips, and negative feedback.
- Define affinity score formulas, signal weights, aggregation methods, time decay, recency windows, negative affinity handling, confidence scores, and frequency capping.
- Specify which relationships are persisted, cached in Redis, or calculated on demand.

### R5. Behavioral Signal Framework with Configurable Weights
Create a formal behavioral signal taxonomy classifying actions into positive, negative, and neutral/contextual.
- Define initial weights, minimum thresholds, maximum contributions, accumulation/capping rules, decay behavior, and affected entities for every signal.
- Explicitly address impressions vs actual consumption, short vs meaningful dwell, natural video watch vs seeking jumps, and code snippet copy signals.
- Establish signal conflict resolution and precedence rules in an explicitly configurable format.

### R6. Multi-Horizon Interest Models (Short-Term, Medium-Term, Long-Term)
Design deterministic short-term, medium-term, and long-term user interest models across topics, technologies, programming languages, content types, difficulty, and creators.
- Define data sources, aggregation windows, weighting, decay, update frequencies, confidence scores, and reset/expiration behavior.
- Define conflict resolution and blending strategies between long-term identity and real-time session exploration (e.g. historical Python developer currently exploring AWS).

### R7. Time-Decay Policy & Computational Strategies
Design the time-decay framework across all temporal features.
- Define mathematical decay functions (exponential, half-life parameters), floors, caps, update timing, and expiration policies.
- Contrast lazy evaluation (on-read) versus scheduled background batch processing to prevent write amplification.
- Provide concrete numeric examples demonstrating feature decay over time (e.g., 1 hour, 1 day, 7 days, 30 days).

### R8. DynamoDB Feature Store Table & Key Design
Design the DynamoDB schema for the recommendation feature store.
- Specify table name, partition key (`PK`), sort key (`SK`), attribute schemas, and secondary indexes (GSI) only where strictly necessary.
- Provide the complete access-pattern table, item size estimates, TTL strategies, hot-partition mitigation, consistency requirements, and idempotency handling.
- Explicitly delineate what belongs in DynamoDB versus Redis or PostgreSQL.

### R9. Redis Data Structures for High-Speed State
Design high-speed recommendation caching and session state in Redis.
- Define key patterns, data types (Hashes, Sorted Sets, Sets, Bitmaps/HyperLogLogs), TTLs, memory boundaries, read/write commands, and eviction policies.
- Cover hot user feature caches, recent seen post IDs (exclusion filters), recent impressions, creator affinity caches, negative signal caches, and trending signals.
- Detail cache invalidation, rebuild-on-miss strategies, and resilience against multi-instance backend restarts.

### R10. PostgreSQL vs DynamoDB vs Redis vs S3 Storage Responsibility Architecture
Perform an exhaustive storage responsibility analysis across all 18 specified recommendation data categories.
- Produce the final Storage Responsibility Matrix: Data Category | System of Record | Processing Store | Serving Cache | Historical Store | Architectural Justification.
- Define end-to-end read/write flows, recovery procedures, and non-negotiable architectural rules for Phase 3 implementation.

---

## Acceptance Criteria

### Technical Completeness & Rigor
- [ ] Output is written to `docs/recommendations/phase3_feature_store_architecture.md` as a unified, production-grade master specification.
- [ ] Every whitelisted event from Phase 2 (`post_impression`, `video_25..100`, `code_snippet_copied`, etc.) is mapped in the signal matrix.
- [ ] Complete User and Content feature catalogs provide datatypes, update frequencies, decay rules, and storage destinations for all features.
- [ ] Affinity and decay formulas are mathematically explicit, deterministic, and fully configurable.
- [ ] DynamoDB access-pattern table lists every query pattern, PK/SK layout, projected latency, and item size.
- [ ] Redis structures have explicit key templates, data types, TTLs, and memory-capping rules.
- [ ] Storage Responsibility Matrix classifies all 18 entities across PostgreSQL, DynamoDB, Redis, and S3.

### Architectural Invariance & Safety
- [ ] Zero modifications to production source code during this architecture phase.
- [ ] Zero provisioning of live cloud infrastructure or database migrations during this step.
- [ ] Strict compliance with project data privacy rules: zero PII or raw code contents in feature definitions.
- [ ] All database schemas and entities reflect the actual verified `socialDb` codebase.
