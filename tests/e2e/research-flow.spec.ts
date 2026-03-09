// Research Flow E2E Test
// Tests the experiment dashboard route in dev mode

import { test, expect } from '@playwright/test';

test.describe('Research Flow - Experiment Dashboard', () => {
  test('renders experiment dashboard with experiment list', async ({ page }) => {
    // ==========================================
    // ARRANGE: Navigate to /research (accessible in dev mode)
    // ==========================================

    await page.goto('/research');

    // ==========================================
    // ASSERT: Verify experiment dashboard renders
    // ==========================================

    // Verify dashboard heading
    await expect(page.getByText('Experiment Dashboard')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('A/B experiment results')).toBeVisible();

    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/research-flow/01-dashboard.png', fullPage: true });

    // ==========================================
    // ASSERT: Verify at least one experiment is listed
    // ==========================================

    // The first experiment card should be visible (drill-timer-visibility)
    const experimentCards = page.locator('[data-testid^="experiment-card-"]');
    const cardCount = await experimentCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Verify the first experiment has a name, status, and View Results button
    const firstCard = experimentCards.first();
    await expect(firstCard).toBeVisible();

    // Verify status badge is present (active, draft, or completed)
    const statusBadge = firstCard.locator('[aria-label^="status:"]');
    await expect(statusBadge).toBeVisible();

    // Verify View Results button exists on the first experiment
    const viewResultsButton = firstCard.getByRole('button', { name: /View Results/i });
    await expect(viewResultsButton).toBeVisible();

    // ==========================================
    // ACT: Click View Results to open detail view
    // ==========================================

    await viewResultsButton.click();

    // ==========================================
    // ASSERT: Verify detail view renders
    // ==========================================

    // Verify back button to list view
    const backButton = page.getByRole('button', { name: /Back to experiments list/i });
    await expect(backButton).toBeVisible({ timeout: 5000 });

    // Verify CSV export button exists in the detail view
    // Note: Export button may only show when there is data, so also check the no-data state
    const exportButton = page.getByRole('button', { name: /Export.*CSV/i });
    const noDataMessage = page.getByText('No data collected yet');

    const hasExport = await exportButton.isVisible().catch(() => false);
    const hasNoData = await noDataMessage.isVisible().catch(() => false);

    // Either export button exists (data present) or no-data message is shown
    expect(hasExport || hasNoData).toBeTruthy();

    // Take screenshot of detail view
    await page.screenshot({ path: 'test-results/research-flow/02-detail-view.png', fullPage: true });

    // ==========================================
    // ACT: Go back to list view
    // ==========================================

    await backButton.click();

    // Verify we're back at the list view
    await expect(page.getByText('Experiment Dashboard')).toBeVisible();
  });
});
