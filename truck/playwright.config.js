import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  timeout: 30000, // 30 second timeout per test
  globalTimeout: 300000, // 5 minute global timeout

  use: {
    baseURL: 'http://localhost:3000/truck',
    trace: 'on-first-retry',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Disable CSS animations/transitions for stable tests
    javaScriptEnabled: true,
  },

  // Start local server before tests (from parent directory to access shared/)
  webServer: {
    command: 'cd .. && python3 -m http.server 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Test on multiple browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
