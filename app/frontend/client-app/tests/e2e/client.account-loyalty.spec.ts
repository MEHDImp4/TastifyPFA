import { expect, test } from '@playwright/test';
import {
  AUTHENTICATED_STORAGE_STATE,
  PARTIAL_SESSION_STORAGE_STATE,
  STALE_SESSION_STORAGE_STATE,
  mockConfig,
  mockRefreshFail,
} from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('account journey', () => {
  test('redirects guests away from account', async ({ page }) => {
    await page.goto('/account');
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
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/users/logout/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      });

      await page.goto('/account');

      await expect(page.getByText('Registry Clear')).toBeVisible();
      await expect(page.getByText('980 PTS')).toBeVisible();
      await expect(page.getByText(/Recent Sessions/i)).toBeVisible();

      await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('heading', { name: 'Welcome Back.' })).toBeVisible();
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
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/users/logout/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      });

      await page.goto('/account');
      await expect(page.getByText('120 PTS')).toBeVisible();

      await page.reload();
      await expect(page).toHaveURL('/account');
      await expect(page.getByText('120 PTS')).toBeVisible();

      await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
      await expect(page).toHaveURL('/login');
    });

    test('shows active order settlement CTA and completes feedback submission', async ({ page }) => {
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
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 2001, statut: 'EN_COURS', montant_total: '180', created_at: '2026-06-03T12:00:00Z' },
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

      await page.goto('/account');

      await expect(page.getByRole('button', { name: /Settle Bill/i })).toBeVisible();
      await page.getByRole('button', { name: /The Culinary Dialogue/i }).click();
      await page.getByPlaceholder(/DESCRIBE THE VOYAGE/i).fill('Excellent pacing and service');
      await page.getByRole('button', { name: /Commit Analysis/i }).click();

      await expect(page.getByText('Feedback recorded')).toBeVisible();
      await expect(avisPayload).toMatchObject({ note: 5, commentaire: 'Excellent pacing and service' });
      await expect(page.getByRole('button', { name: /Commit Analysis/i })).toHaveCount(0);
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
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/avis/', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'boom' }),
        });
      });

      await page.goto('/account');
      await page.getByRole('button', { name: /The Culinary Dialogue/i }).click();
      await page.getByPlaceholder(/DESCRIBE THE VOYAGE/i).fill('Needs work');
      await page.getByRole('button', { name: /Commit Analysis/i }).click();

      await expect(page.getByText('Submission failure')).toBeVisible();
      await expect(page.getByRole('button', { name: /Commit Analysis/i })).toBeVisible();
      await expect(page.getByPlaceholder(/DESCRIBE THE VOYAGE/i)).toHaveValue('Needs work');
    });

    test('renders loyalty points, locks expensive rewards, redeems affordable rewards, and surfaces failures', async ({ page }) => {
      let statusResponse = {
        points: 1200,
        tier: 'SILVER',
        tier_display: 'Silver Member',
      };
      const rewardsResponse = [
        { id: 1, nom: 'Dessert', description: 'Sweet finish', points_requis: 300, is_available: true, image: null },
        { id: 2, nom: 'Chef Table', description: 'Premium placement', points_requis: 1500, is_available: true, image: null },
        { id: 3, nom: 'Pairing', description: 'Wine pairing', points_requis: 500, is_available: true, image: null },
      ];

      await page.route('**/api/loyalty/my_status/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statusResponse) });
      });
      await page.route('**/api/loyalty/rewards/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rewardsResponse) });
      });
      await page.route('**/api/loyalty/rewards/1/redeem/', async (route) => {
        statusResponse = { ...statusResponse, points: 900 };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      });
      await page.route('**/api/loyalty/rewards/3/redeem/', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'REWARD_EXHAUSTED' }),
        });
      });

      await page.goto('/loyalty');

      await expect(page.getByText('1,200')).toBeVisible();
      await expect(page.getByRole('button', { name: 'LOCKED' })).toBeVisible();

      await page.getByRole('button', { name: /Redeem Now/i }).first().click();
      await expect(page.getByText('Reward Unlocked. Verification token sent.')).toBeVisible();
      await expect(page.getByText('900')).toBeVisible();

      await page.getByRole('button', { name: /Redeem Now/i }).nth(1).click();
      await expect(page.getByText('REWARD_EXHAUSTED')).toBeVisible();
    });
  });

  test.describe('stale and partial session fallbacks', () => {
    test.use({ storageState: STALE_SESSION_STORAGE_STATE });

    test('sends stale client session state back to login safely', async ({ page }) => {
      await page.goto('/account');
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('heading', { name: 'Welcome Back.' })).toBeVisible();
    });
  });

  test.describe('partial client session state', () => {
    test.use({ storageState: PARTIAL_SESSION_STORAGE_STATE });

    test('treats partial client storage as logged out state', async ({ page }) => {
      await page.goto('/account');
      await expect(page).toHaveURL('/login');

      await page.goto('/login');
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('heading', { name: 'Welcome Back.' })).toBeVisible();
    });
  });
});
