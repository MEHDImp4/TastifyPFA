import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BACKOFFICE_BASE_URL ?? 'http://127.0.0.1:3000';

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
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'guest-chromium',
      dependencies: ['setup'],
      testMatch: /.*\.public\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'gerant-chromium',
      dependencies: ['setup'],
      testMatch: /.*\.gerant\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/.auth/gerant.json',
      },
    },
    {
      name: 'serveur-chromium',
      dependencies: ['setup'],
      testMatch: /.*\.serveur\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/.auth/serveur.json',
      },
    },
    {
      name: 'cuisinier-chromium',
      dependencies: ['setup'],
      testMatch: /.*\.cuisinier\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/.auth/cuisinier.json',
      },
    },
  ],
});
