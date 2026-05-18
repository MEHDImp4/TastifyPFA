import { expect, test } from '@playwright/test';

function categoryCardByText(page: import('@playwright/test').Page, text: string) {
  return page.locator('[data-testid^="category-card-"]').filter({ hasText: text }).first();
}

function platCardByText(page: import('@playwright/test').Page, text: string) {
  return page.locator('[data-testid^="plat-card-"]').filter({ hasText: text }).first();
}

test.describe('gerant browser workflows', () => {
  test('shows the manager navigation surface and can logout', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-categories')).toBeVisible();
    await expect(page.getByTestId('nav-stock')).toBeVisible();
    await expect(page.getByTestId('nav-hr')).toBeVisible();
    await expect(page.getByTestId('nav-avis')).toBeVisible();
    await expect(page.getByTestId('nav-settings')).toBeVisible();

    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('creates, edits, and deletes a category', async ({ page }) => {
    const unique = Date.now();
    const initialName = `PW Category ${unique}`;
    const updatedName = `${initialName} Updated`;

    await page.goto('/categories');
    await page.getByTestId('category-create-button').click();
    await page.getByTestId('category-name-input').fill(initialName);
    await page.getByTestId('category-description-input').fill('Playwright seeded category for browser CRUD coverage.');
    await page.getByTestId('category-order-input').fill('91');
    await page.getByTestId('category-save-button').click();

    await expect(categoryCardByText(page, initialName)).toBeVisible();

    const createdCard = categoryCardByText(page, initialName);
    await createdCard.hover();
    await createdCard.locator('[data-testid^="category-edit-"]').click();
    await page.getByTestId('category-name-input').fill(updatedName);
    await page.getByTestId('category-description-input').fill('Updated category description from Playwright.');
    await page.getByTestId('category-save-button').click();

    await expect(categoryCardByText(page, updatedName)).toBeVisible();

    const updatedCard = categoryCardByText(page, updatedName);
    page.once('dialog', (dialog) => dialog.accept());
    await updatedCard.hover();
    await updatedCard.locator('[data-testid^="category-delete-"]').click();

    await expect(categoryCardByText(page, updatedName)).toHaveCount(0);
  });

  test('creates, edits, and deletes a plat', async ({ page }) => {
    const unique = Date.now();
    const initialName = `PW Plat ${unique}`;
    const updatedName = `${initialName} Updated`;

    await page.goto('/menu');
    await page.getByTestId('plat-create-button').click();
    await page.getByTestId('plat-name-input').fill(initialName);
    await page.getByTestId('plat-price-input').fill('77.00');
    await page.getByTestId('plat-description-input').fill('Playwright seeded dish for manager catalog coverage.');
    await page.getByTestId('plat-time-input').fill('18');
    await page.getByTestId('plat-save-button').click();

    await expect(platCardByText(page, initialName)).toBeVisible();

    const createdCard = platCardByText(page, initialName);
    await createdCard.hover();
    await createdCard.locator('[data-testid^="plat-edit-"]').click();
    await page.getByTestId('plat-name-input').fill(updatedName);
    await page.getByTestId('plat-description-input').fill('Updated Playwright dish description.');
    await page.getByTestId('plat-save-button').click();

    await expect(platCardByText(page, updatedName)).toBeVisible();

    const updatedCard = platCardByText(page, updatedName);
    page.once('dialog', (dialog) => dialog.accept());
    await updatedCard.hover();
    await updatedCard.locator('[data-testid^="plat-delete-"]').click();

    await expect(platCardByText(page, updatedName)).toHaveCount(0);
  });
});
