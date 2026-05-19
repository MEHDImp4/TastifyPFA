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
    await expect(page.getByRole('button', { name: /Vue d'ensemble/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrées/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Plats/ })).toBeVisible();
  });

  test('shows first category dishes by default', async ({ page }) => {
    await page.goto('/menu');
    // First category (Entrées) is selected by default
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toBeVisible();
    // Plats dishes are hidden under the active category filter
    await expect(page.getByText('Tagine Poulet')).toHaveCount(0);
  });

  test('Vue d\'ensemble shows all dishes across all categories', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /Vue d'ensemble/ }).click();
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
  });

  test('switching category shows only that category dishes', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /Plats/ }).click();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
    await expect(page.getByText('Briouates')).toHaveCount(0);
  });

  test('search filters dishes within the active category', async ({ page }) => {
    await page.goto('/menu');
    // Default: Entrées active — search within Entrées
    await page.getByPlaceholder('Rechercher une signature...').fill('harira');
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toHaveCount(0);
  });

  test('search across Vue d\'ensemble finds dishes in any category', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /Vue d'ensemble/ }).click();
    await page.getByPlaceholder('Rechercher une signature...').fill('tagine');
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
  });

  test('shows empty state when no dish matches search', async ({ page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /Vue d'ensemble/ }).click();
    await page.getByPlaceholder('Rechercher une signature...').fill('doesnotexist12345');
    await expect(page.getByText('Aucun résultat trouvé.')).toBeVisible();
  });

  test('clearing search restores category view', async ({ page }) => {
    await page.goto('/menu');
    const searchInput = page.getByPlaceholder('Rechercher une signature...');
    await searchInput.fill('harira');
    await expect(page.getByText('Briouates')).toHaveCount(0);
    await searchInput.fill('');
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toBeVisible();
  });
});
