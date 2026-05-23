import { expect, test } from '@playwright/test';

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
    await page.locator('input[name="nom"]').fill('Playwright Bistro');
    await page.locator('textarea[name="description"]').fill('Saved from E2E');
    await page.getByRole('button', { name: 'Deploy Changes' }).click();

    await expect(page.getByText('System parameters deployed')).toBeVisible();
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
    await page.getByRole('button', { name: 'Deploy Changes' }).click();

    await expect(page.getByText('Deployment failure')).toBeVisible();
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
});
