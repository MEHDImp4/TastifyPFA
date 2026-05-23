import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const expectNoBlockingViolations = async (page: Parameters<typeof test>[0]['page']) => {
  const results = await new AxeBuilder({ page }).include('main').analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    impact === 'critical' || impact === 'serious',
  );

  expect(blockingViolations).toEqual([]);
};

const uploadedPng = {
  name: 'menu-media.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9p6m6wAAAABJRU5ErkJggg==',
    'base64',
  ),
};

test.describe('gerant browser workflows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
  });

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

  test('keeps the dashboard nav active after a direct route load', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/border-primary/);
    await expect(page.getByRole('heading', { name: 'Live Orchestration Feed' })).toBeVisible();
  });

  test('keeps gerant logout working after visiting a secondary route', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings$/);

    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('keeps gerant users on the same allowed route after a hard refresh', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings$/);

    await page.reload();

    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('button', { name: 'Deploy Changes' })).toBeVisible();
  });

  test('sends stale gerant session storage back to login safely', async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'backoffice-auth-storage',
        JSON.stringify({
          state: {
            accessToken: null,
            role: null,
            username: null,
            isAuthenticated: false,
            hasSession: true,
          },
          version: 0,
        }),
      );
    });

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('treats partial gerant storage as logged out state', async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'backoffice-auth-storage',
        JSON.stringify({
          state: {
            accessToken: 'stale-access-token',
            role: 'GERANT',
            username: 'partial_gerant',
            isAuthenticated: false,
            hasSession: false,
          },
          version: 0,
        }),
      );
    });

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('lets gerant users open every protected management route directly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/categories');
    await expect(page).toHaveURL(/\/categories$/);
    await expect(page.getByRole('heading', { name: 'Category Management' })).toBeVisible();

    await page.goto('/menu');
    await expect(page).toHaveURL(/\/menu$/);
    await expect(page.getByRole('heading', { name: 'Menu Operations' })).toBeVisible();

    await page.goto('/stock');
    await expect(page).toHaveURL(/\/stock$/);
    await expect(page.getByRole('heading', { name: 'Inventory & Logistics' })).toBeVisible();

    await page.goto('/reservations');
    await expect(page).toHaveURL(/\/reservations$/);
    await expect(page.getByRole('heading', { name: 'Reservations Admin' })).toBeVisible();

    await page.goto('/kds');
    await expect(page).toHaveURL(/\/kds$/);
    await expect(page.getByRole('heading', { name: 'Kitchen Display System' })).toBeVisible();

    await page.goto('/hr');
    await expect(page).toHaveURL(/\/hr$/);
    await expect(page.getByRole('heading', { name: 'Human Resources' })).toBeVisible();

    await page.goto('/avis');
    await expect(page).toHaveURL(/\/avis$/);
    await expect(page.getByRole('heading', { name: 'Client Sentiment' })).toBeVisible();

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('button', { name: 'Deploy Changes' })).toBeVisible();

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/tables/999/', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ id: 999, numero: '999', statut: 'LIBRE' }) });
    });

    await page.goto('/ordering/999');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/ordering\/999$/);
    await expect(page.getByText('Active Ticket')).toBeVisible({ timeout: 15000 });
  });

  test('creates, edits, and deletes a category', async ({ page }) => {
    const unique = Date.now();
    const initialName = `PW Category ${unique}`;
    const updatedName = `${initialName} Updated`;
    let categories = [];

    await page.route('**/api/categories/', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const newCat = { id: 3000, nom: initialName, description: '...', ordre_affichage: 91, est_active: true };
        categories.push(newCat);
        await route.fulfill({ status: 201, body: JSON.stringify(newCat) });
      } else if (method === 'GET') {
        await route.fulfill({ status: 200, body: JSON.stringify(categories) });
      }
    });

    await page.route('**/api/categories/3000/', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        categories[0].nom = updatedName;
        await route.fulfill({ status: 200, body: JSON.stringify(categories[0]) });
      } else if (method === 'DELETE') {
        categories = [];
        await route.fulfill({ status: 204 });
      }
    });

    await page.goto('/categories');
    await page.getByTestId('category-create-button').click();
    await page.getByTestId('category-name-input').fill(initialName);
    await page.getByTestId('category-description-input').fill('Playwright seeded category for browser CRUD coverage.');
    await page.getByTestId('category-order-input').fill('91');
    await page.getByTestId('category-save-button').click();
    
    const createdCard = page.getByTestId('category-card-3000');
    await expect(createdCard).toBeVisible();
    await expect(createdCard).toContainText(initialName);
    
    await createdCard.hover();
    await page.getByTestId('category-edit-3000').click();
    await page.getByTestId('category-name-input').fill(updatedName);
    await page.getByTestId('category-save-button').click();
    await expect(page.getByTestId('category-name-input')).toBeHidden();

    const updatedCard = page.getByTestId('category-card-3000');
    await expect(updatedCard).toContainText(updatedName);
    
    await updatedCard.hover();
    await page.getByTestId('category-delete-3000').click({ force: true });
    await expect(page.getByTestId('category-card-3000')).toBeHidden();
  });

  test('creates a category with an uploaded image and renders the saved thumbnail', async ({ page }) => {
    const initialName = `PW Image Category ${Date.now()}`;
    let categories = [];

    await page.route('**/api/categories/', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const payload = route.request().postDataBuffer()?.toString('utf8') ?? '';
        expect(payload).toContain('name="image"');
        expect(payload).toContain(`filename="${uploadedPng.name}"`);

        const newCategory = {
          id: 3010,
          nom: initialName,
          description: 'Image-backed category',
          ordre_affichage: 12,
          est_active: true,
          image: '/media/categories/pw-image-category.png',
        };
        categories = [newCategory];
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newCategory) });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(categories) });
    });

    await page.goto('/categories');
    await page.getByTestId('category-create-button').click();
    await page.getByTestId('category-name-input').fill(initialName);
    await page.getByTestId('category-description-input').fill('Category with uploaded media coverage.');
    await page.getByTestId('category-order-input').fill('12');
    await page.getByTestId('category-image-input').setInputFiles(uploadedPng);

    await expect(page.getByTestId('category-image-preview')).toBeVisible();
    await page.getByTestId('category-save-button').click();

    const createdCard = page.getByTestId('category-card-3010');
    await expect(createdCard).toContainText(initialName);
    await expect(createdCard.getByRole('img', { name: initialName })).toHaveAttribute('src', /pw-image-category\.png/);
  });

  test('replaces an existing category image without leaving a stale thumbnail behind', async ({ page }) => {
    let categories = [
      {
        id: 4010,
        nom: 'Media Starters',
        description: 'Initial category art',
        ordre_affichage: 4,
        est_active: true,
        image: '/media/categories/original-category.png',
      },
    ];

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(categories) });
    });

    await page.route('**/api/categories/4010/', async (route) => {
      const payload = route.request().postDataBuffer()?.toString('utf8') ?? '';
      expect(payload).toContain('name="image"');
      expect(payload).toContain(`filename="${uploadedPng.name}"`);

      categories = [{ ...categories[0], image: '/media/categories/replaced-category.png' }];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(categories[0]) });
    });

    await page.goto('/categories');
    const categoryCard = page.getByTestId('category-card-4010');
    await expect(categoryCard.getByRole('img', { name: 'Media Starters' })).toHaveAttribute('src', /original-category\.png/);

    await page.getByTestId('category-edit-4010').click();
    await page.getByTestId('category-image-input').setInputFiles(uploadedPng);
    await expect(page.getByTestId('category-image-preview')).toBeVisible();
    await page.getByTestId('category-save-button').click();

    await expect(categoryCard.getByRole('img', { name: 'Media Starters' })).toHaveAttribute('src', /replaced-category\.png/);
  });

  test('creates, edits, and deletes a plat', async ({ page }) => {
    const unique = Date.now();
    const initialName = `PW Plat ${unique}`;
    const updatedName = `${initialName} Updated`;
    let plats = [];

    await page.route('**/api/plats/', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const newPlat = { id: 7000, nom: initialName, description: '...', prix: '77.00', temps_preparation: 18, categorie: 1, est_active: true, est_disponible: true };
        plats.push(newPlat);
        await route.fulfill({ status: 201, body: JSON.stringify(newPlat) });
      } else if (method === 'GET') {
        await route.fulfill({ status: 200, body: JSON.stringify(plats) });
      }
    });

    await page.route('**/api/plats/7000/', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        plats[0].nom = updatedName;
        await route.fulfill({ status: 200, body: JSON.stringify(plats[0]) });
      } else if (method === 'DELETE') {
        plats = [];
        await route.fulfill({ status: 204 });
      }
    });

    await page.goto('/menu');
    await page.getByTestId('plat-create-button').click();
    await page.getByTestId('plat-name-input').fill(initialName);
    await page.getByTestId('plat-price-input').fill('77.00');
    await page.getByTestId('plat-save-button').click();
    
    const createdCard = page.getByTestId('plat-card-7000');
    await expect(createdCard).toBeVisible();
    await expect(createdCard).toContainText(initialName);
    
    await createdCard.hover();
    await page.getByTestId('plat-edit-7000').click();
    await page.getByTestId('plat-name-input').fill(updatedName);
    await page.getByTestId('plat-save-button').click();
    await expect(page.getByTestId('plat-name-input')).toBeHidden();

    const updatedCard = page.getByTestId('plat-card-7000');
    await expect(updatedCard).toContainText(updatedName);
    
    await updatedCard.hover();
    await page.getByTestId('plat-delete-7000').click({ force: true });
    await expect(page.getByTestId('plat-card-7000')).toBeHidden();
  });

  test('creates a plat with an uploaded image and refreshes the registry card', async ({ page }) => {
    const initialName = `PW Image Plat ${Date.now()}`;
    let plats = [];

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const payload = route.request().postDataBuffer()?.toString('utf8') ?? '';
        expect(payload).toContain('name="image"');
        expect(payload).toContain(`filename="${uploadedPng.name}"`);

        const newPlat = {
          id: 7010,
          nom: initialName,
          description: 'Image-backed plat',
          prix: '61.00',
          temps_preparation: 18,
          categorie: 1,
          image: '/media/plats/pw-image-plat.png',
          est_active: true,
          est_disponible: true,
        };
        plats = [newPlat];
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newPlat) });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plats) });
    });

    await page.route('**/api/stock/ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/stock/plat-ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/menu');
    await page.getByTestId('plat-create-button').click();
    await page.getByTestId('plat-name-input').fill(initialName);
    await page.getByTestId('plat-price-input').fill('61.00');
    await page.getByTestId('plat-image-input').setInputFiles(uploadedPng);

    await expect(page.getByText('FILE LOADED')).toBeVisible();
    await page.getByTestId('plat-save-button').click();

    const createdCard = page.getByTestId('plat-card-7010');
    await expect(createdCard).toContainText(initialName);
    await expect(createdCard.getByRole('img', { name: initialName })).toHaveAttribute('src', /pw-image-plat\.png/);
  });

  test('replaces an existing plat image without leaving stale media in the registry', async ({ page }) => {
    let plats = [
      {
        id: 7110,
        nom: 'Tagine Atlas',
        description: 'Original art',
        prix: '88.00',
        temps_preparation: 25,
        categorie: 1,
        image: '/media/plats/original-plat.png',
        est_active: true,
        est_disponible: true,
      },
    ];

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plats) });
    });

    await page.route('**/api/stock/ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/stock/plat-ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/plats/7110/', async (route) => {
      const payload = route.request().postDataBuffer()?.toString('utf8') ?? '';
      expect(payload).toContain('name="image"');
      expect(payload).toContain(`filename="${uploadedPng.name}"`);

      plats = [{ ...plats[0], image: '/media/plats/replaced-plat.png' }];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plats[0]) });
    });

    await page.goto('/menu');
    const platCard = page.getByTestId('plat-card-7110');
    await expect(platCard.getByRole('img', { name: 'Tagine Atlas' })).toHaveAttribute('src', /original-plat\.png/);

    await page.getByTestId('plat-edit-7110').click();
    await page.getByTestId('plat-image-input').setInputFiles(uploadedPng);
    await expect(page.getByText('FILE LOADED')).toBeVisible();
    await page.getByTestId('plat-save-button').click();

    await expect(platCard.getByRole('img', { name: 'Tagine Atlas' })).toHaveAttribute('src', /replaced-plat\.png/);
  });

  test('resets category create drafts when the modal is reopened', async ({ page }) => {
    await page.goto('/categories');
    await page.getByTestId('category-create-button').click();
    await page.getByTestId('category-name-input').fill('Transient category');
    await page.getByTestId('category-description-input').fill('This draft should be discarded.');
    await page.getByTestId('category-order-input').fill('42');
    await page.getByTestId('close-editor').click();
    await expect(page.getByTestId('category-name-input')).toHaveCount(0);

    await page.getByTestId('category-create-button').click();
    await expect(page.getByTestId('category-name-input')).toHaveValue('');
    await expect(page.getByTestId('category-description-input')).toHaveValue('');
    const orderValue = await page.getByTestId('category-order-input').inputValue();
    expect(parseInt(orderValue)).toBeGreaterThan(0);
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

  test('keeps the category image draft recoverable when the upload save fails', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'category image write failed' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/categories');
    await page.getByTestId('category-create-button').click();
    await page.getByTestId('category-name-input').fill('Broken image category');
    await page.getByTestId('category-order-input').fill('14');
    await page.getByTestId('category-image-input').setInputFiles(uploadedPng);
    await page.getByTestId('category-save-button').click();

    await expect(page.getByText('Failed to save category')).toBeVisible();
    await expect(page.getByTestId('category-name-input')).toHaveValue('Broken image category');
    await expect(page.getByTestId('category-image-preview')).toBeVisible();
  });

  test('keeps the category editor state intact when an edit request fails', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 4001, nom: 'Starters', description: 'Opening line', ordre_affichage: 1, est_active: true, image: null },
        ]),
      });
    });

    await page.route('**/api/categories/4001/', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'category update failed' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/categories');
    await page.getByTestId('category-edit-4001').click();
    await page.getByTestId('category-name-input').fill('Renamed starters');
    await page.getByTestId('category-description-input').fill('Updated draft that should remain visible.');
    await page.getByTestId('category-order-input').fill('8');
    await page.getByTestId('category-save-button').click();

    await expect(page.getByText('Failed to save category')).toBeVisible();
    await expect(page.getByTestId('category-name-input')).toHaveValue('Renamed starters');
    await expect(page.getByTestId('category-description-input')).toHaveValue('Updated draft that should remain visible.');
    await expect(page.getByTestId('category-order-input')).toHaveValue('8');
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

    await expect(page.getByText('Commit failed')).toBeVisible();
    await expect(page.getByTestId('plat-name-input')).toHaveValue('Broken plat draft');
    await expect(page.getByTestId('plat-price-input')).toHaveValue('31.50');
    await expect(page.getByTestId('plat-description-input')).toHaveValue('This draft should survive a failing save.');
  });

  test('keeps the plat image draft recoverable when the upload save fails', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'plat image write failed' }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/stock/ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/stock/plat-ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/menu');
    await page.getByTestId('plat-create-button').click();
    await page.getByTestId('plat-name-input').fill('Broken image plat');
    await page.getByTestId('plat-price-input').fill('43.00');
    await page.getByTestId('plat-image-input').setInputFiles(uploadedPng);
    await page.getByTestId('plat-save-button').click();

    await expect(page.getByText('Commit failed')).toBeVisible();
    await expect(page.getByTestId('plat-name-input')).toHaveValue('Broken image plat');
    await expect(page.getByText('FILE LOADED')).toBeVisible();
  });

  test('keeps plat edits visible when an update request fails', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 7101, nom: 'Tagine Royal', description: 'Existing dish', prix: '88.00', temps_preparation: 18, categorie: 1, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/stock/ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/stock/plat-ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/plats/7101/', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'plat update failed' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/menu');
    await page.getByTestId('plat-edit-7101').click();
    await page.getByTestId('plat-name-input').fill('Tagine Royal Deluxe');
    await page.getByTestId('plat-price-input').fill('92.00');
    await page.getByTestId('plat-save-button').click();

    await expect(page.getByText('Commit failed')).toBeVisible();
    await expect(page.getByTestId('plat-name-input')).toHaveValue('Tagine Royal Deluxe');
    await expect(page.getByTestId('plat-price-input')).toHaveValue('92.00');
  });

  test('does not remove a plat card when delete fails', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 7201, nom: 'Rfissa Maison', description: 'Stable row', prix: '74.00', temps_preparation: 20, categorie: 1, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/stock/ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/stock/plat-ingredients/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/plats/7201/', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'delete failed' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/menu');
    await page.getByTestId('plat-card-7201').hover();
    await page.getByTestId('plat-delete-7201').click();

    await expect(page.getByText('Deletion error')).toBeVisible();
    await expect(page.getByTestId('plat-card-7201')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rfissa Maison' })).toBeVisible();
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
    await expect(page.getByText('CRITICAL: UNAVAILABLE.')).toBeVisible();
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
    await page.getByLabel('Trading Name').fill('Playwright Bistro');
    await page.getByLabel('Restaurant Description').fill('Saved from E2E');
    await page.getByRole('button', { name: 'Deploy Changes' }).click();

    await expect(page.getByText('System parameters deployed')).toBeVisible();
    await expect(page.getByLabel('Trading Name')).toHaveValue('Playwright Bistro');
    await expect(page.getByLabel('Restaurant Description')).toHaveValue('Saved from E2E');
  });

  test('persists partial settings edits after a successful save', async ({ page }) => {
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
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...settingsPayload,
          nom: body.nom,
          telephone: body.telephone,
          description: settingsPayload.description,
          adresse: settingsPayload.adresse,
        }),
      });
    });

    await page.goto('/settings');
    await page.getByLabel('Trading Name').fill('Playwright Ops');
    await page.getByLabel('Primary Contact').fill('+212611111111');
    await page.getByRole('button', { name: 'Deploy Changes' }).click();

    await expect(page.getByText('System parameters deployed')).toBeVisible();
    await expect(page.getByLabel('Trading Name')).toHaveValue('Playwright Ops');
    await expect(page.getByLabel('Primary Contact')).toHaveValue('+212611111111');
    await expect(page.getByLabel('Restaurant Description')).toHaveValue('Base config');
  });

  test('keeps saved settings visible after a reload', async ({ page }) => {
    let settingsPayload = {
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
      settingsPayload = {
        ...settingsPayload,
        nom: 'Reload Safe Ops',
        description: 'Persisted through reload',
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(settingsPayload),
      });
    });

    await page.goto('/settings');
    await page.getByLabel('Trading Name').fill('Reload Safe Ops');
    await page.getByLabel('Restaurant Description').fill('Persisted through reload');
    await page.getByRole('button', { name: 'Deploy Changes' }).click();

    await expect(page.getByLabel('Trading Name')).toHaveValue('Reload Safe Ops');
    await page.reload();

    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByLabel('Trading Name')).toHaveValue('Reload Safe Ops');
    await expect(page.getByLabel('Restaurant Description')).toHaveValue('Persisted through reload');
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
    await page.getByLabel('Trading Name').fill('Broken save');
    await page.getByRole('button', { name: 'Deploy Changes' }).click();

    await expect(page.getByText('Deployment failure')).toBeVisible();
    await expect(page.getByLabel('Trading Name')).toHaveValue('Broken save');
  });

  test('keeps dirty settings inputs after a failed partial save', async ({ page }) => {
    await page.route('**/api/settings/1/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'settings write failed' }),
      });
    });

    await page.goto('/settings');
    await page.getByLabel('Trading Name').fill('Dirty config');
    await page.getByLabel('Primary Contact').fill('+212622222222');
    await page.getByRole('button', { name: 'Deploy Changes' }).click();

    await expect(page.getByText('Deployment failure')).toBeVisible();
    await expect(page.getByLabel('Trading Name')).toHaveValue('Dirty config');
    await expect(page.getByLabel('Primary Contact')).toHaveValue('+212622222222');
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
    await expect(page.getByText('NO STAFF RECORDS FOUND')).toBeVisible();
    await page.getByRole('button', { name: /EXPORT ROSTER/ }).click();
    await expect(page.getByText('GENERATING_EXPORT_STREAM')).toBeVisible();
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
    await expect(page.getByText('NO FEEDBACK DATA LOGGED')).toBeVisible();
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
    await expect(page.getByText('CRITICAL DEPLETION', { exact: true })).toBeVisible();
  });

  test('renders populated stock data and keeps search plus editor interactions stable', async ({ page }) => {
    await page.route('**/api/stock/ingredients/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 9101, nom: 'Safran Atlas', unite_mesure: 'g', stock_actuel: '4.00', seuil_alerte: '6.00', est_active: true },
          { id: 9102, nom: 'Huile Olive', unite_mesure: 'ml', stock_actuel: '22.00', seuil_alerte: '5.00', est_active: true },
        ]),
      });
    });

    await page.goto('/stock');
    await expect(page.getByText('Safran Atlas')).toBeVisible();
    await expect(page.getByText('Huile Olive')).toBeVisible();

    const searchInput = page.getByPlaceholder('RESOURCE LOOKUP...');
    await searchInput.fill('huile');
    await expect(page.getByText('Huile Olive')).toBeVisible();
    await expect(page.getByText('Safran Atlas')).toHaveCount(0);

    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(page.getByRole('heading', { name: 'New Resource' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Commit Record' })).toBeVisible();
  });

  test('renders populated hr data and filters by search plus role tab', async ({ page }) => {
    await page.route('**/api/employes/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, username: 'amina', poste: 'SERVEUR' },
          { id: 2, username: 'youssef', poste: 'CUISINIER' },
          { id: 3, username: 'nadia', poste: 'GERANT' },
        ]),
      });
    });

    await page.goto('/hr');
    await expect(page.getByRole('heading', { name: 'amina' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'youssef' })).toBeVisible();

    await page.getByRole('button', { name: 'CUISINIER' }).click();
    await expect(page.getByRole('heading', { name: 'youssef' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'amina' })).toHaveCount(0);

    await page.getByPlaceholder('SEARCH BY NAME, ROLE, OR ID...').fill('nadia');
    await page.getByRole('button', { name: 'GERANT' }).click();
    await expect(page.getByRole('heading', { name: 'nadia' })).toBeVisible();
  });

  test('renders populated avis data and filters by guest identity and comment text', async ({ page }) => {
    await page.route('**/api/avis/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 101, note: 5, commentaire: 'Excellent service and timing', user_username: 'samira', sentiment_score: 22, created_at: '2026-05-22T10:00:00Z' },
          { id: 102, note: 2, commentaire: 'Dessert arrived cold', user_username: 'mehdi', sentiment_score: -14, created_at: '2026-05-21T10:00:00Z' },
        ]),
      });
    });

    await page.goto('/avis');
    await expect(page.getByText('samira')).toBeVisible();
    await expect(page.getByText('mehdi')).toBeVisible();

    const searchInput = page.getByPlaceholder('FILTER ENTRIES...');
    await searchInput.fill('cold');
    await expect(page.getByText('Dessert arrived cold')).toBeVisible();
    await expect(page.getByText('Excellent service and timing')).toHaveCount(0);

    await searchInput.fill('samira');
    await expect(page.getByText('Excellent service and timing')).toBeVisible();
    await expect(page.getByText('Dessert arrived cold')).toHaveCount(0);
  });

  test('renders manager dashboard KPIs from deterministic analytics data', async ({ page }) => {
    await page.route('**/api/analytics/dashboard/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          todayRevenue: 4290,
          activeTables: 14,
          pendingOrders: 6,
          avgPrepTime: 18,
          revenue7Days: [],
          topDishes: [],
        }),
      });
    });

    await page.goto('/');
    await expect(page.getByText('4290 DH')).toBeVisible();
    await expect(page.getByText('50%')).toBeVisible();
    await expect(page.getByText('6')).toBeVisible();
    await expect(page.getByText(/^18m$/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live Orchestration Feed' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Floor Plan Preview' })).toBeVisible();
  });

  test('shows the dashboard fallback state when analytics loading fails', async ({ page }) => {
    await page.route('**/api/analytics/dashboard/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'analytics offline' }),
      });
    });

    await page.goto('/');
    await expect(page.getByText('Data registry offline.')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('keeps maintenance controls available for gerant users', async ({ page }) => {
    await page.goto('/maintenance');

    await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Logs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manual Sync/i })).toBeVisible();
    await expect(page.getByText('API Gateway')).toBeVisible();
    await expect(page.getByText('Degraded')).toBeVisible();
    await expect(page.getByText('1-800-TASTIFY')).toBeVisible();
  });

  test('renders delivery hub controls and lets manager users search the dispatch surface', async ({ page }) => {
    await page.goto('/delivery');

    await expect(page.getByRole('heading', { name: 'DELIVERY HUB' })).toBeVisible();
    await expect(page.getByText('OFF-PREMISE REVENUE')).toBeVisible();
    await expect(page.getByText('#UBR-8812')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage' })).toHaveCount(3);

    const searchInput = page.getByPlaceholder('Search orders...');
    await searchInput.fill('GLV-0492');
    await expect(searchInput).toHaveValue('GLV-0492');

    await page.getByRole('button', { name: 'All Active (14)' }).click();
    await expect(page.getByText('Audit Dispatch Log')).toBeVisible();
  });

  test('has no critical or serious axe violations on the manager dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Live Orchestration Feed' })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps the dashboard usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const menuButton = page.getByRole('button', { name: 'Open navigation menu' });
    await menuButton.click();

    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-settings')).toBeVisible();
  });
});
