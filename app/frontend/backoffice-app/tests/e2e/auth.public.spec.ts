import { expect, test } from '@playwright/test';

test.describe('public authentication flows', () => {
  test('redirects protected staff routes to login when unauthenticated', async ({ page }) => {
    for (const path of ['/categories', '/menu', '/salle', '/reservations', '/kds', '/stock']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: 'Authentication' })).toBeVisible();
    }
  });

  test('blocks empty credential submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('SAISIE_REQUISE')).toBeVisible();
  });

  test('shows unauthorized error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').fill('unknown_user');
    await page.getByTestId('login-password').fill('wrong-password');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('ACCES_REFUSE')).toBeVisible();
  });
});
