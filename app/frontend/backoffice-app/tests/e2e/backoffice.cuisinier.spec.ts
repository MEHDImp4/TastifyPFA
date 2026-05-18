import { expect, test } from '@playwright/test';

test.describe('cuisinier browser workflows', () => {
  test('lands on the kds route and only sees kitchen navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/kds$/);
    await expect(page.getByRole('heading', { name: 'Kitchen Command Center' })).toBeVisible();

    await expect(page.getByTestId('nav-menu')).toBeVisible();
    await expect(page.getByTestId('nav-kds')).toBeVisible();
    await expect(page.getByTestId('nav-reservations')).toHaveCount(0);
    await expect(page.getByTestId('nav-categories')).toHaveCount(0);
    await expect(page.getByTestId('nav-dashboard')).toHaveCount(0);
  });

  test('keeps cuisinier users on allowed routes and redirects forbidden ones', async ({ page }) => {
    await page.goto('/menu');
    await expect(page).toHaveURL(/\/menu$/);
    await expect(page.getByRole('heading', { name: 'Culinary Catalog' })).toBeVisible();

    for (const forbiddenPath of ['/categories', '/stock', '/hr', '/avis', '/settings', '/salle', '/reservations', '/ordering/1']) {
      await page.goto(forbiddenPath);
      await expect(page).toHaveURL(/\/kds$/);
    }
  });

  test('redirects an authenticated cuisinier away from login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/kds$/);
  });
});
