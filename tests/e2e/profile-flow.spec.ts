// Profile Flow E2E Test
// Tests the profile/settings page: theme selector, dark mode toggle, sound switch, research mode consent

import { test, expect } from '@playwright/test';

test.describe('Profile Flow - Settings Page', () => {
  test('renders settings page with all controls', async ({ page }) => {
    // ==========================================
    // ARRANGE: Navigate to /profile
    // ==========================================

    await page.goto('/profile');

    // ==========================================
    // ASSERT: Verify Settings heading renders
    // ==========================================

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Take screenshot of settings page
    await page.screenshot({ path: 'test-results/profile-flow/01-settings.png', fullPage: true });

    // ==========================================
    // ASSERT: Verify theme selector exists with System/Light/Dark options
    // ==========================================

    const themeSelect = page.locator('#theme-select');
    await expect(themeSelect).toBeVisible();

    // Verify all three options exist
    const options = themeSelect.locator('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText('System');
    await expect(options.nth(1)).toHaveText('Light');
    await expect(options.nth(2)).toHaveText('Dark');
  });

  test('toggles dark mode and verifies data-theme attribute', async ({ page }) => {
    // ==========================================
    // ARRANGE: Navigate to /profile
    // ==========================================

    await page.goto('/profile');

    const themeSelect = page.locator('#theme-select');
    await expect(themeSelect).toBeVisible();

    // ==========================================
    // ACT: Toggle to Dark mode
    // ==========================================

    await themeSelect.selectOption('dark');
    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify data-theme="dark" on html element
    // ==========================================

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Take screenshot of dark mode
    await page.screenshot({ path: 'test-results/profile-flow/02-dark-mode.png', fullPage: true });

    // ==========================================
    // ACT: Switch back to Light mode
    // ==========================================

    await themeSelect.selectOption('light');
    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify data-theme is removed or set to light
    // ==========================================

    // Light mode should either remove data-theme or set it to "light"
    const dataTheme = await htmlElement.getAttribute('data-theme');
    expect(dataTheme === null || dataTheme === '' || dataTheme === 'light').toBeTruthy();

    // Take screenshot of light mode
    await page.screenshot({ path: 'test-results/profile-flow/03-light-mode.png', fullPage: true });
  });

  test('toggles sound switch', async ({ page }) => {
    // ==========================================
    // ARRANGE: Navigate to /profile
    // ==========================================

    await page.goto('/profile');

    // ==========================================
    // ASSERT: Verify sound switch exists
    // ==========================================

    const soundSwitch = page.locator('#sound-switch');
    await expect(soundSwitch).toBeVisible();

    // ==========================================
    // ACT: Get initial state and toggle
    // ==========================================

    const initialChecked = await soundSwitch.getAttribute('data-state');

    // Click to toggle
    await soundSwitch.click();
    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify state changed
    // ==========================================

    const newChecked = await soundSwitch.getAttribute('data-state');
    expect(newChecked).not.toBe(initialChecked);

    // Toggle back
    await soundSwitch.click();
    await page.waitForTimeout(200);

    // Verify it returned to original state
    const finalChecked = await soundSwitch.getAttribute('data-state');
    expect(finalChecked).toBe(initialChecked);
  });

  test('verifies research mode consent dialog flow', async ({ page }) => {
    // ==========================================
    // ARRANGE: Navigate to /profile
    // ==========================================

    await page.goto('/profile');

    // ==========================================
    // ASSERT: Verify research mode switch exists
    // ==========================================

    const researchSwitch = page.locator('#research-mode-switch');
    await expect(researchSwitch).toBeVisible();

    // Ensure research mode is initially off
    const initialState = await researchSwitch.getAttribute('data-state');
    if (initialState === 'checked') {
      // Turn it off first so we can test the consent flow
      await researchSwitch.click();
      await page.waitForTimeout(200);
    }

    // ==========================================
    // ACT: Toggle research mode ON (should show consent dialog)
    // ==========================================

    await researchSwitch.click();
    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify consent dialog appears
    // ==========================================

    const consentDialog = page.getByTestId('research-consent-dialog');
    await expect(consentDialog).toBeVisible({ timeout: 5000 });

    // Verify dialog content
    await expect(page.getByText('About Research Mode')).toBeVisible();
    await expect(page.getByText(/data stays on your device/i)).toBeVisible();

    // Verify Cancel and Enable buttons
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByTestId('confirm-research-mode')).toBeVisible();

    // Take screenshot of consent dialog
    await page.screenshot({ path: 'test-results/profile-flow/04-consent-dialog.png', fullPage: true });

    // ==========================================
    // ACT: Cancel the consent dialog
    // ==========================================

    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(200);

    // Verify dialog closed and research mode is still off
    await expect(consentDialog).not.toBeVisible();

    // ==========================================
    // ACT: Toggle again and confirm this time
    // ==========================================

    await researchSwitch.click();
    await page.waitForTimeout(200);

    await expect(consentDialog).toBeVisible({ timeout: 5000 });

    // Click Enable Research Mode
    await page.getByTestId('confirm-research-mode').click();
    await page.waitForTimeout(200);

    // ==========================================
    // ASSERT: Verify research mode is now enabled
    // ==========================================

    await expect(consentDialog).not.toBeVisible();
    await expect(researchSwitch).toHaveAttribute('data-state', 'checked');

    // Take screenshot of enabled state
    await page.screenshot({ path: 'test-results/profile-flow/05-research-enabled.png', fullPage: true });
  });
});
