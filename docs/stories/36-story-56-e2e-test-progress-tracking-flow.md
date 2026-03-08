# Story 5.6: E2E Test - Progress Tracking Flow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **comprehensive E2E tests covering the progress tracking features**,
so that **I can verify progress visualization and data export work correctly across browsers**.

## Acceptance Criteria

### AC-1: Test File & Structure
**Given** all progress tracking stories are complete (Stories 5.1-5.5 done)
**When** I run the E2E test suite
**Then** a Playwright test exists at `tests/e2e/progress-flow.spec.ts` containing 5 test scenarios

### AC-2: Test Scenario 1 — Confidence Radar Display
1. Seed database with 5 completed training sessions (varying confidence scores per domain)
2. Navigate to `/progress`
3. Verify Confidence Radar chart renders (SVG present)
4. Verify 3 domain labels visible (Number Sense, Spatial Awareness, Math Operations)
5. Verify filled area corresponds to expected confidence values
6. Verify legend shows "Current" and "Starting Point"

### AC-3: Test Scenario 2 — Session History
1. Navigate to `/progress`
2. Scroll down to Session History section
3. Verify 5 session cards displayed (matching seeded data)
4. Verify most recent session appears first
5. Click first session card to expand
6. Verify drill-by-drill breakdown appears
7. Verify drill count, accuracy, and confidence change match expected values

### AC-4: Test Scenario 3 — Streak Counter and Milestones
1. Set streak to 6 in localStorage
2. Set last session date to yesterday
3. Navigate to `/` (home)
4. Verify streak counter shows "6"
5. Complete a training session (session 7)
6. Verify streak increments to 7
7. Verify milestone modal appears: "One Week Streak!"
8. Dismiss modal
9. Verify streak counter shows "7"

### AC-5: Test Scenario 4 — Insights Generation
1. Seed database with 10 sessions showing upward accuracy trend
2. Navigate to `/progress`
3. Scroll to Insights section
4. Verify at least 2 insights displayed
5. Verify insight mentions improvement (e.g., "accuracy improved")
6. Verify insight includes actionable suggestion

### AC-6: Test Scenario 5 — Data Export
1. Navigate to `/progress`
2. Scroll to Data Export section
3. Click "Export as CSV"
4. Verify download triggered (`page.waitForEvent('download')`)
5. Read downloaded file contents
6. Verify CSV contains session data headers
7. Verify CSV format is valid (headers + rows)

### AC-7: IndexedDB Verification
- Test includes IndexedDB verification at least once:
  - Query `sessions` table, verify data matches display
  - Query `drill_results` table, verify drill breakdown accuracy

### AC-8: Mobile Viewport
- All tests run in mobile viewport (375×667)

### AC-9: Screenshots
- Test takes screenshots at: Confidence Radar, Session History, Streak Milestone, Insights
- Screenshots stored in `test-results/progress-flow/`

### AC-10: Performance
- Each test completes within its timeout (60-90 seconds)

### AC-11: Cross-Browser
- Test passes on Chromium, Firefox, WebKit

## Tasks / Subtasks

