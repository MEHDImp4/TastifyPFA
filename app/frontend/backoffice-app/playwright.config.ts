import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BACKOFFICE_BASE_URL ?? 'http://127.0.0.1:3000';
const includeExpandedMatrix = process.env.PLAYWRIGHT_EXPANDED_MATRIX === 'true';

const projects = [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: 'guest-chromium',
    dependencies: ['setup'],
    testMatch: [/.*\.public\.spec\.ts/, /.*\.a11y\.spec\.ts/],
    use: {
      ...devices['Desktop Chrome'],
    },
  },
  {
    name: 'gerant-chromium',
    dependencies: ['setup'],
    testMatch: [/.*\.gerant\.spec\.ts/, /.*backoffice\.quality\.spec\.ts/, /.*backoffice\.dashboard\.spec\.ts/],
    use: {
      ...devices['Desktop Chrome'],
      storageState: './tests/e2e/.auth/gerant.json',
    },
  },
  {
    name: 'serveur-chromium',
    dependencies: ['setup'],
    testMatch: [/.*\.serveur\.spec\.ts/, /.*backoffice\.quality\.spec\.ts/],
    use: {
      ...devices['Desktop Chrome'],
      storageState: './tests/e2e/.auth/serveur.json',
    },
  },
  {
    name: 'cuisinier-chromium',
    dependencies: ['setup'],
    testMatch: [/.*\.cuisinier\.spec\.ts/, /.*backoffice\.quality\.spec\.ts/],
    use: {
      ...devices['Desktop Chrome'],
      storageState: './tests/e2e/.auth/cuisinier.json',
    },
  },
];

if (includeExpandedMatrix) {
  projects.push(
    {
      name: 'guest-firefox-smoke',
      dependencies: ['setup'],
      testMatch: [/.*\.public\.spec\.ts/, /.*\.a11y\.spec\.ts/],
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'gerant-mobile-smoke',
      dependencies: ['setup'],
      testMatch: [/.*backoffice\.quality\.spec\.ts/, /.*backoffice\.dashboard\.spec\.ts/],
      use: {
        ...devices['iPhone 13'],
        storageState: './tests/e2e/.auth/gerant.json',
      },
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
