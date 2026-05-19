import { expect, test } from '@playwright/test';

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

  test('renders the KDS empty state when no active kitchen tickets exist', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/kds');
    await expect(page.getByText('Kitchen is clear. No active orders.')).toBeVisible();
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
    await expect(page.getByText('Risotto safran')).toBeVisible();
    await expect(page.getByText('Sans parmesan')).toBeVisible();

    await page.getByRole('button', { name: 'Démarrer' }).click();
    await expect(page.getByText('EN PREPARATION')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Prêt' })).toBeVisible();

    await page.getByRole('button', { name: 'Prêt' }).click();
    await expect(page.getByText('PRET')).toBeVisible();
    await expect(page.getByText('Complet')).toBeVisible();
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
    await page.getByRole('button', { name: 'Démarrer' }).click();
    await expect(page.getByText('EN ATTENTE')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Démarrer' })).toBeVisible();
    await expect(page.getByText('Complet')).toHaveCount(0);
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
    const firstTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #9') }).first();
    const secondTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #10') }).first();

    await expect(firstTicket.getByText('Harira')).toBeVisible();
    await expect(firstTicket.getByText('Brochettes')).toBeVisible();
    await expect(firstTicket.getByText('Complet')).toHaveCount(0);

    await expect(secondTicket.getByText('Rfissa')).toBeVisible();
    await expect(secondTicket.getByText('Complet')).toBeVisible();
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
    const firstTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #4') }).first();
    const secondTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #6') }).first();

    await expect(firstTicket.getByText('Complet')).toHaveCount(0);
    await expect(secondTicket.getByText('Complet')).toHaveCount(0);

    await firstTicket.getByRole('button', { name: 'Prêt' }).click();

    await expect(firstTicket.getByText('Legumes rôtis')).toBeVisible();
    await expect(firstTicket.getByText('PRET')).toHaveCount(2);
    await expect(firstTicket.getByText('Complet')).toBeVisible();

    await expect(secondTicket.getByText('Filet poisson')).toBeVisible();
    await expect(secondTicket.getByText('EN PREPARATION')).toBeVisible();
    await expect(secondTicket.getByText('Complet')).toHaveCount(0);
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
    const firstTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #11') }).first();
    const secondTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #12') }).first();

    await firstTicket.getByRole('button', { name: 'Prêt' }).click();

    await expect(firstTicket.getByText('Couscous legumes')).toBeVisible();
    await expect(firstTicket.getByText('EN PREPARATION')).toBeVisible();
    await expect(firstTicket.getByText('Complet')).toHaveCount(0);

    await expect(secondTicket.getByText('Poisson chermoula')).toBeVisible();
    await expect(secondTicket.getByText('EN PREPARATION')).toBeVisible();
    await expect(secondTicket.getByRole('button', { name: 'Prêt' })).toBeVisible();
    await expect(secondTicket.getByText('Sans sel')).toBeVisible();
    await expect(secondTicket.getByText('Complet')).toHaveCount(0);
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
    const firstTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #14') }).first();
    const secondTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #15') }).first();

    await firstTicket.getByRole('button', { name: 'Prêt' }).click();

    await expect(firstTicket.getByText('PRET')).toBeVisible();
    await expect(firstTicket.getByText('Complet')).toBeVisible();

    await expect(secondTicket.getByText('Seffa medfouna')).toBeVisible();
    await expect(secondTicket.getByText('EN PREPARATION')).toBeVisible();
    await expect(secondTicket.getByRole('button', { name: 'Prêt' })).toBeVisible();
    await expect(secondTicket.getByText('Cannelle extra')).toBeVisible();
    await expect(secondTicket.getByText('Complet')).toHaveCount(0);
  });

  test('renders takeaway fallback identities and keeps them isolated from table tickets', async ({ page }) => {
    await page.route('**/api/commandes/?statut=EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 9801,
            statut: 'EN_CUISINE',
            table_numero: null,
            type: 'EMPORTER',
            client_nom: null,
            created_at: '2026-05-19T12:55:00Z',
            lignes: [
              {
                id: 9401,
                plat_nom: 'Sandwich kefta',
                quantite: 1,
                statut: 'EN_ATTENTE',
                notes: 'Sans oignons',
                heure_lancement: '2026-05-19T12:56:00Z',
              },
            ],
          },
          {
            id: 9802,
            statut: 'EN_CUISINE',
            table_numero: 16,
            type: 'SUR_PLACE',
            client_nom: null,
            created_at: '2026-05-19T12:57:00Z',
            lignes: [
              {
                id: 9402,
                plat_nom: 'Pastilla fruits de mer',
                quantite: 1,
                statut: 'EN_ATTENTE',
                notes: '',
                heure_lancement: '2026-05-19T12:58:00Z',
              },
            ],
          },
        ]),
      });
    });

    await page.goto('/kds');
    const takeawayTicket = page.locator('.double-bezel').filter({ has: page.getByText('Takeaway: Client') }).first();
    const tableTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #16') }).first();

    await expect(takeawayTicket.getByText('Sandwich kefta')).toBeVisible();
    await expect(takeawayTicket.getByText('Sans oignons')).toBeVisible();
    await expect(takeawayTicket.getByRole('button', { name: 'Démarrer' })).toBeVisible();

    await expect(tableTicket.getByText('Pastilla fruits de mer')).toBeVisible();
    await expect(tableTicket.getByText('Takeaway: Client')).toHaveCount(0);
    await expect(tableTicket.getByRole('button', { name: 'Démarrer' })).toBeVisible();
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
    const existingTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #18') }).first();
    await expect(existingTicket.getByText('Harira royale')).toBeVisible();

    await emitStaffSocketMessage(page, {
      type: 'order_created',
      payload: {
        order: {
          id: 9902,
          statut: 'EN_CUISINE',
          table_numero: null,
          type: 'EMPORTER',
          client_nom: 'Samira',
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

    const takeawayTicket = page.locator('.double-bezel').filter({ has: page.getByText('Takeaway: Samira') }).first();
    await expect(takeawayTicket.getByText('Wrap falafel')).toBeVisible();
    await expect(takeawayTicket.getByText('Sauce a part')).toBeVisible();

    await expect(existingTicket.getByText('Harira royale')).toBeVisible();
    await expect(existingTicket.getByRole('button', { name: 'Démarrer' })).toBeVisible();
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
    const firstTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #19') }).first();
    const secondTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #20') }).first();

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

    await expect(secondTicket.getByText('PRET')).toBeVisible();
    await expect(secondTicket.getByText('Complet')).toBeVisible();
    await expect(secondTicket.getByText('Bien dore')).toBeVisible();

    await expect(firstTicket.getByText('Couscous tfaya')).toBeVisible();
    await expect(firstTicket.getByText('EN ATTENTE')).toBeVisible();
    await expect(firstTicket.getByText('Complet')).toHaveCount(0);

    await emitStaffSocketMessage(page, {
      type: 'line_ready',
      payload: {
        ligne_id: 9601,
      },
    });

    await expect(firstTicket.getByText('PRET')).toBeVisible();
    await expect(firstTicket.getByText('Complet')).toBeVisible();
    await expect(secondTicket.getByText('Briouates viande')).toBeVisible();
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
    const removedTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #21') }).first();
    const survivorTicket = page.locator('.double-bezel').filter({ has: page.getByText('Table #22') }).first();

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

    await expect(page.getByText('Table #21')).toHaveCount(0);
    await expect(survivorTicket.getByText('Pastilla lait')).toBeVisible();
    await expect(survivorTicket.getByText('Sucre leger')).toBeVisible();
    await expect(survivorTicket.getByRole('button', { name: 'Démarrer' })).toBeVisible();
  });
});
