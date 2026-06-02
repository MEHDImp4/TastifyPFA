import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const settingsPayload = {
  id: 1,
  nom: 'Tastify Ops',
  telephone: '+212600000001',
  description: 'Refined service line',
  adresse: '12 Rue Atlas, Casablanca',
  logo: null,
};

const stockRows = [
  { id: 4101, nom: 'Safran Atlas', unite_mesure: 'g', stock_actuel: '4.00', seuil_alerte: '6.00', est_active: true },
  { id: 4102, nom: 'Huile Olive', unite_mesure: 'ml', stock_actuel: '18.00', seuil_alerte: '5.00', est_active: true },
];

const hrRows = [
  { id: 5101, username: 'Salma Floor', poste: 'SERVEUR' },
  { id: 5102, username: 'Yassine Grill', poste: 'CUISINIER' },
  { id: 5103, username: 'Leila Lead', poste: 'GERANT' },
];

const avisRows = [
  {
    id: 6101,
    note: 5,
    commentaire: 'Fast service and a calm floor handoff.',
    user_username: 'amina.guest',
    created_at: '2026-05-21T18:30:00Z',
    sentiment_score: 22,
  },
  {
    id: 6102,
    note: 3,
    commentaire: 'Dessert timing drifted but staff recovered well.',
    user_username: 'karim.guest',
    created_at: '2026-05-22T19:10:00Z',
    sentiment_score: 2,
  },
];

const salleRows = [
  { id: 1, numero: 1, capacite: 4, statut: 'LIBRE' },
  { id: 2, numero: 2, capacite: 2, statut: 'OCCUPEE', commande_active_id: 99 },
];

const reservationsRows = [
  {
    id: 7001,
    nom_client: 'Amina Refresh',
    telephone: '+212600111222',
    date_reservation: '2026-05-24',
    heure_reservation: '20:00:00',
    nombre_personnes: 4,
    statut: 'EN_ATTENTE',
    notes: 'Window table',
  },
];

const kitchenMenuRows = [
  { id: 8101, nom: 'Tagine Safran', prix: '96.00', description: 'Slow finish', temps_preparation: 22, categorie: 1, image: null, est_active: true, est_disponible: true },
];

const expectNoBlockingViolations = async (page: Parameters<typeof test>[0]['page']) => {
  const results = await new AxeBuilder({ page }).include('main').analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    impact === 'critical' || impact === 'serious',
  );

  expect(blockingViolations).toEqual([]);
};

const openNavigation = async (page: Parameters<typeof test>[0]['page']) => {
  await page.getByRole('button', { name: /open navigation menu/i }).click();
};

const expectNoUnexpectedHorizontalOverflow = async (page: Parameters<typeof test>[0]['page']) => {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;

    return (
      root.scrollWidth > root.clientWidth + 1 ||
      body.scrollWidth > body.clientWidth + 1
    );
  });

  expect(hasOverflow).toBe(false);
};

const expectVisibleLogoutControl = async (page: Parameters<typeof test>[0]['page']) => {
  const logoutButton = page.getByTestId('logout-button');
  await logoutButton.scrollIntoViewIfNeeded();
  await expect(logoutButton).toBeVisible();
};

const mockManagerSettings = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/settings/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(settingsPayload),
    });
  });
};

const mockManagerStock = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/stock/ingredients/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stockRows),
    });
  });

  await page.route('**/api/stock/plat-ingredients/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
};

const mockManagerHr = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/employes/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(hrRows),
    });
  });
};

const mockManagerAvis = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/avis/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(avisRows),
    });
  });
};

const mockSalle = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/tables/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(salleRows),
    });
  });
  await page.route('**/api/plan-texts/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
};

const mockReservations = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/reservations/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reservationsRows),
    });
  });
};

const mockKitchenMenuCatalog = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/categories/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, nom: 'Plats', ordre_affichage: 1, est_active: true },
        { id: 2, nom: 'Desserts', ordre_affichage: 2, est_active: true },
      ]),
    });
  });

  await page.route('**/api/plats/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(kitchenMenuRows),
    });
  });

  await page.route('**/api/stock/ingredients/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/stock/plat-ingredients/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
};

