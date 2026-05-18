import { expect, test } from '@playwright/test';

test.describe('serveur browser workflows', () => {
  test('lands on the salle route and only sees serveur navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/salle$/);
    await expect(page.getByRole('heading', { name: 'Architectural Floor Plan' })).toBeVisible();

    await expect(page.getByTestId('nav-salle')).toBeVisible();
    await expect(page.getByTestId('nav-reservations')).toBeVisible();
    await expect(page.getByTestId('nav-dashboard')).toHaveCount(0);
    await expect(page.getByTestId('nav-categories')).toHaveCount(0);
    await expect(page.getByTestId('nav-kds')).toHaveCount(0);
  });

  test('keeps serveur users on allowed routes and redirects forbidden ones', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page).toHaveURL(/\/reservations$/);
    await expect(page.getByRole('heading', { name: 'Réservations' })).toBeVisible();

    await page.goto('/ordering/1');
    await expect(page).toHaveURL(/\/ordering\/1$/);

    for (const forbiddenPath of ['/categories', '/stock', '/hr', '/avis', '/settings', '/menu', '/kds']) {
      await page.goto(forbiddenPath);
      await expect(page).toHaveURL(/\/salle$/);
    }
  });

  test('redirects an authenticated serveur away from login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/salle$/);
  });
});
