import { expect, test } from '@playwright/test';
import {
  AUTHENTICATED_STORAGE_STATE,
  PARTIAL_SESSION_STORAGE_STATE,
  STALE_SESSION_STORAGE_STATE,
  mockConfig,
  mockRefreshFail,
} from './fixtures/api';

const routeReady = { waitUntil: 'domcontentloaded' } as const;

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('account journey', () => {
  test('redirects guests away from account', async ({ page }) => {
    await page.goto('/account', routeReady);
    await expect(page).toHaveURL('/login');
  });

  test.describe('authenticated account and loyalty flows', () => {
    test.use({ storageState: AUTHENTICATED_STORAGE_STATE });

    test('renders empty account state and signs the user out', async ({ page }) => {
      await page.route('**/api/reservations/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/loyalty/my_status/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: 980, tier: 'SILVER', tier_display: 'Silver Member' }),
        });
      });
      await page.route('**/api/loyalty/rewards/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/users/logout/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      });

      await page.goto('/account', routeReady);

      await expect(page.getByText('Aucune commande enregistrée')).toBeVisible();
      await expect(page.getByText(/980\s+points/i)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible();

      await page.getByRole('button', { name: 'Fermer la session', exact: true }).click();
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('heading', { name: 'Connexion.' })).toBeVisible();
    });

    test('keeps a valid stored session through refresh before logout', async ({ page }) => {
      await page.route('**/api/reservations/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/loyalty/my_status/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: 120, tier: 'BRONZE', tier_display: 'Bronze Member' }),
        });
      });
      await page.route('**/api/loyalty/rewards/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/users/logout/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      });

      await page.goto('/account', routeReady);
      await expect(page.getByText(/120\s+points/i)).toBeVisible();

      await page.reload();
      await expect(page).toHaveURL('/account');
      await expect(page.getByText(/120\s+points/i)).toBeVisible();

      await page.getByRole('button', { name: 'Fermer la session', exact: true }).click();
      await expect(page).toHaveURL('/login');
    });

    test('completes feedback submission', async ({ page }) => {
      await page.route('**/api/reservations/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 44,
              table: 8,
              date_reservation: '2026-06-08',
              heure_debut: '19:30',
              heure_fin: '21:00',
              nombre_personnes: 2,
            },
          ]),
        });
      });
      await page.route('**/api/loyalty/my_status/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: 12450, tier: 'GOLD', tier_display: 'Gold Member' }),
        });
      });
      await page.route('**/api/loyalty/rewards/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 2001, statut: 'PAYEE', montant_total: '180', created_at: '2026-06-03T12:00:00Z' },
            { id: 2000, statut: 'TERMINEE', montant_total: '95', created_at: '2026-06-01T12:00:00Z' },
          ]),
        });
      });

      let avisPayload: Record<string, unknown> | null = null;
      await page.route('**/api/avis/', async (route) => {
        avisPayload = JSON.parse(route.request().postData() ?? '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 71 }),
        });
      });

      await page.goto('/account', routeReady);

      await page.getByRole('button', { name: /Donner votre avis/i }).click();
      await page.getByPlaceholder(/Écrivez ici/i).fill('Excellent pacing and service');
      await page.getByRole('button', { name: /Transmettre mon avis/i }).click();

      await expect(page.getByText('Avis enregistré')).toBeVisible();
      await expect(avisPayload).toMatchObject({ commentaire: 'Excellent pacing and service' });
      await expect(avisPayload).not.toHaveProperty('note');
      await expect(page.getByRole('button', { name: /Transmettre mon avis/i })).toHaveCount(0);
    });

    test('keeps the feedback modal open when submission fails', async ({ page }) => {
      await page.route('**/api/reservations/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/loyalty/my_status/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: 450, tier: 'SILVER', tier_display: 'Silver Member' }),
        });
      });
      await page.route('**/api/loyalty/rewards/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 2001, statut: 'PAYEE', montant_total: '95', created_at: '2026-06-01T12:00:00Z' },
          ]),
        });
      });
      await page.route('**/api/avis/', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'boom' }),
        });
      });

      await page.goto('/account', routeReady);
      await page.getByRole('button', { name: /Donner votre avis/i }).click();
      await page.getByPlaceholder(/Écrivez ici/i).fill('Needs work');
      await page.getByRole('button', { name: /Transmettre mon avis/i }).click();

      await expect(page.getByText("Échec de l'envoi")).toBeVisible();
      await expect(page.getByRole('button', { name: /Transmettre mon avis/i })).toBeVisible();
      await expect(page.getByPlaceholder(/Écrivez ici/i)).toHaveValue('Needs work');
    });

    test('renders loyalty points, shows locked rewards, and displays unlockable rewards', async ({ page }) => {
      await page.route('**/api/loyalty/my_status/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: 1200, tier: 'SILVER', tier_display: 'Silver Member' }),
        });
      });
      await page.route('**/api/loyalty/rewards/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, nom: 'Dessert', description: 'Sweet finish', points_requis: 300, is_available: true, image: null },
            { id: 2, nom: 'Chef Table', description: 'Premium placement', points_requis: 1500, is_available: true, image: null },
            { id: 3, nom: 'Pairing', description: 'Wine pairing', points_requis: 500, is_available: true, image: null },
          ]),
        });
      });

      await page.goto('/loyalty', routeReady);

      await expect(page.getByText('1200')).toBeVisible();
      await expect(page.getByText('Verrouillé')).toBeVisible();
      await expect(page.getByRole('button', { name: 'En profiter' }).first()).toBeVisible();
    });
  });

  test.describe('stale and partial session fallbacks', () => {
    test.use({ storageState: STALE_SESSION_STORAGE_STATE });

    test('sends stale client session state back to login safely', async ({ page }) => {
      await page.goto('/account', routeReady);
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('heading', { name: 'Connexion.' })).toBeVisible();
    });
  });

  test.describe('partial client session state', () => {
    test.use({ storageState: PARTIAL_SESSION_STORAGE_STATE });

    test('treats partial client storage as logged out state', async ({ page }) => {
      await page.goto('/account', routeReady);
      await expect(page).toHaveURL('/login');

      await page.goto('/login', routeReady);
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('heading', { name: 'Connexion.' })).toBeVisible();
    });
  });
});
