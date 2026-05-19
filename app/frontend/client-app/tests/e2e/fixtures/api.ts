import type { Page } from '@playwright/test';

const DEFAULT_CONFIG = {
  id: 1,
  nom: 'Tastify',
  description: 'Test restaurant',
  adresse: '123 Rue du Test, Casablanca',
  email: 'test@tastify.ma',
  telephone: '+212 600 000 000',
  logo: null,
  facebook: null,
  instagram: null,
  twitter: null,
  horaires: {},
  devise: 'MAD',
  updated_at: '2026-01-01T00:00:00Z',
};

export async function mockConfig(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route('**/api/settings/public/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...DEFAULT_CONFIG, ...overrides }),
    });
  });
}

export async function mockRefreshFail(page: Page) {
  await page.route('**/api/users/refresh/', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Authentication credentials were not provided.' }),
    });
  });
}

export const AUTHENTICATED_STORAGE_STATE = {
  cookies: [] as never[],
  origins: [
    {
      origin: 'http://127.0.0.1:3003',
      localStorage: [
        {
          name: 'client-auth-storage',
          value: JSON.stringify({
            state: {
              accessToken: 'mock-access-token',
              role: 'CLIENT',
              username: 'client_test',
              isAuthenticated: true,
              hasSession: true,
            },
            version: 0,
          }),
        },
      ],
    },
  ],
};
