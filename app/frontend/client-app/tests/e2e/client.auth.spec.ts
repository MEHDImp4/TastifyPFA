import { expect, test } from '@playwright/test';
import { AUTHENTICATED_STORAGE_STATE, mockConfig, mockRefreshFail } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('login form — validation', () => {
  test('shows error when both fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Se Connecter' }).click();
    await expect(page.getByText('Veuillez remplir tous les champs.')).toBeVisible();
  });

  test('shows error when only username is filled', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('USERNAME').fill('testuser');
    await page.getByRole('button', { name: 'Se Connecter' }).click();
    await expect(page.getByText('Veuillez remplir tous les champs.')).toBeVisible();
  });

  test('shows error when only password is filled', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="password"]').fill('somepass');
    await page.getByRole('button', { name: 'Se Connecter' }).click();
    await expect(page.getByText('Veuillez remplir tous les champs.')).toBeVisible();
  });
});

test.describe('login form — API responses', () => {
  test('shows error on invalid credentials (401)', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No active account found with the given credentials' }),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('USERNAME').fill('wronguser');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.getByRole('button', { name: 'Se Connecter' }).click();
    await expect(page.getByText('Identifiants incorrects.')).toBeVisible();
  });

  test('shows error when staff role tries to log in as client', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'tok', role: 'GERANT', username: 'gerant_test' }),
      });
    });
    await page.route('**/api/users/logout/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/login');
    await page.getByPlaceholder('USERNAME').fill('gerant_test');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: 'Se Connecter' }).click();
    await expect(page.getByText('Accès réservé aux clients.')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('shows system error on server failure (5xx)', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('USERNAME').fill('someuser');
    await page.locator('input[type="password"]').fill('somepass');
    await page.getByRole('button', { name: 'Se Connecter' }).click();
    await expect(page.getByText('Erreur système. Veuillez réessayer.')).toBeVisible();
  });

  test('successful CLIENT login navigates to home', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'valid-token', role: 'CLIENT', username: 'client_test' }),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('USERNAME').fill('client_test');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: 'Se Connecter' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('authenticated user — route guards', () => {
  test.use({ storageState: AUTHENTICATED_STORAGE_STATE });

  test('authenticated user is redirected from /login to home', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/');
  });

  test('authenticated user is redirected from /register to home', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/');
  });

  test('authenticated user can access /account', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.goto('/account');
    await expect(page).toHaveURL('/account');
    await expect(page).not.toHaveURL(/login/);
  });
});
