import { expect, test } from '@playwright/test';
import { fulfillRefreshWithStoredAccess } from './fixtures/auth';

type DashboardPayload = {
  todayRevenue: number;
  activeTables: number;
  pendingOrders: number;
  avgPrepTime: number;
  revenue7Days: Array<{ day: string; value: number }>;
  topDishes: Array<{ name: string; quantity: number }>;
  sentimentStats?: {
    total: number;
    positif_pct: number;
    neutre_pct: number;
    negatif_pct: number;
  };
};

const richDashboardPayload: DashboardPayload = {
  todayRevenue: 4290,
  activeTables: 14,
  pendingOrders: 6,
  avgPrepTime: 18,
  revenue7Days: [
    { day: 'Mon', value: 3010 },
    { day: 'Tue', value: 3320 },
  ],
  topDishes: [
    { name: 'Tagine Royal', quantity: 12 },
    { name: 'Pastilla', quantity: 8 },
  ],
  sentimentStats: {
    total: 28,
    positif_pct: 71,
    neutre_pct: 18,
    negatif_pct: 11,
  },
};

const emptyDashboardPayload: DashboardPayload = {
  todayRevenue: 0,
  activeTables: 0,
  pendingOrders: 0,
  avgPrepTime: 0,
  revenue7Days: [],
  topDishes: [],
  sentimentStats: {
    total: 0,
    positif_pct: 0,
    neutre_pct: 0,
    negatif_pct: 0,
  },
};

test.describe('manager dashboard analytics e2e', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/users/logout/', async route => {
      await route.fulfill({ status: 200 });
    });
    await page.route('**/api/users/refresh/', async route => {
      await fulfillRefreshWithStoredAccess(page, route, 'GERANT', 'gerant_test');
    });
    await page.route('**/api/commandes/*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/tables/', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
  });

  test('renders loading, success KPIs, and analytics syntheses from deterministic data', async ({ page }) => {
    let releaseDashboardResponse: (() => void) | undefined;
    const dashboardResponseReady = new Promise((resolve) => {
      releaseDashboardResponse = resolve;
    });

    await page.route('**/api/analytics/dashboard/', async route => {
      await dashboardResponseReady;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(richDashboardPayload),
      });
    });

    const navigation = page.goto('/');
    await expect(page.locator('svg.w-12.h-12.animate-spin')).toBeVisible();
    releaseDashboardResponse();
    await navigation;
    await expect(page.getByText('4290 DH')).toBeVisible();
    await expect(page.getByText('50%').first()).toBeVisible();
    await expect(page.getByText('6', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/^18m$/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Avis Clients' })).toBeVisible();
    await expect(page.getByText('28 avis analysés')).toBeVisible();
    await expect(page.getByText('71%')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Commandes en cours' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Retards cuisine' })).toBeVisible();
  });

  test('keeps the dashboard stable when analytics returns an empty operational snapshot', async ({ page }) => {
    await page.route('**/api/analytics/dashboard/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyDashboardPayload),
      });
    });

    await page.goto('/');

    await expect(page.getByText('0 DH')).toBeVisible();
    await expect(page.getByText(/^0%$/)).toBeVisible();
    await expect(page.getByText(/^0m$/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Avis Clients' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Commandes en cours' })).toBeVisible();
  });

  test('shows the dashboard fallback state when analytics fails', async ({ page }) => {
    await page.route('**/api/analytics/dashboard/', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'analytics offline' }),
      });
    });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Données indisponibles' })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('refreshes stale dashboard data cleanly after a hard reload', async ({ page }) => {
    let serveUpdatedSnapshot = false;

    await page.route('**/api/analytics/dashboard/', async route => {
      const payload = serveUpdatedSnapshot
        ? {
            ...richDashboardPayload,
            todayRevenue: 5120,
            activeTables: 18,
            pendingOrders: 3,
            avgPrepTime: 14,
            sentimentStats: {
              total: 32,
              positif_pct: 78,
              neutre_pct: 14,
              negatif_pct: 8,
            },
          }
        : richDashboardPayload;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });

    await page.goto('/');
    await expect(page.getByText('4290 DH')).toBeVisible();
    await expect(page.getByText(/^18m$/)).toBeVisible();

    serveUpdatedSnapshot = true;
    await page.reload();

    await expect(page.getByText('5120 DH')).toBeVisible();
    await expect(page.getByText(/^14m$/)).toBeVisible();
    await expect(page.getByText('78%')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
