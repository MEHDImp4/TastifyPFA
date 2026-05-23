import { expect, test } from '@playwright/test';
import { AUTHENTICATED_STORAGE_STATE, mockConfig, mockRefreshFail } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('login form — validation', () => {
  test('shows error when both fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-username').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('login-error')).toContainText('IDENTIFIER_REQUIRED');
  });

  test('shows error when only username is filled', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-username').fill('testuser');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toContainText('IDENTIFIER_REQUIRED');
  });

  test('shows error when only password is filled', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-password').fill('somepass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toContainText('IDENTIFIER_REQUIRED');
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
    await page.getByTestId('login-username').fill('wronguser');
    await page.getByTestId('login-password').fill('wrongpass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('INVALID_PROTOCOL')).toBeVisible();
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
    await page.getByTestId('login-username').fill('gerant_test');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('GUEST_ACCESS_ONLY')).toBeVisible();
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
    await page.getByTestId('login-username').fill('someuser');
    await page.getByTestId('login-password').fill('somepass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('SYSTEM_BREACH')).toBeVisible();
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
    await page.getByTestId('login-username').fill('client_test');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('register form — API responses', () => {
  test('shows backend detail and stays on register when registration fails', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'USERNAME_ALREADY_EXISTS' }),
      });
    });

    await page.goto('/register');
    await page.getByPlaceholder('NOM_DE_PLUME').fill('taken_user');
    await page.getByPlaceholder('GUEST@DOMAIN.COM').fill('taken@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /Commit Registry/i }).click();

    await expect(page).toHaveURL('/register');
    await expect(page.getByText('USERNAME_ALREADY_EXISTS')).toBeVisible();
  });

  test('registers a client account then logs in and redirects home', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 91, username: 'fresh_guest' }),
      });
    });
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'fresh-token', role: 'CLIENT', username: 'fresh_guest' }),
      });
    });

    await page.goto('/register');
    await page.getByPlaceholder('NOM_DE_PLUME').fill('fresh_guest');
    await page.getByPlaceholder('GUEST@DOMAIN.COM').fill('fresh@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /Commit Registry/i }).click();

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
