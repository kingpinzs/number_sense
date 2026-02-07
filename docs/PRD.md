# Discalculas - Product Requirements Document

**Author:** Jeremy  
**Date:** 2025-11-08  
**Version:** 1.0

---

## Executive Summary

Discalculas (Number Sense Suite) needs to evolve from a rough personal prototype into a phone-friendly daily companion for people living with dyscalculia. The immediate initiative is a combined code review and UX revamp of the existing single-page app so it feels trustworthy, responsive, and joyful enough for the primary user (you) to rely on every day. If it works flawlessly for you, it can later expand to the broader dyscalculia community.

### What Makes This Special

A calm, mobile-ready wizard that delivers precise dyscalculia drills, cognition boosters, and progress feedback in minutes—lightweight enough for a daily habit yet smart enough to adapt to anxiety levels and cognitive load.

---

## Project Classification

**Technical Type:** Web App (mobile-first SPA)  
**Domain:** EdTech – dyscalculia self-therapy  
**Complexity:** Medium (Level 3 planning scope with multiple flows in one repo)

The project targets a browser-based SPA (`index.html` + `scripts/main.js`) that must run flawlessly on phones. Although currently a personal tool, it touches regulated-adjacent territory (education + mental health) and therefore borrows best practices from evidence-backed dyscalculia interventions while avoiding formal compliance scope for now. The workflow follows the BMad Method (brownfield) because existing functionality, state management, and docs must be respected during the refresh.

### Domain Context

- Dyscalculia affects 5–10% of people and intertwines with anxiety, ADHD, and dyslexia.  
- Evidence favors targeted, short, manipulative-backed sessions (Understood, Healthline).  
- Adult learners need compensation tools (budget templates, calculators) and scaffolding for emotional load (Cleveland Clinic, PMC).  
- Calcularis 2.0 demonstrates that 20-minute adaptive sessions drive durable gains—our UX should make those sprints effortless.

Sources: `docs/research-domain-2025-11-08.md`

---

## Success Criteria

- Daily math + spatial drills feel easier within two weeks, measured by self-reported confidence ratings that rise at least 2 points on a 10-point scale after each session block.
- Mobile-first UX consistently supports three 20-minute sessions per day with <10 seconds to launch each flow (Assessment, Coach, Cognition, Training) from a phone.
- Built-in instrumentation logs completion rate, duration per flow, and time-in-step so personal analytics can flag when focus drops or exercises take too long.
- Usage telemetry (stored locally) captures streaks, per-module dwell time, and perceived difficulty prompts so you can tell which interventions help or hinder.
- Codebase reaches 100% automated test coverage (unit, functional, integration, and end-to-end) for `index.html` + `scripts/main.js`, ensuring regressions are caught before UX experiments.

---

## Product Scope

### MVP - Minimum Viable Product

- Perform a full code review of `scripts/main.js` + `index.html`, documenting issues (logic, structure, perf, accessibility) and resolving critical bugs.
- Restructure the SPA so every flow (Assessment, Coach, Training, Cognition, Progress) renders flawlessly on small screens: responsive layout, large tap targets, consistent typography, and zero horizontal scroll.
- Instrument the UI to capture session start/end, per-step durations, device type, and self-reported “helpfulness” so you can tell if drills improve math and spatial comfort.
- Add lightweight daily-check prompts that track confidence deltas and surface trends inside the Progress tab.
- Establish a full automated test suite (unit, functional, integration, end-to-end) with 100% coverage to lock in behavior before/after the revamp.

### Growth Features (Post-MVP)

- Guided spatial-visual modules (e.g., 3D mental rotation, map reading) that plug into the same logging pipeline.
- Configurable reminders, streak coaching, and mood tagging to correlate emotional state with performance.
- Optional data export + import profiles to share with clinicians or friends once the personal workflow feels solid.
- Lightweight “coach notes” view that summarizes code-review deltas and UX tweaks for future contributors.

