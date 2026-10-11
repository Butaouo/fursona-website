import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.e2e.ts', fullyParallel: true,
  retries: process.env.CI ? 1 : 0, workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'reports/e2e.json' }]],
  use: { baseURL: process.env.TEST_URL || 'http://127.0.0.1:4173/fursona-website/', locale: 'zh-TW', colorScheme: 'light', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: process.env.TEST_URL ? undefined : { command: 'npm run preview', url: 'http://127.0.0.1:4173/fursona-website/', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'android-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
