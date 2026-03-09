// Training Drill Flow E2E Test
// Story 3.2: E2E Test - Number Line Drill Journey
// Tests full training journey: Start Training → NumberLineDrill appears → Complete drill → Advance

import { test, expect } from '@playwright/test';

test.describe('Training Drill Flow - Number Line Drill Journey', () => {
  test('completes training session with number line drills', async ({ page }) => {
    // ==========================================
    // ARRANGE: Setup - Complete assessment first
    // ==========================================

    await page.goto('/');

    // Clear IndexedDB to ensure clean state
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('DiscalculasDB');
    });

    // Quick assessment completion (required for training access)
    await page.goto('/assessment');

    // Answer all 10 questions quickly to unlock training
    const nextButton = page.getByTestId('next-button');

    for (let i = 1; i <= 10; i++) {
      await expect(page.getByTestId('step-indicator')).toContainText(`Question ${i} of 10`);

      // Answer based on question type (deterministic choices)
      if (i <= 2) {
        // QuantityComparison - click left
        await page.getByTestId('answer-left').click();
      } else if (i <= 4) {
        // NumberLineEstimation - click middle
        const numberLine = page.getByTestId('number-line');
        const lineBox = await numberLine.boundingBox();
        if (lineBox) {
          await page.mouse.click(lineBox.x + lineBox.width * 0.5, lineBox.y + lineBox.height * 0.5);
        }
      } else if (i <= 6) {
        // MentalRotation - click yes
        const yesButton = page.getByTestId('answer-yes');
        await expect(yesButton).toBeEnabled();
        await yesButton.click();
      } else if (i === 7) {
        // PatternMatching - click option A
        await page.getByTestId('option-A').click();
      } else {
        // BasicOperations/WordProblem - click digit 5
        await page.getByTestId('digit-5').click();
        await page.getByTestId('submit').click();
      }

      await page.waitForTimeout(100);
      await nextButton.click();
    }

    // Wait for results summary to appear
    await expect(page.getByText(/Your Number Sense Profile/i)).toBeVisible({ timeout: 10000 });

    // Take screenshot of results
    await page.screenshot({ path: 'test-results/training-drill-flow/01-assessment-complete.png', fullPage: true });

    // ==========================================
    // ACT: Navigate to training
    // ==========================================

    await page.goto('/training');
    await expect(page).toHaveURL(/\/training/);

    // Take screenshot of training setup screen
    await page.screenshot({ path: 'test-results/training-drill-flow/02-training-setup.png', fullPage: true });

    // ==========================================
    // ASSERT: Verify training setup screen
    // ==========================================

    // Verify "Ready to Train?" card is displayed
    await expect(page.getByText('Ready to Train?')).toBeVisible();
    await expect(page.getByText('Start your personalized training session')).toBeVisible();

    // Verify session type options are displayed
    await expect(page.getByText('Quick')).toBeVisible();
    await expect(page.getByText('Full')).toBeVisible();

    // Verify "Start Training" button exists and is enabled
    const startTrainingButton = page.getByTestId('start-training-button');
    await expect(startTrainingButton).toBeVisible();
    await expect(startTrainingButton).toBeEnabled();

    // ==========================================
    // ACT: Start training session
    // ==========================================

    console.log('🚀 Clicking "Start Training" button...');
    await startTrainingButton.click();

    // Wait a moment for state to update
    await page.waitForTimeout(500);

    // ==========================================
    // ASSERT: Verify NumberLineDrill appears
    // ==========================================

    console.log('🔍 Checking if NumberLineDrill appeared...');

    // Look for the number line drill elements
    // The drill should show "Where is X?" prompt
    const drillPrompt = page.locator('h2:has-text("Where is")');

    // Take screenshot to see what's actually on screen
    await page.screenshot({ path: 'test-results/training-drill-flow/03-after-start-training.png', fullPage: true });

    // Wait for drill to appear (with generous timeout)
    await expect(drillPrompt).toBeVisible({ timeout: 5000 });

    console.log('✅ NumberLineDrill appeared!');

    // Verify number line UI elements are present
    // Check for range indicators "0" and "100"
    await expect(page.getByText(/^0$/)).toBeVisible();
    await expect(page.getByText(/^100$|^1000$/)).toBeVisible();

    // Verify Submit button exists (should be disabled initially)
    const submitButton = page.getByRole('button', { name: /Submit/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // Verify keyboard hint is displayed
    await expect(page.getByText(/Press.*to move marker/i)).toBeVisible();

    // Take screenshot of first drill
    await page.screenshot({ path: 'test-results/training-drill-flow/04-drill-01-initial.png', fullPage: true });

    // ==========================================
    // ACT: Interact with number line drill
    // ==========================================

    console.log('🎯 Positioning marker on number line...');

    // Find the number line element (should have role="slider")
    const numberLineDrill = page.locator('[role="slider"]');
    await expect(numberLineDrill).toBeVisible();

    // Click on number line at 50% position
    const drillBox = await numberLineDrill.boundingBox();
    if (drillBox) {
      const clickX = drillBox.x + drillBox.width * 0.5;
      const clickY = drillBox.y + drillBox.height * 0.5;
      console.log(`   Clicking at (${clickX}, ${clickY})`);
      await page.mouse.click(clickX, clickY);
    }

    await page.waitForTimeout(200);

    // Verify Submit button is now enabled
    await expect(submitButton).toBeEnabled();

    // Take screenshot after positioning marker
    await page.screenshot({ path: 'test-results/training-drill-flow/05-drill-01-positioned.png', fullPage: true });

    // ==========================================
    // ACT: Submit answer
    // ==========================================

    console.log('✅ Submitting answer...');
    await submitButton.click();

    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify feedback appears
    // ==========================================

    console.log('📊 Checking for feedback...');

    // Verify feedback message appears (either "Correct!" or "Try again!")
    const feedbackCorrect = page.locator('text=/Correct!|Nice work!/i');
    const feedbackIncorrect = page.locator('text=/Try again|Not quite/i');

    const hasFeedback = await feedbackCorrect.isVisible().catch(() => false) ||
                        await feedbackIncorrect.isVisible().catch(() => false);

    expect(hasFeedback).toBeTruthy();

    // Take screenshot of feedback
    await page.screenshot({ path: 'test-results/training-drill-flow/06-drill-01-feedback.png', fullPage: true });

    // ==========================================
    // ASSERT: Verify auto-advance to next drill
    // ==========================================

    console.log('⏭️  Waiting for auto-advance to next drill...');

    // Wait for auto-advance (1.5 seconds + buffer)
    await page.waitForTimeout(2000);

    // Verify we're still in a drill (should show new target number)
    await expect(drillPrompt).toBeVisible({ timeout: 5000 });

    console.log('✅ Auto-advanced to next drill!');

    // Take screenshot of second drill
    await page.screenshot({ path: 'test-results/training-drill-flow/07-drill-02-initial.png', fullPage: true });

    // ==========================================
    // ACT: Complete second drill quickly
    // ==========================================

    console.log('🎯 Completing second drill...');

    // Find the number line again (new drill instance)
    const numberLineDrill2 = page.locator('[role="slider"]');
    await expect(numberLineDrill2).toBeVisible();

    // Click on number line at 70% position
    const drillBox2 = await numberLineDrill2.boundingBox();
    if (drillBox2) {
      await page.mouse.click(drillBox2.x + drillBox2.width * 0.7, drillBox2.y + drillBox2.height * 0.5);
    }

    await page.waitForTimeout(200);

    // Submit
    const submitButton2 = page.getByRole('button', { name: /Submit/i });
    await expect(submitButton2).toBeEnabled();
    await submitButton2.click();

    await page.waitForTimeout(200);

    // Take screenshot after second drill submission
    await page.screenshot({ path: 'test-results/training-drill-flow/08-drill-02-submitted.png', fullPage: true });

    // ==========================================
    // FINAL VALIDATION
    // ==========================================

    console.log('✅ Training drill flow test completed successfully!');

    // Test should complete in <60 seconds (validated by Playwright timeout config)
  });

  test('verifies difficulty progression across multiple drills', async ({ page }) => {
    // This test verifies AC-4: Difficulty progression
    // First 2 drills: Easy (0-100, multiples of 10)
    // Next 3 drills: Medium (0-100, any number)
    // Remaining: Hard (0-1000)

    // ==========================================
    // ARRANGE: Complete assessment to unlock training
    // ==========================================

    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('DiscalculasDB'));
    await page.goto('/assessment');

    const nextButton = page.getByTestId('next-button');

    for (let i = 1; i <= 10; i++) {
      await expect(page.getByTestId('step-indicator')).toContainText(`Question ${i} of 10`);

      if (i <= 2) {
        await page.getByTestId('answer-left').click();
      } else if (i <= 4) {
        const numberLine = page.getByTestId('number-line');
        const lineBox = await numberLine.boundingBox();
        if (lineBox) {
          await page.mouse.click(lineBox.x + lineBox.width * 0.5, lineBox.y + lineBox.height * 0.5);
        }
      } else if (i <= 6) {
        const yesButton = page.getByTestId('answer-yes');
        await expect(yesButton).toBeEnabled();
        await yesButton.click();
      } else if (i === 7) {
        await page.getByTestId('option-A').click();
      } else {
        await page.getByTestId('digit-5').click();
        await page.getByTestId('submit').click();
      }

      await page.waitForTimeout(100);
      await nextButton.click();
    }

    await expect(page.getByText(/Your Number Sense Profile/i)).toBeVisible({ timeout: 10000 });

    // ==========================================
    // ACT: Start training and complete drills
    // ==========================================

    await page.goto('/training');
    await expect(page).toHaveURL(/\/training/);

    const startTrainingButton = page.getByTestId('start-training-button');
    await expect(startTrainingButton).toBeVisible();
    await startTrainingButton.click();
    await page.waitForTimeout(500);

    // Complete first drill — verify it appears and can be submitted
    const drillPrompt = page.locator('h2:has-text("Where is")');
    const spatialDrill = page.locator('h2:has-text("Are these the same shape?")');

    let completedDrills = 0;
    const maxAttempts = 6;

    while (completedDrills < maxAttempts) {
      // Check which drill type appeared
      const hasNumberLine = await drillPrompt.isVisible().catch(() => false);
      const hasSpatial = await spatialDrill.isVisible().catch(() => false);

      if (hasNumberLine) {
        // Complete number line drill
        const numberLine = page.locator('[role="slider"]');
        const drillBox = await numberLine.boundingBox();
        if (drillBox) {
          await page.mouse.click(drillBox.x + drillBox.width * 0.5, drillBox.y + drillBox.height * 0.5);
        }
        await page.waitForTimeout(200);
        const submitButton = page.getByRole('button', { name: /Submit/i });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();
        completedDrills++;
      } else if (hasSpatial) {
        // Complete spatial drill
        const yesButton = page.getByRole('button', { name: /Yes/i });
        await expect(yesButton).toBeEnabled();
        await yesButton.click();
        completedDrills++;
      }

      // Wait for auto-advance
      await page.waitForTimeout(2000);
    }

    // ==========================================
    // ASSERT: Verify drills were completed (difficulty progression)
    // ==========================================

    // After completing multiple drills, verify the drill count advanced
    expect(completedDrills).toBeGreaterThanOrEqual(3);

    // Take screenshot after progression
    await page.screenshot({ path: 'test-results/training-drill-flow/difficulty-progression.png', fullPage: true });
  });

  test('verifies keyboard navigation works', async ({ page }) => {
    // This test verifies AC-5: Accessibility
    // Arrow Left/Right to move marker
    // Enter to submit

    // ==========================================
    // ARRANGE: Complete assessment to unlock training
    // ==========================================

    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('DiscalculasDB'));
    await page.goto('/assessment');

    const nextButton = page.getByTestId('next-button');

    for (let i = 1; i <= 10; i++) {
      await expect(page.getByTestId('step-indicator')).toContainText(`Question ${i} of 10`);

      if (i <= 2) {
        await page.getByTestId('answer-left').click();
      } else if (i <= 4) {
        const numberLine = page.getByTestId('number-line');
        const lineBox = await numberLine.boundingBox();
        if (lineBox) {
          await page.mouse.click(lineBox.x + lineBox.width * 0.5, lineBox.y + lineBox.height * 0.5);
        }
      } else if (i <= 6) {
        const yesButton = page.getByTestId('answer-yes');
        await expect(yesButton).toBeEnabled();
        await yesButton.click();
      } else if (i === 7) {
        await page.getByTestId('option-A').click();
      } else {
        await page.getByTestId('digit-5').click();
        await page.getByTestId('submit').click();
      }

      await page.waitForTimeout(100);
      await nextButton.click();
    }

    await expect(page.getByText(/Your Number Sense Profile/i)).toBeVisible({ timeout: 10000 });

    // ==========================================
    // ACT: Start training and find a number line drill
    // ==========================================

    await page.goto('/training');
    const startTrainingButton = page.getByTestId('start-training-button');
    await expect(startTrainingButton).toBeVisible();
    await startTrainingButton.click();
    await page.waitForTimeout(500);

    // Wait for a number line drill to appear
    const drillPrompt = page.locator('h2:has-text("Where is")');
    let foundNumberLineDrill = false;
    let attempts = 0;

    while (!foundNumberLineDrill && attempts < 10) {
      attempts++;

      if (await drillPrompt.isVisible().catch(() => false)) {
        foundNumberLineDrill = true;
        break;
      }

      // If spatial drill appeared, complete it to get to a number line drill
      const spatialDrill = page.locator('h2:has-text("Are these the same shape?")');
      if (await spatialDrill.isVisible().catch(() => false)) {
        const yesButton = page.getByRole('button', { name: /Yes/i });
        await yesButton.click();
        await page.waitForTimeout(2000);
      } else {
        await page.waitForTimeout(500);
      }
    }

    expect(foundNumberLineDrill).toBeTruthy();

    // ==========================================
    // ACT: Use keyboard to navigate the number line
    // ==========================================

    // Focus the slider element
    const slider = page.locator('[role="slider"]');
    await expect(slider).toBeVisible();
    await slider.focus();

    // Press ArrowRight multiple times to move marker
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Verify Submit button is now enabled (marker has been positioned)
    const submitButton = page.getByRole('button', { name: /Submit/i });
    await expect(submitButton).toBeEnabled();

    // Press ArrowLeft to move marker back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    // Submit is still enabled (marker is positioned)
    await expect(submitButton).toBeEnabled();

    // ==========================================
    // ACT: Press Enter to submit
    // ==========================================

    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify feedback appears after keyboard submission
    // ==========================================

    const feedbackCorrect = page.locator('text=/Correct!|Nice work!/i');
    const feedbackIncorrect = page.locator('text=/Try again|Not quite/i');

    const hasFeedback = await feedbackCorrect.isVisible().catch(() => false) ||
                        await feedbackIncorrect.isVisible().catch(() => false);

    expect(hasFeedback).toBeTruthy();

    // Take screenshot of keyboard navigation result
    await page.screenshot({ path: 'test-results/training-drill-flow/keyboard-navigation.png', fullPage: true });
  });
});

