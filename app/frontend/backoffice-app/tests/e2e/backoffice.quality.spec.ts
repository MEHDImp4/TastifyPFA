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
    test.beforeEach(async ({}, testInfo) => {
      test.skip(testInfo.project.name !== 'gerant-chromium');
    });

    test('keeps dashboard, menu operations, and settings free of blocking axe violations', async ({ page }) => {
      await mockManagerSettings(page);

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
  });

  test.describe('serveur', () => {
    test.beforeEach(async ({}, testInfo) => {
      test.skip(testInfo.project.name !== 'serveur-chromium');
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
  });

  test.describe('cuisinier', () => {
    test.beforeEach(async ({}, testInfo) => {
      test.skip(testInfo.project.name !== 'cuisinier-chromium');
    });

    test('keeps kds and menu operations free of blocking axe violations', async ({ page }) => {
      await mockKds(page);
      await mockKitchenMenuCatalog(page);

      await page.goto('/kds');
      await page.waitForLoadState('networkidle');
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
      await page.waitForLoadState('networkidle');
      await page.reload();
      await expect(page).toHaveURL(/\/kds$/);

      await openNavigation(page);
      await expect(page.getByTestId('nav-kds')).toBeVisible();
      await expect(page.getByTestId('nav-kds')).toHaveClass(/border-primary/);
      await expectVisibleLogoutControl(page);
    });
  });
});