const mockKds = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
};

test.describe('authenticated backoffice quality coverage', () => {
  test.describe('gerant', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'gerant-chromium');
      await page.route('**/api/users/logout/', async route => {
        await route.fulfill({ status: 200 });
      });
      await page.route('**/api/users/refresh/', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access: 'test-token', role: 'GERANT', username: 'gerant_test' }),
        });
      });
      await page.route('**/api/commandes/*', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/tables/', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
    });

    test('keeps dashboard, menu operations, and settings free of blocking axe violations', async ({ page }) => {
      await mockManagerSettings(page);
      await page.route('**/api/analytics/dashboard/', async route => {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ todayRevenue: 0, activeTables: 0, pendingOrders: 0, avgPrepTime: 0, revenue7Days: [], topDishes: [] }),
        });
      });

      await page.goto('/');
      await expect(page.getByText('Live Orchestration Feed')).toBeVisible();
      await expectNoBlockingViolations(page);

      await page.goto('/menu');
      await expect(page.getByRole('heading', { name: 'Menu Operations' })).toBeVisible();
      await expectNoBlockingViolations(page);

      await page.goto('/settings');
      await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();
      await expectNoBlockingViolations(page);
    });

    test('keeps the manager shell usable on mobile and preserves active nav after refresh', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await mockManagerSettings(page);
      await page.goto('/settings');

      await expect(page).toHaveURL(/\/settings$/);
      await page.reload();
      await expect(page).toHaveURL(/\/settings$/);

      await openNavigation(page);
      await expect(page.getByTestId('nav-settings')).toBeVisible();
      await expect(page.getByTestId('nav-settings')).toHaveClass(/border-primary/);
      await expectVisibleLogoutControl(page);
    });

    test('renders deterministic stock, hr, avis, and maintenance quality surfaces', async ({ page }) => {
      await mockManagerStock(page);
      await mockManagerHr(page);
      await mockManagerAvis(page);

      await page.goto('/stock');
      await expect(page.getByRole('heading', { name: 'Inventory & Logistics' })).toBeVisible();
      await expect(page.getByText('Safran Atlas')).toBeVisible();
      await page.getByRole('button', { name: /add item/i }).click();
      await expect(page.getByRole('heading', { name: 'New Resource' })).toBeVisible();
      await page.getByRole('button', { name: /discard/i }).last().click();
      await expect(page.getByRole('heading', { name: 'New Resource' })).toHaveCount(0);

      await page.goto('/hr');
      await expect(page.getByRole('heading', { name: 'Human Resources' })).toBeVisible();
      await page.getByPlaceholder('SEARCH BY NAME, ROLE, OR ID...').fill('serveur');
      await expect(page.getByRole('heading', { name: 'Salma Floor' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Leila Lead' })).toHaveCount(0);

      await page.goto('/avis');
      await expect(page.getByRole('heading', { name: 'Client Sentiment' })).toBeVisible();
      await page.getByPlaceholder('FILTER ENTRIES...').fill('dessert');
      await expect(page.getByText('Dessert timing drifted but staff recovered well.')).toBeVisible();
      await expect(page.getByText('Fast service and a calm floor handoff.')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /dispatch response/i })).toBeVisible();

      await page.goto('/maintenance');
      await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible();
      await expect(page.getByRole('button', { name: /manual sync/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /export logs/i })).toBeVisible();
    });

    test('keeps dense manager screens readable across reduced laptop and tablet widths', async ({ page }) => {
      await mockManagerSettings(page);
      await mockManagerStock(page);
      await mockManagerHr(page);
      await mockManagerAvis(page);

      await page.setViewportSize({ width: 1180, height: 820 });
      await page.goto('/stock');
      await expect(page.getByRole('button', { name: /add item/i })).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);

      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/hr');
      await expect(page.getByRole('button', { name: 'GERANT' })).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);

      await page.setViewportSize({ width: 820, height: 1180 });
      await page.goto('/avis');
      await expect(page.getByRole('button', { name: /dispatch response/i }).first()).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);

      await page.goto('/settings');
      await expect(page.getByRole('button', { name: 'Deploy Changes' })).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
    });
  });

  test.describe('serveur', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'serveur-chromium');
      await page.route('**/api/users/logout/', async route => {
        await route.fulfill({ status: 200 });
      });
      await page.route('**/api/users/refresh/', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access: 'test-token', role: 'SERVEUR', username: 'serveur_test' }),
        });
      });
      await page.route('**/api/tables/', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/plan-texts/', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
    });

    test('keeps salle and reservations free of blocking axe violations', async ({ page }) => {
      await mockSalle(page);
      await mockReservations(page);

      await page.goto('/salle');
      await expect(page.getByText('Main Dining Area')).toBeVisible();
      await expectNoBlockingViolations(page);

      await page.goto('/reservations');
      await expect(page.getByRole('heading', { name: 'Reservations Admin' })).toBeVisible();
      await expectNoBlockingViolations(page);
    });

    test('keeps serveur mobile navigation and direct-load refresh stable', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await mockSalle(page);

      await page.goto('/salle');
      await page.reload();
      await expect(page).toHaveURL(/\/salle$/);

      await openNavigation(page);
      await expect(page.getByTestId('nav-salle')).toBeVisible();
      await expect(page.getByTestId('nav-salle')).toHaveClass(/border-primary/);
      await expectVisibleLogoutControl(page);
    });

    test('keeps dense serveur surfaces usable at laptop, tablet, and mobile widths', async ({ page }) => {
      await mockSalle(page);
      await mockReservations(page);

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/salle');
      await expect(page.getByText('Main Dining Area')).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);

      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/reservations');
      await expect(page.getByRole('heading', { name: 'Reservations Admin' })).toBeVisible();
      await expect(page.getByRole('button', { name: /confirm/i }).first()).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);

      await page.setViewportSize({ width: 430, height: 932 });
      await page.goto('/reservations');
      await expect(page.getByRole('heading', { name: 'Reservations Admin' })).toBeVisible();
      await expect(page.getByRole('button', { name: /confirm/i }).first()).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
    });
  });

  test.describe('cuisinier', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'cuisinier-chromium');
      await page.route('**/api/users/logout/', async route => {
        await route.fulfill({ status: 200 });
      });
      await page.route('**/api/users/refresh/', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access: 'test-token', role: 'CUISINIER', username: 'cuisinier_test' }),
        });
      });
    });

    test('keeps kds and menu operations free of blocking axe violations', async ({ page }) => {
      await mockKds(page);
      await mockKitchenMenuCatalog(page);

      await page.goto('/kds');
      await expect(page.getByRole('heading', { name: 'Kitchen Display System' })).toBeVisible();
      await expectNoBlockingViolations(page);

      await page.goto('/menu');
      await expect(page.getByRole('heading', { name: 'Menu Operations' })).toBeVisible();
      await expectNoBlockingViolations(page);
    });

    test('keeps the cuisinier mobile shell and refresh path usable', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await mockKds(page);

      await page.goto('/kds');
      await expect(page.getByRole('heading', { name: 'Kitchen Display System' })).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(/\/kds$/);

      await openNavigation(page);
      await expect(page.getByTestId('nav-kds')).toBeVisible();
      await expect(page.getByTestId('nav-kds')).toHaveClass(/border-primary/);
      await expectVisibleLogoutControl(page);
    });

    test('keeps kitchen flows readable on tablet and large mobile viewports', async ({ page }) => {
      await mockKds(page);
      await mockKitchenMenuCatalog(page);

      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/kds');
      await expect(page.getByRole('heading', { name: 'Kitchen Display System' })).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);

      await page.setViewportSize({ width: 430, height: 932 });
      await page.goto('/menu');
      await expect(page.getByRole('heading', { name: 'Menu Operations' })).toBeVisible();
      await expect(page.getByTestId('plat-card-8101')).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
    });
  });
});
