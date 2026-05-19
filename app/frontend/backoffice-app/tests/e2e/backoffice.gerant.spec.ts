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

  test('lets gerant users open every protected management route directly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/categories');
    await expect(page).toHaveURL(/\/categories$/);
    await expect(page.getByRole('heading', { name: 'Menu Architecture' })).toBeVisible();

    await page.goto('/menu');
    await expect(page).toHaveURL(/\/menu$/);
    await expect(page.getByRole('heading', { name: 'Culinary Catalog' })).toBeVisible();

    await page.goto('/stock');
    await expect(page).toHaveURL(/\/stock$/);
    await expect(page.getByRole('heading', { name: 'Gestion du Stock' })).toBeVisible();

    await page.goto('/reservations');
    await expect(page).toHaveURL(/\/reservations$/);
    await expect(page.getByRole('heading', { name: 'Réservations' })).toBeVisible();

    await page.goto('/kds');
    await expect(page).toHaveURL(/\/kds$/);
    await expect(page.getByRole('heading', { name: 'Kitchen Command Center' })).toBeVisible();

    await page.goto('/hr');
    await expect(page).toHaveURL(/\/hr$/);
    await expect(page.getByRole('heading', { name: 'Gestion du Personnel' })).toBeVisible();

    await page.goto('/avis');
    await expect(page).toHaveURL(/\/avis$/);
    await expect(page.getByRole('heading', { name: 'Analyse des Sentiments' })).toBeVisible();

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('button', { name: 'Enregistrer les modifications' })).toBeVisible();

    await page.goto('/ordering/1');
    await expect(page).toHaveURL(/\/ordering\/1$/);
    await expect(page.getByText('Operational Cart')).toBeVisible();
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

  test('resets category create drafts when the modal is reopened', async ({ page }) => {
    await page.goto('/categories');
    await page.getByTestId('category-create-button').click();
    await page.getByTestId('category-name-input').fill('Transient category');
    await page.getByTestId('category-description-input').fill('This draft should be discarded.');
    await page.getByTestId('category-order-input').fill('42');
    await page.locator('div.fixed.inset-0.z-\\[100\\] button').first().click();
    await expect(page.getByTestId('category-name-input')).toHaveCount(0);

    await page.getByTestId('category-create-button').click();
    await expect(page.getByTestId('category-name-input')).toHaveValue('');
    await expect(page.getByTestId('category-description-input')).toHaveValue('');
    await expect(page.getByTestId('category-order-input')).toHaveValue('0');
  });

  test('keeps the category draft visible when creation fails', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'category write failed' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/categories');
    await page.getByTestId('category-create-button').click();
    await page.getByTestId('category-name-input').fill('Broken category draft');
    await page.getByTestId('category-description-input').fill('The modal should stay open after the API failure.');
    await page.getByTestId('category-order-input').fill('7');
    await page.getByTestId('category-save-button').click();

    await expect(page.getByTestId('category-name-input')).toHaveValue('Broken category draft');
    await expect(page.getByTestId('category-description-input')).toHaveValue('The modal should stay open after the API failure.');
    await expect(page.getByTestId('category-order-input')).toHaveValue('7');
  });

  test('shows a save error and keeps the plat draft after a failed create', async ({ page }) => {
    await page.route('**/api/plats/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'plat write failed' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/menu');
    await page.getByTestId('plat-create-button').click();
    await page.getByTestId('plat-name-input').fill('Broken plat draft');
    await page.getByTestId('plat-price-input').fill('31.50');
    await page.getByTestId('plat-description-input').fill('This draft should survive a failing save.');
    await page.getByTestId('plat-time-input').fill('12');
    await page.getByTestId('plat-save-button').click();

    await expect(page.getByText('Erreur lors de la sauvegarde')).toBeVisible();
    await expect(page.getByTestId('plat-name-input')).toHaveValue('Broken plat draft');
    await expect(page.getByTestId('plat-price-input')).toHaveValue('31.50');
    await expect(page.getByTestId('plat-description-input')).toHaveValue('This draft should survive a failing save.');
  });

  test('renders the settings fallback state when configuration loading fails', async ({ page }) => {
    await page.route('**/api/settings/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'settings unavailable' }),
      });
    });

    await page.goto('/settings');
    await expect(page.getByText('Impossible de charger la configuration.')).toBeVisible();
  });

  test('saves settings successfully with a deterministic API response', async ({ page }) => {
    const settingsPayload = {
      id: 1,
      nom: 'Tastify Test House',
      description: 'Base config',
      adresse: 'Casablanca',
      email: 'ops@tastify.test',
      telephone: '+212600000000',
      logo: null,
      facebook: null,
      instagram: null,
      twitter: null,
      horaires: {},
      devise: 'DH',
      updated_at: '2026-05-19T00:00:00Z',
    };

    await page.route('**/api/settings/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(settingsPayload),
      });
    });

    await page.route('**/api/settings/1/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...settingsPayload,
          nom: 'Playwright Bistro',
          description: 'Saved from E2E',
        }),
      });
    });

    await page.goto('/settings');
    await page.locator('input[name="nom"]').fill('Playwright Bistro');
    await page.locator('textarea[name="description"]').fill('Saved from E2E');
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();

    await expect(page.getByText('Paramètres enregistrés avec succès')).toBeVisible();
    await expect(page.locator('input[name="nom"]')).toHaveValue('Playwright Bistro');
    await expect(page.locator('textarea[name="description"]')).toHaveValue('Saved from E2E');
  });

  test('shows a settings save error when the update request fails', async ({ page }) => {
    await page.route('**/api/settings/1/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'settings write failed' }),
      });
    });

    await page.goto('/settings');
    await page.locator('input[name="nom"]').fill('Broken save');
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();

    await expect(page.getByText("Erreur lors de l'enregistrement")).toBeVisible();
    await expect(page.locator('input[name="nom"]')).toHaveValue('Broken save');
  });

  test('renders the HR empty state and export toast when no employees are returned', async ({ page }) => {
    await page.route('**/api/employes/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/hr');
    await expect(page.getByText('Aucun employé enregistré.')).toBeVisible();
    await page.getByRole('button', { name: /Exporter la liste/ }).click();
    await expect(page.getByText('Génération du PDF en cours...')).toBeVisible();
  });

  test('renders the avis empty state when no feedback is returned', async ({ page }) => {
    await page.route('**/api/avis/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/avis');
    await expect(page.getByText('Aucun avis client pour le moment.')).toBeVisible();
  });

  test('surfaces low stock rows when ingredient thresholds are crossed', async ({ page }) => {
    await page.route('**/api/stock/ingredients/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9001,
            nom: 'Safran test',
            unite_mesure: 'g',
            stock_actuel: '2.00',
            seuil_alerte: '5.00',
            est_active: true,
          },
        ]),
      });
    });

    await page.goto('/stock');
    await expect(page.getByText('Safran test')).toBeVisible();
    await expect(page.getByText('Réappro', { exact: true })).toBeVisible();
  });
});
