import { expect, test } from '@playwright/test';
import { mockConfig, mockRefreshFail } from './fixtures/api';

const categories = [
  { id: 1, nom: 'Entrées', description: 'Les entrées', ordre_affichage: 1, est_active: true },
  { id: 2, nom: 'Plats', description: 'Les plats principaux', ordre_affichage: 2, est_active: true },
];

const plats = [
  { id: 11, nom: 'Soupe Harira', prix: '15.00', description: 'Soupe marocaine traditionnelle', temps_preparation: 10, categorie: 1, image: null, est_active: true, est_disponible: true },
  { id: 12, nom: 'Briouates', prix: '18.00', description: 'Feuilletés croustillants', temps_preparation: 15, categorie: 1, image: null, est_active: true, est_disponible: true },
  { id: 21, nom: 'Tagine Poulet', prix: '55.00', description: 'Tagine de poulet aux olives', temps_preparation: 30, categorie: 2, image: null, est_active: true, est_disponible: true },
];

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
  await page.route('**/api/categories/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(categories) });
  });
  await page.route('**/api/plats/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plats) });
  });
});

test.describe('menu catalog', () => {
  test('shows category navigation after load', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('button', { name: /All Selections/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrées/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Plats/i })).toBeVisible();
  });

  test('shows first category dishes by default', async ({ page }) => {
    await page.goto('/menu');
    // First category (Entrées) is selected by default
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toBeVisible();
    // Plats dishes are hidden under the active category filter
    await expect(page.getByText('Tagine Poulet')).toHaveCount(0);
  });

  test('All Selections shows all dishes across all categories', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /All Selections/i }).click();
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
  });

  test('switching category shows only that category dishes', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /Plats/i }).click();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
    await expect(page.getByText('Briouates')).toHaveCount(0);
  });

  test('search filters dishes within the active category', async ({ page }) => {
    await page.goto('/menu');
    // Default: Entrées active — search within Entrées
    await page.getByPlaceholder('FIND A CREATION...').fill('harira');
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toHaveCount(0);
  });

  test('search across All Selections finds dishes in any category', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /All Selections/i }).click();
    await page.getByPlaceholder('FIND A CREATION...').fill('tagine');
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
  });

  test('search matches dish descriptions as well as names', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /All Selections/i }).click();
    await page.getByPlaceholder('FIND A CREATION...').fill('olives');
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
  });

  test('shows empty state when no dish matches search', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /All Selections/i }).click();
    await page.getByPlaceholder('FIND A CREATION...').fill('doesnotexist12345');
    await expect(page.getByText('No creations match your query')).toBeVisible();
  });

  test('clearing search restores category view', async ({ page }) => {
    await page.goto('/menu');
    const searchInput = page.getByPlaceholder('FIND A CREATION...');
    await searchInput.fill('harira');
    await expect(page.getByText('Briouates')).toHaveCount(0);
    await searchInput.fill('');
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toBeVisible();
  });

  test('opens the dish detail modal and closes it without changing the route', async ({ page }) => {
    await page.goto('/menu');
    await page.getByText('Soupe Harira').click();

    await expect(page.getByText('GASTRONOMIC RECORD')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to Selection/i })).toBeVisible();

    await page.mouse.click(16, 16);
    await expect(page.getByText('GASTRONOMIC RECORD')).toHaveCount(0);
    await expect(page).toHaveURL('/menu');
  });

  test('keeps unavailable dishes non-interactive in the catalog', async ({ page }) => {
    const unavailablePlats = plats.map((plat) =>
      plat.id === 12 ? { ...plat, est_disponible: false } : plat,
    );

    await page.unroute('**/api/plats/');
    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(unavailablePlats) });
    });

    await page.goto('/menu');
    await expect(page.getByText('Briouates')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to cart/i })).toHaveCount(1);

    await page.getByText('Briouates').click();
    await expect(page.getByText('GASTRONOMIC RECORD')).toHaveCount(0);
  });
});
