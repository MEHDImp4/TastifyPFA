import { expect, test } from '@playwright/test';

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
    const createResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/categories/') && response.request().method() === 'POST',
    );
    await page.getByTestId('category-save-button').click();
    const createdCategory = await (await createResponsePromise).json();

    const createdCard = page.getByTestId(`category-card-${createdCategory.id}`);
    await createdCard.scrollIntoViewIfNeeded();
    await expect(createdCard).toContainText(initialName);
    await createdCard.hover();
    await createdCard.locator('[data-testid^="category-edit-"]').click();
    await page.getByTestId('category-name-input').fill(updatedName);
    await page.getByTestId('category-description-input').fill('Updated category description from Playwright.');
    const updateResponsePromise = page.waitForResponse((response) =>
      response.url().includes(`/api/categories/${createdCategory.id}/`) && response.request().method() === 'PATCH',
    );
    await page.getByTestId('category-save-button').click();
    await updateResponsePromise;

    const updatedCard = page.getByTestId(`category-card-${createdCategory.id}`);
    await updatedCard.scrollIntoViewIfNeeded();
    await expect(updatedCard).toContainText(updatedName);
    page.once('dialog', (dialog) => dialog.accept());
    await updatedCard.hover();
    const deleteResponsePromise = page.waitForResponse((response) =>
      response.url().includes(`/api/categories/${createdCategory.id}/`) && response.request().method() === 'DELETE',
    );
    await updatedCard.locator('[data-testid^="category-delete-"]').click();
    await deleteResponsePromise;

    await expect(page.getByTestId(`category-card-${createdCategory.id}`)).toHaveCount(0);
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
    const createResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/plats/') && response.request().method() === 'POST',
    );
    await page.getByTestId('plat-save-button').click();
    const createdPlat = await (await createResponsePromise).json();

    const createdCard = page.getByTestId(`plat-card-${createdPlat.id}`);
    await createdCard.scrollIntoViewIfNeeded();
    await expect(createdCard).toContainText(initialName);
    await createdCard.hover();
    await createdCard.locator('[data-testid^="plat-edit-"]').click();
    await page.getByTestId('plat-name-input').fill(updatedName);
    await page.getByTestId('plat-description-input').fill('Updated Playwright dish description.');
    const updateResponsePromise = page.waitForResponse((response) =>
      response.url().includes(`/api/plats/${createdPlat.id}/`) && response.request().method() === 'PATCH',
    );
    await page.getByTestId('plat-save-button').click();
    await updateResponsePromise;

    const updatedCard = page.getByTestId(`plat-card-${createdPlat.id}`);
    await updatedCard.scrollIntoViewIfNeeded();
    await expect(updatedCard).toContainText(updatedName);
    page.once('dialog', (dialog) => dialog.accept());
    await updatedCard.hover();
    const deleteResponsePromise = page.waitForResponse((response) =>
      response.url().includes(`/api/plats/${createdPlat.id}/`) && response.request().method() === 'DELETE',
    );
    await updatedCard.locator('[data-testid^="plat-delete-"]').click();
    await deleteResponsePromise;

    await expect(page.getByTestId(`plat-card-${createdPlat.id}`)).toHaveCount(0);
  });
});
