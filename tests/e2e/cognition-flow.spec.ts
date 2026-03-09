// Cognition Flow E2E Test
// Tests the cognition games hub: navigation, game card rendering, and game launch/return

import { test, expect } from '@playwright/test';

test.describe('Cognition Flow - Games Hub', () => {
  test('renders all 3 game cards and navigates to games', async ({ page }) => {
    // ==========================================
    // ARRANGE: Navigate to cognition route
    // ==========================================

    await page.goto('/cognition');

    // ==========================================
    // ASSERT: Verify hub page renders
    // ==========================================

    // Verify the Brain Games heading
    await expect(page.getByText('Brain Games')).toBeVisible();
    await expect(page.getByText('Quick exercises to strengthen cognitive skills')).toBeVisible();

    // Verify all 3 game cards render
    await expect(page.getByText('Pattern Match')).toBeVisible();
    await expect(page.getByText('Spatial Flip')).toBeVisible();
    await expect(page.getByText('Memory Grid')).toBeVisible();

    // Verify descriptions
    await expect(page.getByText('Find matching symbol pairs')).toBeVisible();
    await expect(page.getByText('Rotate and match shapes')).toBeVisible();
    await expect(page.getByText('Remember and recall patterns')).toBeVisible();

    // Verify all 3 Play buttons are visible
    const playButtons = page.getByRole('button', { name: 'Play' });
    await expect(playButtons).toHaveCount(3);

    // Take screenshot of hub
    await page.screenshot({ path: 'test-results/cognition-flow/01-hub.png', fullPage: true });

    // ==========================================
    // ACT: Click Play on Pattern Match
    // ==========================================

    await playButtons.first().click();

    // ==========================================
    // ASSERT: Verify Pattern Match game loads
    // ==========================================

    // Verify the game loaded (back button appears)
    const backButton = page.getByRole('button', { name: /Back to Games/i });
    await expect(backButton).toBeVisible({ timeout: 5000 });

    // Take screenshot of Pattern Match game
    await page.screenshot({ path: 'test-results/cognition-flow/02-pattern-match.png', fullPage: true });

    // ==========================================
    // ACT: Click back to return to hub
    // ==========================================

    await backButton.click();

    // ==========================================
    // ASSERT: Verify return to hub
    // ==========================================

    await expect(page.getByText('Brain Games')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play' })).toHaveCount(3);

    // ==========================================
    // ACT: Click Play on Memory Grid (3rd card)
    // ==========================================

    const playButtonsAfterReturn = page.getByRole('button', { name: 'Play' });
    await playButtonsAfterReturn.nth(2).click();

    // ==========================================
    // ASSERT: Verify Memory Grid game loads
    // ==========================================

    // Memory Grid shows its title and back button
    await expect(page.getByText('Memory Grid')).toBeVisible({ timeout: 5000 });
    const memoryBackButton = page.getByRole('button', { name: /Back to Games/i });
    await expect(memoryBackButton).toBeVisible();

    // Take screenshot of Memory Grid game
    await page.screenshot({ path: 'test-results/cognition-flow/03-memory-grid.png', fullPage: true });

    // ==========================================
    // ACT: Click back to return to hub
    // ==========================================

    await memoryBackButton.click();

    // ==========================================
    // ASSERT: Verify return to hub again
    // ==========================================

    await expect(page.getByText('Brain Games')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play' })).toHaveCount(3);

    // Take screenshot of final hub state
    await page.screenshot({ path: 'test-results/cognition-flow/04-hub-final.png', fullPage: true });
  });
});
