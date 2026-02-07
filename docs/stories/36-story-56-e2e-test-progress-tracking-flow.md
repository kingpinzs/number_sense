### Story 5.6: E2E Test - Progress Tracking Flow

**As a** developer,
**I want** comprehensive E2E test covering the progress tracking features,
**So that** I can verify progress visualization and data export work correctly.

**Acceptance Criteria:**

**Given** all progress tracking stories are complete (Story 5.5 done)
**When** I run the E2E test suite
**Then** a Playwright test exists (`tests/e2e/progress-flow.spec.ts`) that:

**Test Scenario 1: Confidence Radar Display**

1. Seed database with 5 completed training sessions (varying confidence scores)
2. Navigate to `/progress`
3. Verify Confidence Radar chart renders
4. Verify 3 domain labels visible (Number Sense, Spatial Awareness, Math Operations)
5. Verify filled area corresponds to expected confidence values
6. Verify legend shows "Current" and "Starting Point"

**Test Scenario 2: Session History**

1. Navigate to `/progress`
2. Scroll down to Session History section
3. Verify 5 session cards displayed (matching seeded data)
4. Verify most recent session appears first
5. Click first session card to expand
6. Verify drill-by-drill breakdown appears
7. Verify drill count, accuracy, and confidence change match expected values

**Test Scenario 3: Streak Counter and Milestones**

1. Set streak to 6 in localStorage
2. Set last session date to yesterday
3. Navigate to `/` (home)
4. Verify streak counter shows "6"
5. Complete a training session (session 7)
6. Verify streak increments to 7
7. Verify milestone modal appears: "One Week Streak!"
8. Dismiss modal
9. Verify streak counter shows "7"

**Test Scenario 4: Insights Generation**

1. Seed database with 10 sessions showing upward accuracy trend
2. Navigate to `/progress`
3. Scroll to Insights section
4. Verify at least 2 insights displayed
5. Verify insight mentions improvement (e.g., "accuracy improved")
6. Verify insight includes actionable suggestion

**Test Scenario 5: Data Export**

1. Navigate to `/progress`
2. Scroll to Data Export section
3. Click "Export as CSV"
4. Verify download triggered (check Downloads folder or page.on('download'))
5. Read downloaded file contents
6. Verify CSV contains session data
7. Verify CSV format is valid (headers + rows)

**And** Test includes IndexedDB verification:

* Query `sessions` table, verify data matches chart display
* Query `drill_results` table, verify drill breakdown accuracy

**And** Test runs in mobile viewport (375×667)
**And** Test takes screenshots at: Confidence Radar, Session History, Streak Milestone, Insights
**And** Test completes in <60 seconds
**And** Test passes on Chromium, Firefox, WebKit

**Prerequisites:** Story 5.5 (Data export complete)

**Technical Notes:**

* Use Playwright's `page.evaluate()` to seed Dexie with test data
* Chart verification: Check for SVG elements (`page.locator('svg')`), verify `<Radar>` components
* Download testing: Use `page.on('download')` to intercept file download
  * `const download = await downloadPromise; const path = await download.path();`
  * Read file with Node.js `fs.readFileSync(path, 'utf-8')`
* Streak testing: Manipulate localStorage before test
* Screenshot storage: `test-results/progress-flow/`
* Run test in CI pipeline (already configured in Epic 1)

***
