# Project Overview

## Purpose and Context

Discalculas (Number Sense Suite) is a browser-only toolkit for dyscalculia intervention. Families, educators, or clinicians can run baseline assessments, auto-generated training plans, cognition batteries, and on-demand drills from a single tabbed interface. Everything persists in the browser via `localStorage`, so no login or backend is required.

## Feature Summary

- **Assessment Wizard:** Baseline/retest flow spanning six domains (quantity, symbol mapping, place value, facts, procedural fluency, estimation) with adaptive difficulty, latencies, and automatic plan creation.
- **Adaptive Coach:** Executes block-based practice plans derived from assessment scores, optionally reweighted with cognition metrics (working memory, reaction time, attention).
- **Inline Training:** Quick subitize, number line, and fact-fluency drills embedded directly in the Train tab for rapid practice between wizard runs.
- **Cognition Battery:** Digit span, Corsi blocks, simple/choice reaction time, continuous performance, Go/No-Go, and paired-associate learning (PAL) with delayed recall reminders.
- **Progress Dashboard:** Chart.js overlays training accuracy, facts throughput, number line precision, and per-domain assessment snapshots, plus JSON/CSV export and data reset.

## Technology Stack

| Layer                | Technology / Notes                                               |
|----------------------|------------------------------------------------------------------|
| UI                   | Vanilla HTML (`index.html`) with responsive CSS (`styles/styles.css`) |
| Client Logic         | `scripts/main.js` (≈1.6k lines) using plain ES modules (no bundler) |
| Visualization        | Chart.js 4.4.3 + date-fns adapter via CDN                         |
| Persistence          | Browser `localStorage` (`ns-suite-v2` payload)                    |
| Packaging/Build      | None; static assets only                                          |

## Architecture Classification

- **Repository Structure:** Single-part static web app.
- **Execution Model:** Client-side SPA with DOM-driven wizard overlays and inline trainers.
- **State:** Centralized JSON blob in `localStorage` containing `train`, `assessment`, `plan`, `cog_runs`, and pending PAL reminders.
- **External Services:** None at runtime; CDN scripts are the only dependencies.

## Repository Structure Highlights

- `index.html` – Tab shell, section markup, and script/style includes.
- `scripts/main.js` – All navigation, state management, wizard flows, exports, and visualization logic.
- `styles/styles.css` – Theme variables, responsive layout, wizard styling, and mini games (dot grids, number line, keypads).
- `docs/` – Generated reference docs (this file, architecture notes, etc.).
- `bmad/` – BMAD methodology assets (workflows, templates, config) that coordinated this documentation pass.

## Key Files to Know

| File/Folder          | Why it matters                                                                 |
|----------------------|--------------------------------------------------------------------------------|
| `scripts/main.js`    | Defines every interactive behavior. When extending functionality, locate or add modules here. |
| `styles/styles.css`  | Drives the unified mid-tone theme and mini-game layouts; required for consistent UX. |
| `index.html`         | Sets up sections, tab containers, wizard overlay, and CDN script tags.          |
| `docs/architecture.md` | Deep dive on module interactions, state transitions, and extension points.    |

## Constraints and Risks

- **Single Source File:** All JS lives in `scripts/main.js`, so concurrent edits require coordination to avoid merge conflicts.
- **localStorage Size:** Data is constrained by browser quotas; long-term logging may require export/cleanup to stay within limits.
- **Accessibility:** Heavy reliance on custom wizard overlays and canvas elements means additional accessibility testing is needed before production use.
- **Testing:** There are no automated tests; regressions must be caught manually via guided flows in the Development Guide.

## Next Steps for AI Agents

1. Review `architecture.md` before large refactors—especially when touching assessment or cognition logic.
2. Use `component-inventory.md` to pinpoint where to hook new interactions.
3. Follow `development-guide.md` for manual verification scripts until automated coverage exists.
4. If adding persistence beyond `localStorage`, document schema changes in a future `data-models.md`.

