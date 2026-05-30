import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const expectNoBlockingViolations = async (page: Parameters<typeof test>[0]['page']) => {
  const results = await new AxeBuilder({ page }).include('main').analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    impact === 'critical' || impact === 'serious',
  );

  expect(blockingViolations).toEqual([]);
};

const installMockStaffWebSocket = async (page: Parameters<typeof test>[0]['page']) => {
  await page.addInitScript(() => {
    class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      url: string;
      readyState = MockWebSocket.CONNECTING;
      onopen: ((event?: unknown) => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onclose: ((event: { code: number; reason: string }) => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(url: string) {
        this.url = url;
        (window as any).__staffSockets = (window as any).__staffSockets || [];
        (window as any).__staffSockets.push(this);
        queueMicrotask(() => {
          this.readyState = MockWebSocket.OPEN;
          this.onopen?.({});
        });
      }

      send() {}

      close(code = 1000, reason = '') {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code, reason });
      }

      emit(payload: unknown) {
        this.onmessage?.({ data: JSON.stringify(payload) });
      }
    }

    (window as any).__emitStaffSocketMessage = (payload: unknown) => {
      const sockets = (window as any).__staffSockets || [];
      const socket = sockets[sockets.length - 1];
      if (!socket) {
        throw new Error('No mock staff socket available');
      }
      socket.emit(payload);
    };

    (window as any).WebSocket = MockWebSocket;
  });
};

const emitStaffSocketMessage = async (page: Parameters<typeof test>[0]['page'], payload: unknown) => {
  await page.evaluate((message) => {
    (window as any).__emitStaffSocketMessage(message);
  }, payload);
};

const mockKitchenMenuCatalog = async (page: Parameters<typeof test>[0]['page'], plats: unknown[]) => {
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
      body: JSON.stringify(plats),
    });
  });

  await page.route('**/api/stock/ingredients/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/stock/plat-ingredients/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
};

