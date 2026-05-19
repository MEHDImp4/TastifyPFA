import { expect, test } from '@playwright/test';

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
});
