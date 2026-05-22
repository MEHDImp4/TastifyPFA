import { expect, test } from '@playwright/test';
import { mockConfig, mockRefreshFail } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('unauthenticated page access', () => {
  test('home page is accessible without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page).not.toHaveURL(/login/);
  });

  test('menu page is accessible without auth', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.goto('/menu');
    await expect(page).toHaveURL('/menu');
  });

  test('reservations page is accessible without auth', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page).toHaveURL('/reservations');
  });

  test('account page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login page renders for guests', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back.' })).toBeVisible();
  });

  test('register page renders for guests', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
  });

  test('unknown routes render 404 page', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByText('Une Table Introuvable')).toBeVisible();
  });
});