test.describe('cuisinier browser workflows', () => {
  test('lands on the kds route and only sees kitchen navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/kds$/);
    await expect(page.getByRole('heading', { name: /Écran Cuisine/i })).toBeVisible();

    await expect(page.getByTestId('nav-menu')).toBeVisible();
    await expect(page.getByTestId('nav-kds')).toBeVisible();
    await expect(page.getByTestId('nav-reservations')).toHaveCount(0);
    await expect(page.getByTestId('nav-categories')).toHaveCount(0);
    await expect(page.getByTestId('nav-dashboard')).toHaveCount(0);
  });

  test('keeps the menu nav active after a direct route load', async ({ page }) => {
    await mockKitchenMenuCatalog(page, []);
    await page.goto('/menu');

    await expect(page).toHaveURL(/\/menu$/);
    await expect(page.getByTestId('nav-menu')).toHaveClass(/border-primary/);
    await expect(page.getByRole('heading', { name: 'Menu Operations' })).toBeVisible();
  });

  test('keeps cuisinier users on allowed routes and redirects forbidden ones', async ({ page }) => {
    await page.goto('/menu');
    await expect(page).toHaveURL(/\/menu$/);
    await expect(page.getByRole('heading', { name: 'Menu Operations' })).toBeVisible();

    for (const forbiddenPath of ['/categories', '/stock', '/hr', '/avis', '/settings', '/salle', '/reservations', '/ordering/1']) {
      await page.goto(forbiddenPath);
      await expect(page).toHaveURL(/\/kds$/);
    }
  });

  test('redirects an authenticated cuisinier away from login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/kds$/);
  });

  test('keeps cuisinier logout working after visiting a secondary route', async ({ page }) => {
    await mockKitchenMenuCatalog(page, []);
    await page.goto('/menu');
    await expect(page).toHaveURL(/\/menu$/);

    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('keeps cuisinier users on the same allowed route after a hard refresh', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/kds');
    await page.reload();

    await expect(page).toHaveURL(/\/kds$/);
    await expect(page.getByRole('heading', { name: /Écran Cuisine/i })).toBeVisible();
  });

  test('lets cuisinier users search and filter the menu registry', async ({ page }) => {
    await mockKitchenMenuCatalog(page, [
      { id: 701, nom: 'Tagine Safran', prix: '96.00', description: 'Slow finish', temps_preparation: 22, categorie: 1, image: null, est_active: true, est_disponible: true },
      { id: 702, nom: 'Tarte Orange', prix: '28.00', description: 'Citrus finish', temps_preparation: 8, categorie: 2, image: null, est_active: true, est_disponible: true },
    ]);

    await page.goto('/menu');

    await expect(page.getByRole('heading', { name: 'Tagine Safran' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tarte Orange' })).toBeVisible();

    const searchInput = page.getByPlaceholder('SEARCH CATALOG...');
    await searchInput.fill('orange');
    await expect(page.getByRole('heading', { name: 'Tarte Orange' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tagine Safran' })).toHaveCount(0);

    await searchInput.fill('');
    await page.getByRole('button', { name: /Filter/i }).click();
    await expect(page.getByRole('heading', { name: 'Tagine Safran' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tarte Orange' })).toBeVisible();
  });

  test('shows the menu empty state shell when no dishes are returned', async ({ page }) => {
    await mockKitchenMenuCatalog(page, []);

    await page.goto('/menu');

    await expect(page.getByText('Active Record Count: 0')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Dish/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Filter/i })).toBeVisible();
    await expect(page.getByText('Signature Dish')).toBeVisible();
  });

  test('has no critical or serious axe violations on the menu registry', async ({ page }) => {
    await mockKitchenMenuCatalog(page, [
      { id: 731, nom: 'Briouate Signature', prix: '26.00', description: 'Crisp line', temps_preparation: 9, categorie: 1, image: null, est_active: true, est_disponible: true },
    ]);

    await page.goto('/menu');

    await expect(page.getByRole('heading', { name: 'Briouate Signature' })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('renders the KDS empty state when no active kitchen tickets exist', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Sector Clear').first()).toBeVisible();
  });

  test('has no critical or serious axe violations on the KDS page', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Sector Clear').first()).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps the KDS page usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');

    const menuButton = page.getByRole('button', { name: 'Open navigation menu' });
    await menuButton.click();

    await expect(page.getByTestId('nav-kds')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Écran Cuisine/i })).toBeVisible();
  });

  test('advances a kitchen ticket from waiting to preparation and ready', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9201,
            statut: 'EN_CUISINE',
            table_numero: 7,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T11:45:00Z',
            lignes: [
              {
                id: 8801,
                plat_nom: 'Risotto safran',
                quantite: 2,
                statut: 'EN_ATTENTE',
                notes: 'Sans parmesan',
                heure_lancement: '2026-05-19T11:46:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.route('**/api/commandelignes/8801/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 8801, statut: route.request().postDataJSON().statut }),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Risotto safran')).toBeVisible();
    await expect(page.getByText('Sans parmesan')).toBeVisible();

    const ticket = page.getByTestId('kds-ticket-9201');
    await page.getByText('Risotto safran').click();
    await expect(ticket.getByText('In Preparation')).toBeVisible();

    await page.getByText('Risotto safran').click();
    await expect(ticket.getByText('DONE')).toBeVisible();
    await expect(page.getByText('Ready to Window')).toBeVisible();
  });

  test('does not advance KDS item state when the backend update fails', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9301,
            statut: 'EN_CUISINE',
            table_numero: 2,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T11:55:00Z',
            lignes: [
              {
                id: 8901,
                plat_nom: 'Pastilla poulet',
                quantite: 1,
                statut: 'EN_ATTENTE',
                notes: '',
                heure_lancement: '2026-05-19T11:56:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.route('**/api/commandelignes/8901/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'update failed' }),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    await page.getByText('Pastilla poulet').click();
    await expect(page.getByText('EN ATTENTE')).toHaveCount(0);
    await expect(page.getByText('DONE')).toHaveCount(0);
  });

  test('shows completion only for tickets whose every line is ready', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9401,
            statut: 'EN_CUISINE',
            table_numero: 9,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:10:00Z',
            lignes: [
              {
                id: 9001,
                plat_nom: 'Harira',
                quantite: 1,
                statut: 'PRET',
                notes: '',
                heure_lancement: '2026-05-19T12:11:00Z',
              },
              {
                id: 9002,
                plat_nom: 'Brochettes',
                quantite: 2,
                statut: 'EN_PREPARATION',
                notes: '',
                heure_lancement: '2026-05-19T12:12:00Z',
              },
            ],
          },
          {
            id: 9402,
            statut: 'PRETE',
            table_numero: 10,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:15:00Z',
            lignes: [
              {
                id: 9010,
                plat_nom: 'Rfissa',
                quantite: 1,
                statut: 'PRET',
                notes: 'Extra chaud',
                heure_lancement: '2026-05-19T12:16:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    const firstTicket = page.getByTestId('kds-ticket-9401');
    const secondTicket = page.getByTestId('kds-ticket-9402');

    await expect(firstTicket.getByText('Harira')).toBeVisible();
    await expect(firstTicket.getByText('Brochettes')).toBeVisible();
    await expect(firstTicket.getByText('DONE')).toHaveCount(0);

    await expect(secondTicket.getByText('Rfissa')).toBeVisible();
    await expect(secondTicket.getByText('DONE')).toBeVisible();
    await expect(secondTicket.getByText('Extra chaud')).toBeVisible();
  });

  test('marks only the updated ticket complete when its last active line becomes ready', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9501,
            statut: 'EN_CUISINE',
            table_numero: 4,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:20:00Z',
            lignes: [
              {
                id: 9101,
                plat_nom: 'Tajine agneau',
                quantite: 1,
                statut: 'PRET',
                notes: '',
                heure_lancement: '2026-05-19T12:21:00Z',
              },
              {
                id: 9102,
                plat_nom: 'Legumes rôtis',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: '',
                heure_lancement: '2026-05-19T12:22:00Z',
              },
            ],
          },
          {
            id: 9502,
            statut: 'EN_CUISINE',
            table_numero: 6,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:25:00Z',
            lignes: [
              {
                id: 9111,
                plat_nom: 'Haricots verts',
                quantite: 1,
                statut: 'PRET',
                notes: '',
                heure_lancement: '2026-05-19T12:26:00Z',
              },
              {
                id: 9112,
                plat_nom: 'Filet poisson',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: 'Sauce a part',
                heure_lancement: '2026-05-19T12:27:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.route('**/api/commandelignes/9102/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 9102, statut: route.request().postDataJSON().statut }),
      });
    });

    await page.route('**/api/commandelignes/9112/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 9112, statut: route.request().postDataJSON().statut }),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    const firstTicket = page.getByTestId('kds-ticket-9501');
    const secondTicket = page.getByTestId('kds-ticket-9502');

    await expect(firstTicket.getByText('DONE')).toHaveCount(0);
    await expect(secondTicket.getByText('DONE')).toHaveCount(0);

    await firstTicket.getByText('Legumes rôtis').click();

    await expect(firstTicket.getByText('Legumes rôtis')).toBeVisible();
    await expect(firstTicket.getByText('DONE')).toBeVisible();

    await expect(secondTicket.getByText('Filet poisson')).toBeVisible();
    await expect(secondTicket.getByText('DONE')).toHaveCount(0);
  });

  test('keeps sibling tickets unchanged when one KDS mutation fails', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9601,
            statut: 'EN_CUISINE',
            table_numero: 11,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:35:00Z',
            lignes: [
              {
                id: 9201,
                plat_nom: 'Couscous legumes',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: '',
                heure_lancement: '2026-05-19T12:36:00Z',
              },
            ],
          },
          {
            id: 9602,
            statut: 'EN_CUISINE',
            table_numero: 12,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:40:00Z',
            lignes: [
              {
                id: 9211,
                plat_nom: 'Poisson chermoula',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: 'Sans sel',
                heure_lancement: '2026-05-19T12:41:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.route('**/api/commandelignes/9201/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'update failed' }),
      });
    });

    await page.route('**/api/commandelignes/9211/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 9211, statut: route.request().postDataJSON().statut }),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    const firstTicket = page.getByTestId('kds-ticket-9601');
    const secondTicket = page.getByTestId('kds-ticket-9602');

    await firstTicket.getByText('Couscous legumes').click();

    await expect(firstTicket.getByText('Couscous legumes')).toBeVisible();
    await expect(firstTicket.getByText('DONE')).toHaveCount(0);

    await expect(secondTicket.getByText('Poisson chermoula')).toBeVisible();
    await expect(secondTicket.getByText('Sans sel')).toBeVisible();
    await expect(secondTicket.getByText('DONE')).toHaveCount(0);
  });

  test('updates only the targeted ready button when multiple tickets expose the same action', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9701,
            statut: 'EN_CUISINE',
            table_numero: 14,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:45:00Z',
            lignes: [
              {
                id: 9301,
                plat_nom: 'Tajine pruneaux',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: '',
                heure_lancement: '2026-05-19T12:46:00Z',
              },
            ],
          },
          {
            id: 9702,
            statut: 'EN_CUISINE',
            table_numero: 15,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:47:00Z',
            lignes: [
              {
                id: 9302,
                plat_nom: 'Seffa medfouna',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: 'Cannelle extra',
                heure_lancement: '2026-05-19T12:48:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.route('**/api/commandelignes/9301/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 9301, statut: route.request().postDataJSON().statut }),
      });
    });

    await page.route('**/api/commandelignes/9302/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 9302, statut: route.request().postDataJSON().statut }),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    const firstTicket = page.getByTestId('kds-ticket-9701');
    const secondTicket = page.getByTestId('kds-ticket-9702');

    await firstTicket.getByText('Tajine pruneaux').click();

    await expect(firstTicket.getByText('DONE')).toBeVisible();

    await expect(secondTicket.getByText('Seffa medfouna')).toBeVisible();
    await expect(secondTicket.getByText('Cannelle extra')).toBeVisible();
    await expect(secondTicket.getByText('DONE')).toHaveCount(0);
  });

  test('adds a websocket-created ticket without mutating existing siblings', async ({ page }) => {
    await installMockStaffWebSocket(page);

    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9901,
            statut: 'EN_CUISINE',
            table_numero: 18,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T13:05:00Z',
            lignes: [
              {
                id: 9501,
                plat_nom: 'Harira royale',
                quantite: 1,
                statut: 'EN_ATTENTE',
                notes: '',
                heure_lancement: '2026-05-19T13:06:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    const existingTicket = page.getByTestId('kds-ticket-9901');
    await expect(existingTicket.getByText('Harira royale')).toBeVisible();

    await emitStaffSocketMessage(page, {
      type: 'order_created',
      payload: {
        order: {
          id: 9902,
          statut: 'EN_CUISINE',
          table_numero: 24,
          type: 'SUR_PLACE',
          client_nom: null,
          created_at: '2026-05-19T13:07:00Z',
          lignes: [
            {
              id: 9502,
              plat_nom: 'Wrap falafel',
              quantite: 2,
              statut: 'EN_ATTENTE',
              notes: 'Sauce a part',
              heure_lancement: '2026-05-19T13:08:00Z',
            },
          ],
        },
      },
    });

    const newTicket = page.getByTestId('kds-ticket-9902');
    await expect(newTicket.getByText('Wrap falafel')).toBeVisible();
    await expect(newTicket.getByText('Sauce a part')).toBeVisible();
    await expect(newTicket.getByText('Table #24')).toBeVisible();

    await expect(existingTicket.getByText('Harira royale')).toBeVisible();
  });

  test('applies websocket order and line updates to the matching ticket only', async ({ page }) => {
    await installMockStaffWebSocket(page);

    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9911,
            statut: 'EN_CUISINE',
            table_numero: 19,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T13:10:00Z',
            lignes: [
              {
                id: 9601,
                plat_nom: 'Couscous tfaya',
                quantite: 1,
                statut: 'EN_ATTENTE',
                notes: '',
                heure_lancement: '2026-05-19T13:11:00Z',
              },
            ],
          },
          {
            id: 9912,
            statut: 'EN_CUISINE',
            table_numero: 20,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T13:12:00Z',
            lignes: [
              {
                id: 9602,
                plat_nom: 'Briouates viande',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: 'Bien dore',
                heure_lancement: '2026-05-19T13:13:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    const firstTicket = page.getByTestId('kds-ticket-9911');
    const secondTicket = page.getByTestId('kds-ticket-9912');

    await emitStaffSocketMessage(page, {
      type: 'order_updated',
      payload: {
        order: {
          id: 9912,
          statut: 'PRETE',
          table_numero: 20,
          type: 'SUR_PLACE',
          client_nom: null,
          created_at: '2026-05-19T13:12:00Z',
          lignes: [
            {
              id: 9602,
              plat_nom: 'Briouates viande',
              quantite: 1,
              statut: 'PRET',
              notes: 'Bien dore',
              heure_lancement: '2026-05-19T13:13:00Z',
            },
          ],
        },
      },
    });

    await expect(secondTicket.getByText('DONE')).toBeVisible();
    await expect(secondTicket.getByText('Bien dore').first()).toBeVisible();

    await expect(firstTicket.getByText('Couscous tfaya')).toBeVisible();
    await expect(firstTicket.getByText('DONE')).toHaveCount(0);

    await emitStaffSocketMessage(page, {
      type: 'line_ready',
      payload: {
        ligne_id: 9601,
      },
    });

    await expect(firstTicket.getByText('DONE')).toBeVisible();
  });

  test('removes only the terminal websocket ticket while keeping siblings visible', async ({ page }) => {
    await installMockStaffWebSocket(page);

    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9921,
            statut: 'EN_CUISINE',
            table_numero: 21,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T13:15:00Z',
            lignes: [
              {
                id: 9701,
                plat_nom: 'Tagine poisson',
                quantite: 1,
                statut: 'EN_PREPARATION',
                notes: '',
                heure_lancement: '2026-05-19T13:16:00Z',
              },
            ],
          },
          {
            id: 9922,
            statut: 'EN_CUISINE',
            table_numero: 22,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T13:17:00Z',
            lignes: [
              {
                id: 9702,
                plat_nom: 'Pastilla lait',
                quantite: 1,
                statut: 'EN_ATTENTE',
                notes: 'Sucre leger',
                heure_lancement: '2026-05-19T13:18:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.goto('/kds');
    await page.waitForLoadState('networkidle');
    const removedTicket = page.getByTestId('kds-ticket-9921');
    const survivorTicket = page.getByTestId('kds-ticket-9922');

    await expect(removedTicket.getByText('Tagine poisson')).toBeVisible();
    await expect(survivorTicket.getByText('Pastilla lait')).toBeVisible();

    await emitStaffSocketMessage(page, {
      type: 'order_updated',
      payload: {
        order: {
          id: 9921,
          statut: 'PAYEE',
          table_numero: 21,
          type: 'SUR_PLACE',
          client_nom: null,
          created_at: '2026-05-19T13:15:00Z',
          lignes: [
            {
              id: 9701,
              plat_nom: 'Tagine poisson',
              quantite: 1,
              statut: 'PRET',
              notes: '',
              heure_lancement: '2026-05-19T13:16:00Z',
            },
          ],
        },
      },
    });

    await expect(page.getByTestId('kds-ticket-9921')).toHaveCount(0);
    await expect(survivorTicket.getByText('Pastilla lait')).toBeVisible();
    await expect(survivorTicket.getByText('Sucre leger')).toBeVisible();
  });
});