### Vision (Future)

- Expand beyond single-user storage to privacy-respecting multi-profile support while keeping local-first guarantees.
- Layer in adaptive AI coaching that tweaks drills in real time based on captured usage metrics.
- Offer curated therapy bundles (e.g., Calcularis-inspired arcs, math-anxiety calming routines) that the community can remix once compliance concerns are addressed.

---

## Domain-Specific Requirements

- Reinforce dyscalculia best practices: short, manipulative-inspired drills, explicit number-line work, and anxiety-aware pacing.
- Include adult compensation helpers (calculators, budget templates, scheduling cues) inline so using them feels normal, not like “cheating.”
- Track self-reported math and spatial discomfort before/after each session to prove efficacy and flag regressions quickly.
- Respect privacy by keeping telemetry in-browser; no compliance scope (HIPAA/FERPA) yet, but architecture should leave room for future hardening.
- Treat the app as a personal digital therapeutic: if research findings aren’t validated in practice, repeat the research loop (new studies, user journaling, benchmarking) before broadening scope.
- Enable offline-first behavior with background sync when connectivity returns so mobile users can trust it as a daily tool anywhere.

---

## Innovation & Novel Patterns

- **Adaptive “Magic Minute” sprints:** After each drill block, generate a 60-second micro-challenge that blends math + spatial cues (e.g., rotating dot arrays) based on the toughest mistakes logged that day, creating an immediate feeling of progress.
- **Confidence x Time radar view:** Visualize every session as a spoke showing duration, self-reported confidence delta, and cognitive load so you can spot which routines truly help—even without sharing data externally.
- **On-device research loop:** Bake a “Research Mode” toggle that runs lightweight experiments (A/B question orders, alternate manipulatives) while logging anonymized metrics locally; when results feel inconclusive, it guides you through re-running full research before adopting changes.
- **Ambient sync indicators:** Subtle pulsing border or haptic ping whenever offline data flushes successfully, reinforcing trust that the PWA “just works” no matter the connection.

---

## Web App Specific Requirements

_Will be added after functional discovery._

---

## User Experience Principles

- Phone-first: every major action reachable within one thumb, no modal overflow, text legible at 320 px width.
- Calm focus: minimal color changes, warm feedback when drills succeed, gentle guardrails when frustration builds.
- Momentum everywhere: one-tap relaunch of your last flow, auto-advancing timers, and streak visualizations that celebrate daily use.
- Transparency: progress dashboards explain how metrics map to math/spatial confidence so you can judge whether the revamp is working.
- Installable: feels like a native PWA with instant launch, offline cache, and subtle sync indicators so it “just works” after adding to the home screen.

---

## Opportunities & Challenges

### Opportunities
- Refactor the monolithic `scripts/main.js` into well-named modules (storage, flows, visuals) so code reviews and 100 % testing become realistic.
- Redesign the UI shell (tabs, wizards, drills) with mobile-first layouts, tactile controls, and celebratory microcopy to turn daily usage into a habit.
- Instrument everything (sessions, dwell time, perceived difficulty) so you can compare actual usage against research-backed expectations and decide when to rerun studies.
- Ship a true offline-first PWA layer (service worker + manifest) so assessments, drills, and progress logging run flawlessly without connectivity and sync quietly later.

### Challenges / Risks
- Untangling 1.6k+ lines of JS in one file risks regressions until tests are in place.
- UX redesign depends on revalidating the research insights; if current data is inconclusive, you must repeat domain research before finalizing layouts or flows.
- Maintaining offline caches, background sync, and telemetry while keeping everything client-only requires careful storage design and may stretch browser limits.
- Achieving 100 % coverage across unit, functional, integration, and E2E tests will demand significant harness work for DOM-heavy flows.

---

## Functional Requirements