- [x] **Task 1: Create test scaffold and helper functions** (AC: #1, #8)
  - [x] 1.1 Create `tests/e2e/progress-flow.spec.ts` with imports and `test.describe` block
  - [x] 1.2 Copy/adapt helper functions from `adaptive-flow.spec.ts`: `completeAssessment(page)`, `completeAnyDrill(page, answerCorrectly)`, `queryIndexedDB(page, tableName)`
  - [x] 1.3 Create `seedProgressData(page, sessionCount, options)` helper that seeds IndexedDB via `page.evaluate()` with mock sessions + drill results
  - [x] 1.4 Create `seedLocalStorage(page, streak, lastSessionDate)` helper for streak data
  - [x] 1.5 Add `test.beforeEach` to clear IndexedDB: `indexedDB.deleteDatabase('DiscalculasDB')`
  - [x] 1.6 Set `test.setTimeout(90000)` for extended tests

- [x] **Task 2: Implement Scenario 1 — Confidence Radar Display** (AC: #2, #7, #9)
  - [x] 2.1 Write test: seed 5 sessions with known confidence values across all 3 domains
  - [x] 2.2 Navigate to `/progress`, wait for page load
  - [x] 2.3 Assert `[data-testid="confidence-radar"]` is visible (NOT `confidence-radar-empty`)
  - [x] 2.4 Assert SVG element exists within radar container
  - [x] 2.5 Assert 3 domain labels visible: "Number Sense", "Spatial Awareness", "Math Operations"
  - [x] 2.6 Assert legend text "Current" and "Starting Point" visible
  - [x] 2.7 Take screenshot: `test-results/progress-flow/01-confidence-radar.png`
  - [x] 2.8 Query IndexedDB `sessions` table, verify 5 records exist

- [x] **Task 3: Implement Scenario 2 — Session History** (AC: #3, #7, #9)
  - [x] 3.1 Write test: (reuse seeded data from setup or seed fresh)
  - [x] 3.2 Navigate to `/progress`, scroll to Session History section
  - [x] 3.3 Verify 5 session entries displayed (use text content or card count)
  - [x] 3.4 Verify most recent session appears first (check date ordering)
  - [x] 3.5 Click first session to expand accordion
  - [x] 3.6 Verify drill breakdown appears with correct counts
  - [x] 3.7 Take screenshot: `test-results/progress-flow/02-session-history.png`

- [x] **Task 4: Implement Scenario 3 — Streak Counter and Milestones** (AC: #4, #9)
  - [x] 4.1 Write test: seed localStorage with streak=6, lastSessionDate=yesterday
  - [x] 4.2 Complete assessment first (required for training access)
  - [x] 4.3 Navigate to `/` (home), verify streak shows "6"
  - [x] 4.4 Navigate to `/training`, complete a training session (6 drills)
  - [x] 4.5 After session complete, navigate home
  - [x] 4.6 Verify streak shows "7"
  - [x] 4.7 Verify milestone modal `[data-testid="milestone-modal"]` appears
  - [x] 4.8 Dismiss modal
  - [x] 4.9 Take screenshot: `test-results/progress-flow/03-streak-milestone.png`

- [x] **Task 5: Implement Scenario 4 — Insights Generation** (AC: #5, #9)
  - [x] 5.1 Write test: seed 10 sessions with upward accuracy trend (60% → 90%)
  - [x] 5.2 Navigate to `/progress`, scroll to `[data-testid="insights-panel"]`
  - [x] 5.3 Verify insights panel is visible (NOT `insights-empty`)
  - [x] 5.4 Verify at least 2 insight items rendered
  - [x] 5.5 Verify text content contains improvement keywords
  - [x] 5.6 Take screenshot: `test-results/progress-flow/04-insights-panel.png`

- [x] **Task 6: Implement Scenario 5 — Data Export** (AC: #6)
  - [x] 6.1 Write test: (reuse seeded data)
  - [x] 6.2 Navigate to `/progress`, scroll to `[data-testid="data-export"]`
  - [x] 6.3 Verify "Export as CSV" and "Export as JSON" buttons visible and enabled
  - [x] 6.4 Set up download listener: `page.waitForEvent('download')`
  - [x] 6.5 Click "Export as CSV" button
  - [x] 6.6 Capture download, read file contents
  - [x] 6.7 Verify CSV has correct headers: "Session ID,Date,Time,Module,Duration (ms)"
  - [x] 6.8 Verify CSV contains data rows matching seeded sessions
  - [x] 6.9 Verify filename matches `discalculas-export-YYYY-MM-DD.csv`

- [x] **Task 7: Run and validate across browsers** (AC: #10, #11)
  - [x] 7.1 Run on Chromium: `npx playwright test tests/e2e/progress-flow.spec.ts --project=chromium`
  - [x] 7.2 Run on Firefox: `npx playwright test tests/e2e/progress-flow.spec.ts --project=firefox`
  - [x] 7.3 Run on WebKit: `npx playwright test tests/e2e/progress-flow.spec.ts --project=webkit`
  - [x] 7.4 Fix any cross-browser issues
  - [x] 7.5 Run TypeScript check: `npx tsc --noEmit`
  - [x] 7.6 Run full test: `npx playwright test tests/e2e/progress-flow.spec.ts` (all browsers)

## Dev Notes

### CRITICAL: Do NOT Reinvent — Reuse These Existing Patterns

**1. Helper Functions — COPY from existing E2E tests (DO NOT recreate from scratch):**
```
Source: tests/e2e/adaptive-flow.spec.ts (latest, most robust versions)
Also: tests/e2e/training-flow.spec.ts (original versions)
```
- `completeAssessment(page)` — Answers all 10 assessment questions deterministically
- `completeAnyDrill(page, answerCorrectly)` — Handles spatial (keyboard '1'/'2'), number line (mouse.click at position), math (digit buttons + submit)
- `queryIndexedDB(page, tableName)` — Opens raw IndexedDB connection, reads all records from store

**DO NOT** import these (Playwright doesn't support cross-file imports easily). Copy the functions into the new test file.

**2. IndexedDB Seeding Pattern — Use raw IndexedDB API (NOT Dexie import):**

The app initializes DiscalculasDB via Dexie on first load. To seed data:
1. Navigate to `/` first (triggers Dexie schema creation)
2. Use `page.evaluate()` with raw IndexedDB to add records

```typescript
async function seedSessions(page: Page, sessions: any[]): Promise<void> {
  await page.evaluate(async (data) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('DiscalculasDB');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['sessions'], 'readwrite');
        const store = tx.objectStore('sessions');
        for (const session of data) {
          store.add(session);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }, sessions);
}
```

Repeat same pattern for `drill_results` table.

**3. Database Name — MUST be 'DiscalculasDB':**
```
Source: src/services/storage/db.ts
```
This is the Dexie database name. Use exactly this string in `indexedDB.open()` calls.

**4. localStorage Keys — Use NAMESPACED keys:**
```
Source: src/services/storage/localStorage.ts
```
- Streak: `'discalculas:streak'` (number as string)
- Last session date: `'discalculas:lastSessionDate'` (ISO 8601 string)
- Milestones shown: `'discalculas:streakMilestonesShown'` (JSON array of numbers)
- User settings: `'discalculas:userSettings'` (JSON object)

**5. Available data-testid Selectors on Progress Components:**
| Component | data-testid | Notes |
|-----------|------------|-------|
| ConfidenceRadar | `confidence-radar` | SVG chart container |
| ConfidenceRadarEmpty | `confidence-radar-empty` | Shows when <3 sessions |
| InsightsPanel | `insights-panel` | Card wrapper |
| InsightsPanel empty | `insights-empty` | Shows when no insights |
| DataExport | `data-export` | Card wrapper |
| DataExport empty | `export-empty` | Shows when no data |
| MilestoneModal | `milestone-modal` | Dialog content |
| SessionHistory | **NONE** | Use text selectors or heading |

**6. ProgressRoute Component Order (top to bottom):**
```
<h1>"Your Progress"</h1>
<Card> Confidence Radar (or ConfidenceRadarEmpty) </Card>
<InsightsPanel />
<SessionHistory />
<DataExport />
```

**7. Download Testing Pattern:**
```typescript
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export as CSV' }).click();
const download = await downloadPromise;
const path = await download.path();
const content = fs.readFileSync(path!, 'utf-8');
```
Import `fs` from `'node:fs'` at top of test file.

**8. Playwright Config (already configured):**
```
File: playwright.config.ts
```
- Viewport: 375×667 (iPhone SE) — already set globally
- Base URL: http://localhost:5173
- Browsers: Chromium, Firefox, WebKit — already configured as projects
- Dev server: Auto-starts `npm run dev`
- Timeout: 30 seconds default (override per test with `test.setTimeout()`)
- Screenshots: On failure (manual screenshots via `page.screenshot()`)

**9. Session Schema for Seeding — EXACT fields from schemas.ts:**
```typescript
interface Session {
  id?: number;           // Auto-incremented by IndexedDB
  timestamp: string;     // ISO 8601 (e.g., '2026-02-07T10:00:00Z')
  module: string;        // 'training' for training sessions
  duration: number;      // Milliseconds (e.g., 600000 = 10 min)
  completionStatus: string; // 'completed'
  drillCount?: number;   // Number of drills (e.g., 10)
  accuracy?: number;     // 0-100 percentage
  confidenceBefore?: number; // 1-5 scale
  confidenceAfter?: number;  // 1-5 scale
  confidenceChange?: number; // after - before
  drillQueue?: string[]; // e.g., ['number_line', 'spatial_rotation', 'math_operations']
}

interface DrillResult {
  id?: number;
  sessionId: number;     // FK to sessions.id
  timestamp: string;     // ISO 8601
  module: string;        // 'number_line' | 'spatial_rotation' | 'math_operations'
  difficulty: string;    // 'easy' | 'medium' | 'hard'
  isCorrect: boolean;
  timeToAnswer: number;  // Milliseconds
  accuracy: number;      // 0-100
}
```

**10. Streak Milestone Thresholds:**
```
Source: src/services/training/streakManager.ts
```
Look up `checkMilestone(streak)` to find exact thresholds (7 = "One Week Streak!"). Streak 7 should trigger the milestone modal if it hasn't been shown before.

**11. Confidence Data Hook Requirements:**
```
Source: src/features/progress/hooks/useConfidenceData.ts
```
- `MIN_SESSIONS_REQUIRED = 3` — Radar shows empty state below this
- `MAX_SESSIONS_TO_QUERY = 10` — Last 10 sessions used for calculation
- Filters by `module === 'training'` and `completionStatus === 'completed'`
- Requires `drillQueue` or actual drill results to map domains

**12. Insights Engine Requirements:**
```
Source: src/features/progress/services/insightsEngine.ts
```
- `generateInsights()` needs sessions with accuracy data
- Trend detection compares recent vs older sessions
- At minimum needs sessions with varying `accuracy` values to generate insights

### Scenario-Specific Seeding Notes

**Scenario 1 & 2 (Confidence Radar + Session History):**
Seed 5 sessions spanning last 7 days with:
- Varied `confidenceBefore`/`confidenceAfter` values (1-5 scale)
- `drillQueue: ['number_line', 'spatial_rotation', 'math_operations']`
- 3-5 drill results per session covering all 3 modules
- `module: 'training'`, `completionStatus: 'completed'`

**Scenario 3 (Streak):**
Requires NATURAL training flow (not seeded) to trigger streak increment:
- First run `completeAssessment(page)` (required before training)
- Then navigate to `/training` and complete a full session using `completeAnyDrill`
- Seed localStorage BEFORE navigating: streak=6, lastSessionDate=yesterday

**Scenario 4 (Insights):**
Seed 10 sessions with progressive accuracy increase (60%→90%):
- Sessions timestamped over 2+ weeks for trend detection
- Include drill results with matching accuracy values
- `module: 'training'`, `completionStatus: 'completed'`

**Scenario 5 (Data Export):**
Reuse seeded data from earlier scenarios (or seed minimal data).
Focus on download mechanics, not data accuracy (unit tests cover that).

### Anti-Patterns to Avoid (from Previous E2E Reviews)

1. **Avoid excessive `waitForTimeout()`** — Use `expect().toBeVisible({ timeout })` instead
2. **Always `.catch(() => false)` on `isVisible()` checks** — Elements may detach during transitions
3. **Don't assume timing** — Use Playwright's auto-waiting and explicit assertions
4. **Don't skip error handling in `page.evaluate()`** — IndexedDB operations can fail
5. **Don't use CSS selectors when data-testid exists** — Prefer stable selectors
6. **Don't forget to clear DB in beforeEach** — Each test must be independent

### Console Logging Convention
```typescript
console.log('📈 Starting progress flow test...');
console.log('💾 Seeding 5 training sessions...');
console.log('🔍 Verifying confidence radar...');
console.log('📋 Checking session history...');
console.log('🏅 Testing streak milestone...');
console.log('💡 Verifying insights panel...');
console.log('📥 Testing CSV export...');
console.log('✅ Progress flow test complete!');
```

### Previous Story Intelligence (Story 5.5)

**Learnings from Story 5.5 (Build Data Export Functionality):**
- Custom CSV serializer (no papaparse) — headers: `Session ID,Date,Time,Module,Duration (ms),Drill Count,Accuracy,Confidence Before,Confidence After,Confidence Change`
- Export buttons: `getByRole('button', { name: 'Export as CSV' })` and `getByRole('button', { name: 'Export as JSON' })`
- Date range selector: native `<select>` with `role="combobox"`
- Privacy notice: "Your data stays on your device. Exports are created locally."
- Empty state: "No data to export yet" when no sessions exist
- `isLoading` state prevents empty-state flash on mount
- `downloadCSVData()` creates Blob and triggers `<a download>` click

**Learnings from Story 4.6 (E2E Test — Adaptive Intelligence Flow):**
- Multiple independent test cases (5 tests, not 1 mega-test)
- `test.beforeEach` clears DB for isolation
- `test.setTimeout(90000)` for longer tests
- Toast verification: `page.locator('[data-sonner-toast]')`
- `answerCorrectly` parameter in `completeAnyDrill()` for controlling test outcomes
- `Math.random` override for deterministic behavior

**Learnings from Story 3.8 (E2E Test — Training Session):**
- `completeAnyDrill()` detects drill type at runtime via aria-labels
- Retry loop pattern: `while (drillsCompleted < max && retries < maxRetries)`
- Confidence prompts: `getByTestId('confidence-before-4')` and `getByTestId('confidence-after-4')`
- Session completion screen: `getByText('Session Complete!')`
- `queryIndexedDB()` helper for data verification

### Project Structure Notes

- New test file goes in `tests/e2e/progress-flow.spec.ts` (matches convention)
- Screenshots go in `test-results/progress-flow/` (matches convention from other flows)
- NO shared helper file exists — helpers are copied into each test file (project convention)
- `import fs from 'node:fs'` for reading downloaded files (Playwright runs in Node.js)

### References

- [Architecture: Testing Standards](docs/architecture.md) - E2E test patterns, Playwright config
- [Epics: Story 5.6](docs/epics.md) - Original requirements with 5 test scenarios
- [Playwright Config](playwright.config.ts) - Mobile viewport, browser projects, dev server
- [ProgressRoute](src/routes/ProgressRoute.tsx) - Component layout and ordering
- [ConfidenceRadar](src/features/progress/components/ConfidenceRadar.tsx) - data-testid="confidence-radar"
- [InsightsPanel](src/features/progress/components/InsightsPanel.tsx) - data-testid="insights-panel"
- [DataExport](src/features/progress/components/DataExport.tsx) - data-testid="data-export"
- [MilestoneModal](src/features/progress/components/MilestoneModal.tsx) - data-testid="milestone-modal"
- [SessionHistory](src/features/progress/components/SessionHistory.tsx) - No data-testid
- [StreakCounter](src/shared/components/StreakCounter.tsx) - No data-testid
- [schemas.ts](src/services/storage/schemas.ts) - Session, DrillResult types for seeding
- [db.ts](src/services/storage/db.ts) - DB name 'DiscalculasDB', table indexes
- [localStorage.ts](src/services/storage/localStorage.ts) - Namespaced keys for streak/settings
- [streakManager.ts](src/services/training/streakManager.ts) - Milestone thresholds
- [useConfidenceData.ts](src/features/progress/hooks/useConfidenceData.ts) - MIN_SESSIONS_REQUIRED=3
- [insightsEngine.ts](src/features/progress/services/insightsEngine.ts) - Trend detection logic
- [csvFormatter.ts](src/features/progress/utils/csvFormatter.ts) - CSV header format
- [adaptive-flow.spec.ts](tests/e2e/adaptive-flow.spec.ts) - Latest helper function versions
- [training-flow.spec.ts](tests/e2e/training-flow.spec.ts) - Training session patterns
- [Story 5.5](docs/stories/35-story-55-build-data-export-functionality.md) - Previous story learnings
- [Story 4.6](docs/stories/30-story-46-e2e-test-adaptive-intelligence-flow.md) - E2E test patterns
- [Story 3.8](docs/stories/24-story-38-e2e-test-complete-training-session-journey.md) - E2E test patterns
- [Story 2.7](docs/stories/16-story-27-e2e-test-first-time-user-assessment-journey.md) - E2E test patterns

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References
- SVG selector fix: `getByTestId('confidence-radar').locator('svg')` matched 3 SVGs (2 legend icons + chart). Fixed with `svg[role="application"]` selector.
- Domain label scoping: `getByText('Math Operations')` matched 8 elements across page. Fixed by scoping to `radarContainer`.
- Streak test timeout: Assessment UI (~40s) + training (~50s) exceeded 90s/120s timeouts. Fixed by seeding assessment via IndexedDB instead of UI.
- WebKit spatial drill: `page.keyboard.press('1')` unreliable in WebKit for div with `onKeyDown`. Fixed by using button clicks (`getByRole('button', { name: 'Yes, these are the same shape' })`).
- WebKit resource contention: 4 parallel WebKit workers caused `page.goto` timeouts. Resolved by running with `--workers=2`.

### Completion Notes List
- All 5 test scenarios implemented and passing across Chromium, Firefox, and WebKit (15/15)
- Test uses IndexedDB seeding for data-heavy scenarios (Confidence Radar, Session History, Insights, Data Export)
- Streak test uses hybrid approach: seeds assessment + localStorage via IndexedDB/localStorage, then runs live training session
- Magic Minute detection added to `completeDrills` loop for robustness
- Screenshots captured at each key progress view (AC-9)
- `npx tsc --noEmit` passes clean

### Code Review (AI) - 2026-02-07
**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Outcome:** Approved with fixes applied
**Issues found:** 0 Critical, 5 Medium, 4 Low
**Issues fixed:** 5 Medium, 1 Low
**Fixes applied:**
- M1: Added AC-2.5 verification via aria-label confidence value parsing (non-zero, 1-5 range)
- M2: Added AC-3.4/3.7 verification - session date ordering via accuracy checks (80% first, 60% last) and drill count
- M3: Added AC-5.5/5.6 verification - insight text contains "Improv" keyword and non-empty message
- M4: Removed unused `completeAssessment` function (50 lines dead code)
- M5: Removed unused `sessionCards` variable
- L4: Fixed subtask checkbox formatting (`[x]1.1` → `[x] 1.1`)

### File List
- `tests/e2e/progress-flow.spec.ts` (CREATED) - 5 E2E test scenarios for progress tracking flow
