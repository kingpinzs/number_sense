// Progress Tracking Flow E2E Test
// Story 5.6: E2E Test - Progress Tracking Flow
// Tests: Confidence Radar, Session History, Streak Counter, Insights, Data Export

import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';

// ============================================================================
// Helper Functions (copied from adaptive-flow.spec.ts)
// ============================================================================

/**
 * Unified helper to complete ANY drill type with specified correctness
 */
async function completeAnyDrill(page: Page, answerCorrectly: boolean = true): Promise<string> {
  const spatialDrillContainer = page.locator('[role="application"][aria-label="Spatial rotation drill"]');
  const numberLineDrillContainer = page.locator('[role="application"][aria-label="Number line drill"]');
  const mathDrillContainer = page.locator('[role="application"][aria-label="Math operations drill"]');

  if (await spatialDrillContainer.isVisible().catch(() => false)) {
    try {
      const sameBtn = page.getByRole('button', { name: 'Yes, these are the same shape' });
      const diffBtn = page.getByRole('button', { name: 'No, these are different shapes' });
      const targetBtn = answerCorrectly ? sameBtn : diffBtn;
      if (await targetBtn.isVisible().catch(() => false) && await targetBtn.isEnabled().catch(() => false)) {
        await targetBtn.click();
        await page.waitForTimeout(2000);
        return 'spatial';
      }
      return 'none';
    } catch {
      return 'none';
    }
  }

  if (await numberLineDrillContainer.isVisible().catch(() => false)) {
    try {
      const numberLineTrack = page.locator('[role="slider"]');
      if (await numberLineTrack.isVisible().catch(() => false)) {
        const trackBox = await numberLineTrack.boundingBox();
        if (trackBox) {
          const position = answerCorrectly ? 0.5 : 0.95;
          await page.mouse.click(trackBox.x + trackBox.width * position, trackBox.y + trackBox.height / 2);
        }
        await page.waitForTimeout(500);
        const submitButton = page.getByRole('button', { name: /Submit/i });
        try {
          await submitButton.waitFor({ state: 'visible', timeout: 3000 });
          if (await submitButton.isEnabled().catch(() => false)) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            return 'number_line';
          }
        } catch {
          // Submit button not ready
        }
      }
    } catch {
      return 'none';
    }
  }

  if (await mathDrillContainer.isVisible().catch(() => false)) {
    const digitButton = page.getByTestId('digit-5');
    if (await digitButton.isVisible().catch(() => false)) {
      await digitButton.click();
      const submitBtn = page.getByTestId('submit');
      if (await submitBtn.isEnabled().catch(() => false)) {
        await submitBtn.click();
        const confidentButton = page.getByRole('button', { name: 'Confident - I was very confident' });
        try {
          await confidentButton.waitFor({ state: 'visible', timeout: 5000 });
          await confidentButton.click({ force: true });
          await page.waitForTimeout(3000);
        } catch {
          await page.waitForTimeout(2000);
        }
        return 'math';
      }
    }
  }

  return 'none';
}

/**
 * Helper function to query IndexedDB table
 */
async function queryIndexedDB(page: Page, tableName: string): Promise<any[]> {
  return await page.evaluate(async (table) => {
    const request = indexedDB.open('DiscalculasDB');
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const db = request.result;
        try {
          const transaction = db.transaction([table], 'readonly');
          const store = transaction.objectStore(table);
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => resolve(getAllRequest.result);
          getAllRequest.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      };
      request.onerror = () => resolve([]);
    });
  }, tableName);
}

// ============================================================================
// Training Session Helpers (copied from adaptive-flow.spec.ts)
// ============================================================================

