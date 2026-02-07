// Playwright E2E Testing Configuration
// Configured for Chromium, Firefox, and WebKit with mobile viewport

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Discalculas E2E tests
 * - Mobile-first viewport: 375×667 (iPhone SE)
 * - Base URL: http://localhost:5173 (Vite dev server)
 * - Trace on first retry for debugging
 * - All three browser engines: Chromium, Firefox, WebKit
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: 'html',

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  // Using custom mobile viewport (375×667) instead of device presets
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 }, // iPhone SE viewport
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 375, height: 667 }, // iPhone SE viewport
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 375, height: 667 }, // iPhone SE viewport
      },
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
