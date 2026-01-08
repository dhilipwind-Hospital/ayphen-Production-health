import { defineConfig, devices } from '@playwright/test';

// Base URL where the frontend is served
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // Increased to 2 minutes
  expect: { timeout: 30_000 }, // Increased to 30 seconds
  fullyParallel: false, // Run sequentially to avoid rate limits
  workers: 1, // Use single worker to avoid login conflicts
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