### 1. Modular Codebase
- Split `scripts/main.js` into composable modules (navigation, storage, assessment, coach, training, cognition, telemetry, UI helpers) without introducing heavy bundlers.
- Establish lint/format rules plus shared utilities so testing and reviews have predictable imports.

### 2. Responsive UX Revamp
- Rebuild the tab shell, wizard overlay, and inline drills for 320 px screens with fluid CSS grids, thumb-friendly controls, and keypad-less numeric entry.
- Guarantee every flow (Assessment, Coach, Cognition, Training, Progress) launches within 10 seconds on a mid-tier phone and includes inline confidence prompts.
- Introduce celebratory microcopy + animations that reinforce daily wins without overwhelming the user.

### 3. Instrumentation & Telemetry
- Capture session start/end, step durations, dwell time, accuracy, streaks, and self-reported confidence/anxiety deltas; persist locally and render inside the Progress dashboard + radar visualization.
- Provide CSV/JSON exports for journaling and snapshots before/after experiments; include anonymization toggles for future sharing.

### 4. Offline-First PWA Layer
- Ship a web manifest, install prompt, and service worker that caches HTML/JS/CSS/assets plus telemetry queues so the experience remains identical offline.
- Implement background sync (or manual “Sync now”) with ambient indicators showing pending uploads, successful flushes, or conflicts.

### 5. Research Mode
- Offer a toggle that runs mini-experiments (e.g., alternate drill variants) while logging structured observations; compare results to prior research automatically.
- If confidence gains regress, the app recommends repeating the fuller research workflow before accepting UX/code changes.

### 6. Testing Harness
- Build automated unit tests for helpers, functional tests per module, integration tests spanning flows, and E2E scripts (Playwright/Cypress) covering the Development Guide checklist.
- Enforce 100 % coverage (statements/branches/functions/lines) locally and in CI, blocking merges when the threshold slips.

---

## Non-Functional Requirements

### Performance
- Initial load <2 s on mid-tier phones; interactions maintain 60 fps and <100 ms input latency; service worker payloads stay under 500 KB.

### Reliability
- Telemetry queues survive browser restarts, background sync retries with exponential backoff, and no data is lost when offline sessions span multiple days.

### Accessibility
- WCAG 2.1 AA: proper focus order, 4.5:1 contrast, aria labels for wizard controls, keyboard alternatives, and optional haptic/audio cues for drills.

### Security & Privacy
- Data remains local unless the user explicitly exports; telemetry storage is encrypted/obfuscated; UI explains what metrics are tracked and why.

### Testability
- CI/headless harness runs full unit/functional/integration/E2E suites; visual snapshots catch layout regressions; coverage gates enforce 100 %.

### Maintainability
- Component inventory + docs stay current; modular architecture prevents reintroducing monolithic files; complex flows include succinct comments for future contributors.

---

## Implementation Planning

### Epic Breakdown Required

Requirements must be decomposed into epics and bite-sized stories (200k context limit).

**Next Step:** Run `workflow epics-stories` to create the implementation breakdown.

### Epic Seeds
1. **Core Refactor & Testing:** Module split, linting, 100 % coverage harness, CI wiring.
2. **Mobile UX & Research Mode:** Responsive redesign, confidence prompts, Magic Minute sprints, radar view, research toggle.
3. **Telemetry & PWA Infrastructure:** Instrumentation, offline caches, background sync, ambient indicators, export upgrades.

---

## References

- Product Brief: docs/index.md
- Domain Brief: docs/research-domain-2025-11-08.md

---

## Next Steps

1. **Epic & Story Breakdown** - Run: `workflow epics-stories`
2. **UX Design** (if UI) - Run: `workflow ux-design`
3. **Architecture** - Run: `workflow create-architecture`

---

_Product Magic Summary:_ A calm, mobile-ready companion that turns dyscalculia drills into joyful daily victories, proves progress with telemetry, and keeps working even when the world goes offline.

_Created through collaborative discovery between Jeremy and AI facilitator._
