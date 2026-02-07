# Component Inventory

| Component | Location | Description | Key Data/Interfaces |
|-----------|----------|-------------|---------------------|
| Tab Navigation | `scripts/main.js` (lines 1-23) | Builds desktop tab buttons and a mobile `<select>`, routes to `activate(id)` which toggles `<section>` visibility and triggers Progress refresh. | `activate(id)` (overridden later to hook chart rendering). |
| Storage Service | `scripts/main.js` (lines 24-33) | Thin wrapper around `localStorage` (`ns-suite-v2`). Provides safe parsing defaults and JSON serialization. | `dbGet()`, `dbSet(data)` |
| Wizard Overlay (`WIZ`) | `scripts/main.js` (lines 29-43) | Full-screen modal used by Assessment, Coach, and Cognition. Maintains title/body/hint regions, close/back buttons, and houses the global numeric keypad. | `WIZ.open(title)`, `WIZ.close()` |
| Numeric Keypad Helper | `setupCompactAndNumpad` (lines ~1330) | Ensures wizard screens stay phone-friendly: toggles `.compact`, focuses numeric inputs, injects a shared keypad, and wires Enter to `#go`. | Depends on DOM inside current wizard panel. |
| Subitize Trainer | `scripts/main.js` (around line 104) | Inline Train tab module generating dot arrays with adjustable max dots and flash durations. Logs results to `train.subitize`. | `startSubitizeTrial`, DOM IDs `s-grid`, `s-start`, `s-submit`. |
| Number Line Trainer | (line ~171) | Renders an interactive number line with draggable pointer, tolerance hints, and mastery badges. Writes attempts (range, ticks, error) to `train.numline`. | DOM IDs `nl-area`, `nl-pointer`, `nl-check`. |
| Facts Trainer | (line ~394 & 506) | Timed fact fluency drill with adaptive difficulty bands and operation mix. Logs attempts with latency, accuracy, and streak metadata to `train.facts`. | `startFacts()`, `evaluate()`, DOM IDs `ff-*`. |
| Assessment Wizard | (line ~614) | Multi-domain baseline/retest assessment capturing accuracy + latency across quantity, symbol mapping, place value, facts, procedural, and estimation tasks. Writes `assessment[mode]` and regenerates `plan`. | `startAssessment()`, `makePlan()`, `renderAssessmentReport()`. |
| Coach Session | (line ~892) | Executes block-based adaptive practice using plan weights (optionally tweaked by cognition results). Each block reuses mini modules and logs summary stats to `train` collections. | `startCoach()`, `pickWeighted()`, `adjustWeightsWithCognition()`. |
| Cognition Battery | (line ~1107) | Runs digit span, Corsi, simple/choice RT, CPT, Go/No-Go, and PAL tasks inside the wizard. Captures metrics and schedules delayed PAL follow-ups through `pal_pending`. | `startCognition()`, `renderCognitionReport()`, PAL reminder on `window.load`. |
| Progress Dashboard | (line ~1442 & 1484) | JSON/CSV export buttons, live data peek, reset, and Chart.js visualization combining training accuracy and assessment domain snapshots. | `refreshPeek()`, `renderProgressChart()`, helper aggregators (`computeDaily*`). |
| Data Export/Reset | Same block | Builds CSV rows by type, exposes JSON download of the entire store, and clears storage on confirmation. | Buttons `export-csv`, `export-json`, `reset-all`. |

Line numbers reference the current `scripts/main.js` to speed up navigation; update them if the file is reorganized.

