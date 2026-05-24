import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.CLIENT_BASE_URL ?? 'http://127.0.0.1:3003';
const includeExpandedMatrix = process.env.PLAYWRIGHT_EXPANDED_MATRIX === 'true';

const projects = [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: 'chromium',
    dependencies: ['setup'],
    use: { ...devices['Desktop Chrome'] },
  },
];

if (includeExpandedMatrix) {
  projects.push(
    {
      name: 'firefox-smoke',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-smoke',
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome-smoke',
      dependencies: ['setup'],
      use: { ...devices['Pixel 5'] },
    },
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  globalSetup: './tests/e2e/setup/global.setup.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects,
});