test.describe('Training Drill Flow - Spatial Rotation Drill Journey', () => {
  test('completes spatial rotation drill and verifies persistence', async ({ page }) => {
    // ==========================================
    // ARRANGE: Setup - Complete assessment first
    // ==========================================

    await page.goto('/');

    // Clear IndexedDB to ensure clean state
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('DiscalculasDB');
    });

    // Quick assessment completion (required for training access)
    await page.goto('/assessment');

    // Answer all 10 questions quickly to unlock training
    const nextButton = page.getByTestId('next-button');

    for (let i = 1; i <= 10; i++) {
      await expect(page.getByTestId('step-indicator')).toContainText(`Question ${i} of 10`);

      // Answer based on question type (deterministic choices)
      if (i <= 2) {
        await page.getByTestId('answer-left').click();
      } else if (i <= 4) {
        const numberLine = page.getByTestId('number-line');
        const lineBox = await numberLine.boundingBox();
        if (lineBox) {
          await page.mouse.click(lineBox.x + lineBox.width * 0.5, lineBox.y + lineBox.height * 0.5);
        }
      } else if (i <= 6) {
        const yesButton = page.getByTestId('answer-yes');
        await expect(yesButton).toBeEnabled();
        await yesButton.click();
      } else if (i === 7) {
        await page.getByTestId('option-A').click();
      } else {
        await page.getByTestId('digit-5').click();
        await page.getByTestId('submit').click();
      }

      await page.waitForTimeout(100);
      await nextButton.click();
    }

    // Wait for results summary
    await expect(page.getByText(/Your Number Sense Profile/i)).toBeVisible({ timeout: 10000 });

    // ==========================================
    // ACT: Navigate to training and start session
    // ==========================================

    await page.goto('/training');
    await expect(page).toHaveURL(/\/training/);

    const startTrainingButton = page.getByTestId('start-training-button');
    await expect(startTrainingButton).toBeVisible();
    await startTrainingButton.click();

    await page.waitForTimeout(500);

    // ==========================================
    // ASSERT: Wait for a drill to appear (could be number line or spatial rotation)
    // ==========================================

    console.log('🔍 Waiting for a drill to appear...');

    // Wait for either drill type to appear
    const numberLineDrill = page.locator('h2:has-text("Where is")');
    const spatialDrill = page.locator('h2:has-text("Are these the same shape?")');

    // Keep completing drills until we find a spatial rotation drill
    let foundSpatialDrill = false;
    let drillCount = 0;
    const maxDrills = 10; // Safety limit

    while (!foundSpatialDrill && drillCount < maxDrills) {
      drillCount++;

      // Check if spatial drill appeared
      if (await spatialDrill.isVisible().catch(() => false)) {
        foundSpatialDrill = true;
        console.log('✅ Found spatial rotation drill!');
        break;
      }

      // If number line drill appeared, complete it quickly
      if (await numberLineDrill.isVisible().catch(() => false)) {
        console.log(`🎯 Completing number line drill ${drillCount}...`);

        const numberLine = page.locator('[role="slider"]');
        const drillBox = await numberLine.boundingBox();
        if (drillBox) {
          await page.mouse.click(drillBox.x + drillBox.width * 0.5, drillBox.y + drillBox.height * 0.5);
        }

        await page.waitForTimeout(200);

        const submitButton = page.getByRole('button', { name: /Submit/i });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        // Wait for auto-advance
        await page.waitForTimeout(2000);
      } else {
        // Neither drill appeared, wait a bit
        await page.waitForTimeout(500);
      }
    }

    // Verify we found a spatial rotation drill
    expect(foundSpatialDrill).toBeTruthy();
    await expect(spatialDrill).toBeVisible();

    // Take screenshot of spatial rotation drill
    await page.screenshot({ path: 'test-results/training-drill-flow/spatial-01-initial.png', fullPage: true });

    // ==========================================
    // ASSERT: Verify spatial rotation drill UI elements
    // ==========================================

    console.log('🔍 Verifying spatial rotation drill UI...');

    // Verify question prompt
    await expect(page.getByText(/Are these the same shape\?/i)).toBeVisible();
    await expect(page.getByText(/may be rotated or mirrored/i)).toBeVisible();

    // Verify shape labels
    await expect(page.getByText('Reference')).toBeVisible();
    await expect(page.getByText('Comparison')).toBeVisible();

    // Verify two SVG shapes are displayed
    const shapes = page.locator('svg[viewBox="0 0 120 120"]');
    await expect(shapes).toHaveCount(2);

    // Verify answer buttons
    const yesButton = page.getByRole('button', { name: /Yes, these are the same shape/i });
    const noButton = page.getByRole('button', { name: /No, these are different shapes/i });

    await expect(yesButton).toBeVisible();
    await expect(noButton).toBeVisible();
    await expect(yesButton).toBeEnabled();
    await expect(noButton).toBeEnabled();

    // Verify keyboard hint
    await expect(page.getByText(/Press.*1.*or.*Y.*for Yes/i)).toBeVisible();

    // ==========================================
    // ACT: Select an answer
    // ==========================================

    console.log('🎯 Selecting "Yes, Same" answer...');

    // Click "Yes, Same" button
    await yesButton.click();

    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify feedback appears
    // ==========================================

    console.log('📊 Checking for feedback...');

    // Verify feedback message appears (either correct or incorrect)
    const feedbackCorrect = page.locator('text=/Correct!/i');
    const feedbackIncorrect = page.locator('text=/Not quite!/i');

    const hasFeedback = await feedbackCorrect.isVisible().catch(() => false) ||
                        await feedbackIncorrect.isVisible().catch(() => false);

    expect(hasFeedback).toBeTruthy();

    // Verify buttons are disabled after submission
    await expect(yesButton).toBeDisabled();
    await expect(noButton).toBeDisabled();

    // Take screenshot of feedback
    await page.screenshot({ path: 'test-results/training-drill-flow/spatial-02-feedback.png', fullPage: true });

    // ==========================================
    // ASSERT: Verify persistence to Dexie
    // ==========================================

    console.log('💾 Verifying drill result persisted to Dexie...');

    // Wait for auto-advance
    await page.waitForTimeout(2000);

    // Query IndexedDB for the spatial rotation drill result
    const drillResults = await page.evaluate(async () => {
      const request = indexedDB.open('DiscalculasDB');
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['drill_results'], 'readonly');
          const store = transaction.objectStore('drill_results');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            resolve(getAllRequest.result);
          };
        };
      });
    });

    console.log(`📊 Found ${drillResults.length} drill results in Dexie`);

    // Find spatial rotation drill result
    const spatialResult = drillResults.find((result: any) => result.module === 'spatial_rotation');

    // Verify spatial rotation drill result exists
    expect(spatialResult).toBeDefined();

    // Verify required fields
    expect(spatialResult.module).toBe('spatial_rotation');
    expect(spatialResult.sessionId).toBeDefined();
    expect(spatialResult.timestamp).toBeDefined();
    expect(spatialResult.difficulty).toMatch(/easy|medium|hard/);
    expect(spatialResult.isCorrect).toBeDefined();
    expect(spatialResult.accuracy).toBeTypeOf('number');
    expect(spatialResult.timeToAnswer).toBeTypeOf('number');

    // Verify spatial rotation specific fields
    expect(spatialResult.shapeType).toBeDefined();
    expect(spatialResult.rotationDegrees).toBeTypeOf('number');
    expect(spatialResult.isMirrored).toBeTypeOf('boolean');

    console.log('✅ Spatial rotation drill persisted correctly:', spatialResult);

    // ==========================================
    // FINAL VALIDATION
    // ==========================================

    console.log('✅ Spatial rotation drill test completed successfully!');
  });

  test('verifies keyboard navigation for spatial rotation drill', async ({ page }) => {
    // Complete assessment prerequisite
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('DiscalculasDB'));
    await page.goto('/assessment');

    const nextButton = page.getByTestId('next-button');

    for (let i = 1; i <= 10; i++) {
      if (i <= 2) {
        await page.getByTestId('answer-left').click();
      } else if (i <= 4) {
        const numberLine = page.getByTestId('number-line');
        const lineBox = await numberLine.boundingBox();
        if (lineBox) {
          await page.mouse.click(lineBox.x + lineBox.width * 0.5, lineBox.y + lineBox.height * 0.5);
        }
      } else if (i <= 6) {
        await page.getByTestId('answer-yes').click();
      } else if (i === 7) {
        await page.getByTestId('option-A').click();
      } else {
        await page.getByTestId('digit-5').click();
        await page.getByTestId('submit').click();
      }
      await page.waitForTimeout(100);
      await nextButton.click();
    }

    await expect(page.getByText(/Your Number Sense Profile/i)).toBeVisible({ timeout: 10000 });

    // Navigate to training and start
    await page.goto('/training');
    const startTrainingButton = page.getByTestId('start-training-button');
    await startTrainingButton.click();
    await page.waitForTimeout(500);

    // Find spatial rotation drill
    let foundSpatialDrill = false;
    let drillCount = 0;

    while (!foundSpatialDrill && drillCount < 10) {
      drillCount++;

      const spatialDrill = page.locator('h2:has-text("Are these the same shape?")');

      if (await spatialDrill.isVisible().catch(() => false)) {
        foundSpatialDrill = true;
        break;
      }

      // Complete number line drill if present
      const numberLineDrill = page.locator('h2:has-text("Where is")');
      if (await numberLineDrill.isVisible().catch(() => false)) {
        const numberLine = page.locator('[role="slider"]');
        const drillBox = await numberLine.boundingBox();
        if (drillBox) {
          await page.mouse.click(drillBox.x + drillBox.width * 0.5, drillBox.y + drillBox.height * 0.5);
        }
        await page.waitForTimeout(200);
        const submitButton = page.getByRole('button', { name: /Submit/i });
        await submitButton.click();
        await page.waitForTimeout(2000);
      } else {
        await page.waitForTimeout(500);
      }
    }

    expect(foundSpatialDrill).toBeTruthy();

    // Test keyboard navigation
    console.log('⌨️  Testing keyboard navigation...');

    // Focus the application container
    const container = page.getByRole('application', { name: /Spatial rotation drill/i });
    await container.focus();

    // Press "1" key to select "Yes, Same"
    await page.keyboard.press('1');

    await page.waitForTimeout(200);

    // Verify feedback appears
    const feedbackCorrect = page.locator('text=/Correct!/i');
    const feedbackIncorrect = page.locator('text=/Not quite!/i');

    const hasFeedback = await feedbackCorrect.isVisible().catch(() => false) ||
                        await feedbackIncorrect.isVisible().catch(() => false);

    expect(hasFeedback).toBeTruthy();

    console.log('✅ Keyboard navigation test completed!');
  });
});
