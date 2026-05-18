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
});