async function startTrainingSession(page: Page): Promise<void> {
  await page.goto('/training');
  await expect(page).toHaveURL(/\/training/);

  const startTrainingButton = page.getByTestId('start-training-button');
  await expect(startTrainingButton).toBeVisible({ timeout: 10000 });
  await startTrainingButton.click();

  await expect(page.getByText('How confident do you feel about math right now?')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('confidence-before-4').click();
  await page.waitForTimeout(1000);
}

async function completeDrills(page: Page, count: number, correctRate: number): Promise<number> {
  let drillsCompleted = 0;
  let retryCount = 0;
  const maxRetries = 15;

  while (drillsCompleted < count && retryCount < maxRetries) {
    await page.waitForTimeout(1500);

    const confidenceAfter = page.getByText('How do you feel about math now?');
    const sessionComplete = page.getByText('Session Complete!');
    const magicMinute = page.getByTestId('magic-minute-overlay');

    if (await confidenceAfter.isVisible().catch(() => false)) break;
    if (await sessionComplete.isVisible().catch(() => false)) break;
    if (await magicMinute.isVisible().catch(() => false)) {
      console.log('   Magic Minute appeared - waiting for it to end...');
      await page.waitForTimeout(65000);
      break;
    }

    const answerCorrectly = Math.random() < correctRate;
    const drillType = await completeAnyDrill(page, answerCorrectly);

    if (drillType !== 'none') {
      drillsCompleted++;
      console.log(`   Completed drill ${drillsCompleted} (${drillType})`);
      retryCount = 0;
    } else {
      retryCount++;
      await page.waitForTimeout(500);
    }
  }

  return drillsCompleted;
}

async function finishSession(page: Page): Promise<void> {
  const confidenceAfter = page.getByText('How do you feel about math now?');
  try {
    await expect(confidenceAfter).toBeVisible({ timeout: 15000 });
    await page.getByTestId('confidence-after-4').click();
    await page.waitForTimeout(500);
  } catch {
    console.log('   Confidence after prompt not found');
  }

  try {
    await expect(page.getByText('Session Complete!')).toBeVisible({ timeout: 10000 });
  } catch {
    console.log('   Session complete summary not found');
  }
}

// ============================================================================
// Seeding Helpers
// ============================================================================

/**
 * Seed IndexedDB with sessions and drill results via raw IndexedDB API.
 * Page must already be loaded (Dexie DB created) before calling.
 */
async function seedDatabase(
  page: Page,
  sessions: Record<string, unknown>[],
  drillResults: Record<string, unknown>[]
): Promise<void> {
  await page.evaluate(async ({ sessions, drillResults }) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('DiscalculasDB');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['sessions', 'drill_results'], 'readwrite');
        const sessionsStore = tx.objectStore('sessions');
        const drillsStore = tx.objectStore('drill_results');

        for (const session of sessions) {
          sessionsStore.put(session);
        }
        for (const drill of drillResults) {
          drillsStore.put(drill);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }, { sessions, drillResults });
}

/**
 * Build 5 training sessions with drill results for Scenarios 1 & 2.
 * Sessions span last 7 days with increasing accuracy and confidence.
 */
function build5SessionData() {
  const now = Date.now();
  const modules = ['number_line', 'spatial_rotation', 'math_operations'];
  const sessions: Record<string, unknown>[] = [];
  const drillResults: Record<string, unknown>[] = [];

  for (let i = 0; i < 5; i++) {
    const dayOffset = 7 - i; // 7, 6, 5, 4, 3 days ago
    const timestamp = new Date(now - dayOffset * 86400000).toISOString();
    const accuracy = 60 + i * 5; // 60, 65, 70, 75, 80
    const confAfter = 2 + i * 0.5; // 2.0, 2.5, 3.0, 3.5, 4.0

    sessions.push({
      id: i + 1,
      timestamp,
      module: 'training',
      duration: 600000,
      completionStatus: 'completed',
      drillCount: 6,
      accuracy,
      confidenceBefore: 2,
      confidenceAfter: confAfter,
      confidenceChange: confAfter - 2,
      drillQueue: [...modules],
    });

    // 6 drill results per session (2 per module)
    for (let j = 0; j < 6; j++) {
      const drillModule = modules[j % 3];
      const isCorrect = j < Math.ceil((accuracy / 100) * 6);
      drillResults.push({
        id: i * 6 + j + 1,
        sessionId: i + 1,
        timestamp: new Date(now - dayOffset * 86400000 + j * 30000).toISOString(),
        module: drillModule,
        difficulty: ['easy', 'medium', 'hard'][j % 3],
        isCorrect,
        timeToAnswer: 3000 + j * 500,
        accuracy: isCorrect ? 100 : 0,
      });
    }
  }

  return { sessions, drillResults };
}

