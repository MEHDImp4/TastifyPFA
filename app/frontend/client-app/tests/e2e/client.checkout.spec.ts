import { expect, test } from '@playwright/test';
import { mockConfig, mockRefreshFail } from './fixtures/api';

const categories = [
  { id: 1, nom: 'Entrées', description: 'Les entrées', ordre_affichage: 1, est_active: true },
  { id: 2, nom: 'Plats', description: 'Les plats principaux', ordre_affichage: 2, est_active: true },
];

const plats = [
  { id: 11, nom: 'Harira', prix: '15.00', description: 'Moroccan soup', temps_preparation: 10, categorie: 1, image: null, est_active: true, est_disponible: true },
  { id: 22, nom: 'Tagine', prix: '55.00', description: 'Slow braised tagine', temps_preparation: 25, categorie: 2, image: null, est_active: true, est_disponible: true },
];

async function seedAuthenticatedUser(page: Parameters<typeof test.beforeEach>[0]['page']) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'client-auth-storage',
      JSON.stringify({
        state: {
          accessToken: 'mock-access-token',
          role: 'CLIENT',
          username: 'client_test',
          isAuthenticated: true,
          hasSession: true,
        },
        version: 0,
      }),
    );
  });
}

async function mockMenuCatalog(page: Parameters<typeof test.beforeEach>[0]['page']) {
  await page.route('**/api/categories/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(categories) });
  });
  await page.route('**/api/plats/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plats) });
  });
}

async function buildCheckoutCart(page: Parameters<typeof test.beforeEach>[0]['page']) {
  await mockMenuCatalog(page);
  await page.goto('/menu');

  await page.getByRole('button', { name: /Add to cart/i }).click();
  await page.getByRole('button', { name: /Add to cart/i }).click();

  await page.getByRole('button', { name: /Plats/i }).click();
  await page.getByRole('button', { name: /Add to cart/i }).click();

  await page.locator('a[href="/checkout"]').click();
}

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('checkout journey', () => {
  test('empty cart offers recovery back to the menu', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page.getByRole('heading', { name: /Your palette/i })).toBeVisible();
    await page.getByRole('button', { name: /Explore Catalog/i }).click();
    await expect(page).toHaveURL('/menu');
  });

  test.describe('cart-backed checkout', () => {
    test('recalculates totals when quantities, removals, and tip change', async ({ page }) => {
      await seedAuthenticatedUser(page);
      await buildCheckoutCart(page);

      await expect(page.getByText('Harira')).toBeVisible();
      await expect(page.getByText('Tagine')).toBeVisible();
      await expect(page.getByText(/^92$/)).toBeVisible();

      await page.getByRole('button', { name: '10%' }).click();
      await expect(page.getByText(/^100$/)).toBeVisible();

      const tagineCard = page.getByText('Tagine').locator('..').locator('..');
      await tagineCard.getByRole('button').last().click();
      await expect(page.getByText('Tagine')).toHaveCount(0);
      await expect(page.getByText(/^35$/)).toBeVisible();

      const hariraCard = page.getByText('Harira').locator('..').locator('..');
      await hariraCard.locator('div.flex.items-center.bg-background').getByRole('button').last().click();
      await expect(page.getByText(/^53$/)).toBeVisible();
    });

    test('submits a takeout order, clears the cart, and lets the user track it', async ({ page }) => {
      let orderPayload: Record<string, unknown> | null = null;

      await seedAuthenticatedUser(page);
      await page.route('**/api/commandes/', async (route) => {
        orderPayload = JSON.parse(route.request().postData() ?? '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 901 }),
        });
      });

      await page.route('**/api/reservations/', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route('**/api/loyalty/my_status/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: 450, tier: 'SILVER', tier_display: 'Silver' }),
        });
      });

      await buildCheckoutCart(page);
      await page.getByRole('button', { name: /Authorize Manifest/i }).click();

      await expect(page.getByRole('heading', { name: /Merci pour votre commande/i })).toBeVisible();
      await expect(orderPayload).toMatchObject({
        type: 'EMPORTER',
        lignes: [
          { plat: 11, quantite: 2, notes: '' },
          { plat: 22, quantite: 1, notes: '' },
        ],
      });

      await page.getByRole('button', { name: /Track Order/i }).click();
      await expect(page).toHaveURL('/account');
      await page.goto('/checkout');
      await expect(page.getByRole('heading', { name: /Your palette/i })).toBeVisible();
    });

    test('shows order submission failure without losing the cart', async ({ page }) => {
      await seedAuthenticatedUser(page);
      await page.route('**/api/commandes/', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'boom' }),
        });
      });

      await buildCheckoutCart(page);
      await page.getByRole('button', { name: /Authorize Manifest/i }).click();

      await expect(page.getByText('Protocol Breach')).toBeVisible();
      await expect(page.getByText('Harira')).toBeVisible();
      await expect(page.getByText('Tagine')).toBeVisible();
      await expect(page.getByRole('button', { name: /Authorize Manifest/i })).toBeVisible();
    });
  });
});
