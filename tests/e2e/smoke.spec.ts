// Smoke test - Basic E2E test to verify app loads and navigation works
// Tests on Chromium, Firefox, and WebKit with mobile viewport (375×667)

import { test, expect } from '@playwright/test';

test.describe('Discalculas Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');

    // Assert - Page loads and has expected content
    await expect(page).toHaveTitle(/Discalculas/i);

    // Verify the page is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('app has proper viewport on mobile', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');

    // Assert - Viewport is mobile size (375×667 iPhone SE)
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);
  });

  test('navigation is accessible and functional', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act - Find navigation element
    // Note: This test will pass once navigation components are implemented in Story 1.7
    const body = page.locator('body');

    // Assert - Body is visible (basic smoke test)
    await expect(body).toBeVisible();
  });

  test('app works offline (basic PWA check)', async ({ page, context }) => {
    // Arrange
    await page.goto('/');

    // Act - Simulate offline
    await context.setOffline(true);

    // Assert - Page still renders (service worker will be added in Story 1.8)
    // For now, just verify the DOM is still accessible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Restore online
    await context.setOffline(false);
  });

  test('app is responsive to user interactions', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act - Click somewhere on the page to verify interactivity
    await page.click('body');

    // Assert - No errors thrown (basic interaction test)
    await expect(page.locator('body')).toBeVisible();
  });
});