/**
 * Build 10 training sessions with upward accuracy trend for Scenario 4.
 * 4 sessions in the last 7 days for weekly consistency.
 * Drill accuracy graduated (not binary) for clear trend detection.
 */
function build10SessionData() {
  const now = Date.now();
  const modules = ['number_line', 'spatial_rotation', 'math_operations'];
  const sessions: Record<string, unknown>[] = [];
  const drillResults: Record<string, unknown>[] = [];
  // Day offsets: first 6 are older (14-9 days ago), last 4 within 7 days
  const dayOffsets = [14, 13, 12, 11, 10, 9, 6, 5, 4, 3];

  for (let i = 0; i < 10; i++) {
    const dayOffset = dayOffsets[i];
    const timestamp = new Date(now - dayOffset * 86400000).toISOString();
    const accuracy = 50 + i * 5; // 50, 55, 60, ..., 95
    const confAfter = 2 + i * 0.28; // 2.0 → 4.52

    sessions.push({
      id: i + 1,
      timestamp,
      module: 'training',
      duration: 600000,
      completionStatus: 'completed',
      drillCount: 3,
      accuracy,
      confidenceBefore: 2,
      confidenceAfter: Math.round(confAfter * 10) / 10,
      confidenceChange: Math.round((confAfter - 2) * 10) / 10,
      drillQueue: [...modules],
    });

    // 3 drill results per session (1 per module) with graduated accuracy
    for (let j = 0; j < 3; j++) {
      drillResults.push({
        id: i * 3 + j + 1,
        sessionId: i + 1,
        timestamp: new Date(now - dayOffset * 86400000 + j * 30000).toISOString(),
        module: modules[j],
        difficulty: 'medium',
        isCorrect: accuracy >= 60,
        timeToAnswer: 4000 - i * 200,
        accuracy: accuracy + j * 2, // Slight per-drill variation for trend
      });
    }
  }

  return { sessions, drillResults };
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Progress Tracking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all state for test isolation
    await page.goto('/');
    await page.evaluate(() => {
      indexedDB.deleteDatabase('DiscalculasDB');
      localStorage.clear();
    });
    await page.waitForTimeout(500);
  });

  test('displays confidence radar with seeded training data', async ({ page }) => {
    test.setTimeout(90000);
    console.log('📈 Starting confidence radar test...');

    // Navigate to trigger Dexie DB creation
    await page.goto('/');
    await expect(page.getByText('Welcome to Discalculas')).toBeVisible({ timeout: 10000 });

    // Seed 5 sessions + drill results
    console.log('💾 Seeding 5 training sessions...');
    const { sessions, drillResults } = build5SessionData();
    await seedDatabase(page, sessions, drillResults);

    // Navigate to progress page
    await page.goto('/progress');
    await expect(page.getByText('Your Progress')).toBeVisible({ timeout: 10000 });

    // AC-2: Verify Confidence Radar chart renders (NOT empty state)
    console.log('🔍 Verifying confidence radar...');
    await expect(page.getByTestId('confidence-radar')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('confidence-radar-empty')).not.toBeVisible();

    // Verify SVG element exists within radar container (the main chart SVG has role="application")
    const svgElement = page.getByTestId('confidence-radar').locator('svg[role="application"]');
    await expect(svgElement).toBeVisible();

    // Verify 3 domain labels visible (scoped to radar container to avoid matches elsewhere)
    const radarContainer = page.getByTestId('confidence-radar');
    await expect(radarContainer.getByText('Number Sense')).toBeVisible();
    await expect(radarContainer.getByText('Spatial Awareness')).toBeVisible();
    await expect(radarContainer.getByText('Math Operations')).toBeVisible();

    // Verify legend shows "Current" and "Starting Point" (scoped to radar)
    await expect(radarContainer.getByText('Current')).toBeVisible();
    await expect(radarContainer.getByText('Starting Point')).toBeVisible();

    // AC-2.5: Verify rendered confidence values correspond to seeded data
    // The ConfidenceRadar aria-label contains computed values: "Confidence Radar: Number Sense X.X, ..."
    const radarAriaLabel = await page.getByTestId('confidence-radar').getAttribute('aria-label');
    expect(radarAriaLabel).toContain('Confidence Radar:');
    // With 5 seeded sessions spanning 3 domains, all domain values should be > 0
    const valueMatches = radarAriaLabel!.match(/(\d+\.\d)/g);
    expect(valueMatches).not.toBeNull();
    expect(valueMatches!.length).toBe(3); // 3 domains
    for (const val of valueMatches!) {
      const num = parseFloat(val);
      expect(num).toBeGreaterThan(0);
      expect(num).toBeLessThanOrEqual(5);
    }

    // AC-9: Take screenshot
    await page.screenshot({ path: 'test-results/progress-flow/01-confidence-radar.png', fullPage: true });

    // AC-7: Query IndexedDB to verify 5 sessions exist
    const storedSessions = await queryIndexedDB(page, 'sessions');
    expect(storedSessions.length).toBe(5);

    const storedDrills = await queryIndexedDB(page, 'drill_results');
    expect(storedDrills.length).toBe(30); // 5 sessions × 6 drills

    console.log('✅ Confidence radar test complete!');
  });

  test('displays session history with expandable drill breakdown', async ({ page }) => {
    test.setTimeout(90000);
    console.log('📋 Starting session history test...');

    // Navigate to trigger Dexie DB creation
    await page.goto('/');
    await expect(page.getByText('Welcome to Discalculas')).toBeVisible({ timeout: 10000 });

    // Seed 5 sessions + drill results
    console.log('💾 Seeding 5 training sessions...');
    const { sessions, drillResults } = build5SessionData();
    await seedDatabase(page, sessions, drillResults);

    // Navigate to progress page
    await page.goto('/progress');
    await expect(page.getByText('Your Progress')).toBeVisible({ timeout: 10000 });

    // AC-3: Scroll to Session History section
    console.log('📋 Checking session history...');
    const sessionHistoryHeading = page.getByText('Session History');
    await sessionHistoryHeading.scrollIntoViewIfNeeded();
    await expect(sessionHistoryHeading).toBeVisible();

    // Verify 5 session entries displayed via accordion triggers
    const accordionTriggers = page.locator('button[aria-label*="Session on"]');
    await expect(accordionTriggers.first()).toBeVisible({ timeout: 10000 });
    const triggerCount = await accordionTriggers.count();
    expect(triggerCount).toBe(5);

    // AC-3.4: Verify most recent session appears first (session 5 = 3 days ago, 80% accuracy, 6 drills)
    const firstTrigger = accordionTriggers.first();
    const firstAriaLabel = await firstTrigger.getAttribute('aria-label');
    expect(firstAriaLabel).toContain('6 drills');
    expect(firstAriaLabel).toContain('80%');

    // Verify oldest session is last (session 1 = 7 days ago, 60% accuracy)
    const lastTrigger = accordionTriggers.last();
    const lastAriaLabel = await lastTrigger.getAttribute('aria-label');
    expect(lastAriaLabel).toContain('60%');

    // Click first session card to expand accordion
    await firstTrigger.click();

    // Verify drill breakdown appears
    await expect(page.getByText('Drill Breakdown')).toBeVisible({ timeout: 5000 });

    // Verify drill entries are visible
    const drillItems = page.locator('li').filter({ has: page.locator('[aria-label="Correct"], [aria-label="Incorrect"]') });
    const drillCount = await drillItems.count();
    expect(drillCount).toBeGreaterThan(0);

    // AC-9: Take screenshot
    await page.screenshot({ path: 'test-results/progress-flow/02-session-history.png', fullPage: true });

    // AC-7: Verify IndexedDB data matches display
    const storedDrills = await queryIndexedDB(page, 'drill_results');
    // Drills for session 5 (the most recent, displayed first)
    const session5Drills = storedDrills.filter((d: any) => d.sessionId === 5);
    expect(session5Drills.length).toBe(6);

    console.log('✅ Session history test complete!');
  });

  test('tracks streak and shows milestone celebration', async ({ page }) => {
    test.setTimeout(120000);
    console.log('🏅 Starting streak milestone test...');

    // Step 1: Navigate to trigger Dexie DB creation, then seed assessment
    await page.goto('/');
    await expect(page.getByText('Welcome to Discalculas')).toBeVisible({ timeout: 10000 });

    // Seed a completed assessment via IndexedDB (bypasses slow UI-based assessment)
    await page.evaluate(async () => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('DiscalculasDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(['assessments'], 'readwrite');
          const store = tx.objectStore('assessments');
          store.put({
            id: 1,
            timestamp: new Date().toISOString(),
            status: 'completed',
            totalQuestions: 10,
            correctAnswers: 7,
            weaknesses: ['number-sense', 'spatial-rotation'],
            strengths: ['operations'],
            recommendations: [],
            userId: 'local_user',
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      });
    });
    console.log('   Assessment seeded');

    // Step 2: Seed localStorage with streak=6, lastSessionDate=yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    await page.evaluate((data) => {
      localStorage.setItem('discalculas:streak', data.streak);
      localStorage.setItem('discalculas:lastSessionDate', data.lastSessionDate);
      localStorage.setItem('discalculas:streakMilestonesShown', '[]');
    }, { streak: '6', lastSessionDate: yesterday.toISOString() });

    // Step 3: Navigate to home, verify streak shows "6"
    await page.goto('/');
    await page.waitForTimeout(2000);

    const streakButton6 = page.locator('button[aria-label="Current streak: 6 days"]');
    await expect(streakButton6).toBeVisible({ timeout: 10000 });
    console.log('   Streak counter shows 6');

    // Step 4: Complete a training session (up to 10 drills to handle variable session lengths)
    console.log('   Starting training session...');
    await startTrainingSession(page);
    await completeDrills(page, 10, 1.0);
    await finishSession(page);
    await page.waitForTimeout(2000);
    console.log('   Training session completed');

    // Step 5: Navigate to home, verify streak updated to 7
    await page.goto('/');
    await page.waitForTimeout(2000);

    const streakButton7 = page.locator('button[aria-label="Current streak: 7 days"]');
    await expect(streakButton7).toBeVisible({ timeout: 10000 });
    console.log('   Streak counter shows 7');

    // Step 6: Verify milestone modal appears ("One Week Streak!")
    await expect(page.getByTestId('milestone-modal')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('One Week Streak!')).toBeVisible();
    console.log('   Milestone modal displayed');

    // AC-9: Take screenshot of milestone
    await page.screenshot({ path: 'test-results/progress-flow/03-streak-milestone.png', fullPage: true });

    // Step 7: Dismiss modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('milestone-modal')).not.toBeVisible({ timeout: 5000 });

    // Verify streak still shows 7 after dismissal
    await expect(streakButton7).toBeVisible();

    console.log('✅ Streak milestone test complete!');
  });

  test('generates insights from session data trends', async ({ page }) => {
    test.setTimeout(90000);
    console.log('💡 Starting insights generation test...');

    // Navigate to trigger Dexie DB creation
    await page.goto('/');
    await expect(page.getByText('Welcome to Discalculas')).toBeVisible({ timeout: 10000 });

    // Seed 10 sessions with upward accuracy trend
    console.log('💾 Seeding 10 training sessions with upward trend...');
    const { sessions, drillResults } = build10SessionData();
    await seedDatabase(page, sessions, drillResults);

    // Navigate to progress page
    await page.goto('/progress');
    await expect(page.getByText('Your Progress')).toBeVisible({ timeout: 10000 });

    // AC-5: Scroll to insights panel
    console.log('💡 Verifying insights panel...');
    const insightsPanel = page.getByTestId('insights-panel');
    await insightsPanel.scrollIntoViewIfNeeded();
    await expect(insightsPanel).toBeVisible({ timeout: 10000 });

    // Verify NOT showing empty state
    await expect(page.getByTestId('insights-empty')).not.toBeVisible();

    // Verify at least 2 insight cards are displayed
    const insightCards = insightsPanel.locator('article');
    await expect(insightCards.first()).toBeVisible({ timeout: 10000 });
    const insightCount = await insightCards.count();
    expect(insightCount).toBeGreaterThanOrEqual(2);
    console.log(`   Found ${insightCount} insights`);

    // AC-5.5: Verify at least one insight mentions improvement
    // With upward-trending data, the engine generates "X Improving!" insights
    const panelText = await insightsPanel.textContent();
    expect(panelText).toMatch(/[Ii]mprov/);

    // AC-5.6: Verify insights contain actionable guidance
    // With positive trends, insights include messages like "accuracy improved X%" and "Consistent practice..."
    const firstInsight = insightCards.first();
    const firstMessage = firstInsight.locator('p');
    await expect(firstMessage).not.toBeEmpty();

    // AC-9: Take screenshot
    await page.screenshot({ path: 'test-results/progress-flow/04-insights-panel.png', fullPage: true });

    console.log('✅ Insights generation test complete!');
  });

  test('exports data as CSV with valid format', async ({ page }) => {
    test.setTimeout(90000);
    console.log('📥 Starting CSV export test...');

    // Navigate to trigger Dexie DB creation
    await page.goto('/');
    await expect(page.getByText('Welcome to Discalculas')).toBeVisible({ timeout: 10000 });

    // Seed 5 sessions + drill results
    console.log('💾 Seeding 5 training sessions...');
    const { sessions, drillResults } = build5SessionData();
    await seedDatabase(page, sessions, drillResults);

    // Navigate to progress page
    await page.goto('/progress');
    await expect(page.getByText('Your Progress')).toBeVisible({ timeout: 10000 });

    // AC-6: Scroll to Data Export section
    const dataExport = page.getByTestId('data-export');
    await dataExport.scrollIntoViewIfNeeded();
    await expect(dataExport).toBeVisible();

    // Verify export buttons are visible and enabled
    const csvButton = page.getByRole('button', { name: 'Export as CSV' });
    const jsonButton = page.getByRole('button', { name: 'Export as JSON' });
    await expect(csvButton).toBeVisible();
    await expect(csvButton).toBeEnabled();
    await expect(jsonButton).toBeVisible();
    await expect(jsonButton).toBeEnabled();

    // Verify NOT showing empty state
    await expect(page.getByTestId('export-empty')).not.toBeVisible();

    // Set up download listener and click CSV export
    console.log('📥 Testing CSV export...');
    const downloadPromise = page.waitForEvent('download');
    await csvButton.click();
    const download = await downloadPromise;

    // Verify filename format: discalculas-export-YYYY-MM-DD.csv
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/^discalculas-export-\d{4}-\d{2}-\d{2}\.csv$/);

    // Read downloaded file contents
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const content = fs.readFileSync(filePath!, 'utf-8');

    // Verify CSV has correct session headers
    const expectedHeaders = 'Session ID,Date,Time,Module,Duration (ms),Drill Count,Accuracy,Confidence Before,Confidence After,Confidence Change';
    expect(content).toContain(expectedHeaders);

    // Verify CSV contains data rows (at least 5 session rows)
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    // First section: session header + 5 data rows
    // After blank line: drill header + 30 data rows
    expect(lines.length).toBeGreaterThanOrEqual(7); // At least header + 5 rows + drill header

    // Verify drill results section headers
    expect(content).toContain('Drill ID,Session ID,Timestamp,Module,Difficulty,Correct,Time (ms),Accuracy');

    console.log(`   CSV exported: ${suggestedFilename} (${content.length} bytes, ${lines.length} lines)`);
    console.log('✅ CSV export test complete!');
  });
});
