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
});
