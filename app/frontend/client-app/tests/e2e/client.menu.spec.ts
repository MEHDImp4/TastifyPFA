import { expect, test } from '@playwright/test';
import { mockConfig, mockRefreshFail } from './fixtures/api';

const routeReady = { waitUntil: 'domcontentloaded' } as const;

const categories = [
  { id: 1, nom: 'Entrées', description: 'Les entrées', ordre_affichage: 1, est_active: true },
  { id: 2, nom: 'Plats', description: 'Les plats principaux', ordre_affichage: 2, est_active: true },
];

const plats = [
  { id: 11, nom: 'Soupe Harira', prix: '15.00', description: 'Soupe marocaine traditionnelle', temps_preparation: 10, categorie: 1, image: null, est_active: true, est_disponible: true },
  { id: 12, nom: 'Briouates', prix: '18.00', description: 'Feuilletés croustillants', temps_preparation: 15, categorie: 1, image: null, est_active: true, est_disponible: true },
  { id: 21, nom: 'Tagine Poulet', prix: '55.00', description: 'Tagine de poulet aux olives', temps_preparation: 30, categorie: 2, image: null, est_active: true, est_disponible: true },
];

const imageBackedPlat = {
  ...plats[2],
  image: '/media/plats/tagine-poulet-hero.png',
};

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
  await page.route('**/api/categories/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(categories) });
  });
  await page.route(/\/api\/plats\/?(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const catParam = url.searchParams.get('categorie');
    const searchParam = url.searchParams.get('search');
    let filtered = plats;
    if (catParam) {
      filtered = filtered.filter(p => p.categorie === Number(catParam));
    }
    if (searchParam) {
      const q = searchParam.toLowerCase();
      filtered = filtered.filter(p => p.nom.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtered) });
  });
});

test.describe('menu catalog', () => {
  test('shows category navigation after load', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await expect(page.getByRole('button', { name: 'Tous les plats' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrées/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Plats', exact: true })).toBeVisible();
  });

  test('shows first category dishes by default', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toBeVisible();
    await expect(page.getByText('Tagine Poulet')).toHaveCount(0);
  });

  test('All Selections shows all dishes across all categories', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: 'Tous les plats' }).click();
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
  });

  test('switching category shows only that category dishes', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: 'Plats', exact: true }).click();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
    await expect(page.getByText('Briouates')).toHaveCount(0);
  });

  test('search filters dishes within the active category', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await page.getByLabel('Rechercher').fill('harira');
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toHaveCount(0);
  });

  test('search across All Selections finds dishes in any category', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: 'Tous les plats' }).click();
    await page.getByLabel('Rechercher').fill('tagine');
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
  });

  test('search matches dish descriptions as well as names', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: 'Tous les plats' }).click();
    await page.getByLabel('Rechercher').fill('olives');
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);
  });

  test('shows empty state when no dish matches search', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: 'Tous les plats' }).click();
    await page.getByLabel('Rechercher').fill('doesnotexist12345');
    await expect(page.getByText('Aucun plat trouvé')).toBeVisible();
  });

  test('clearing search restores category view', async ({ page }) => {
    await page.goto('/menu', routeReady);
    const searchInput = page.getByLabel('Rechercher');
    await searchInput.fill('harira');
    await expect(page.getByText('Briouates')).toHaveCount(0);
    await searchInput.fill('');
    await expect(page.getByText('Soupe Harira')).toBeVisible();
    await expect(page.getByText('Briouates')).toBeVisible();
  });

  test('opens the dish detail modal and closes it without changing the route', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: /Voir le détail de Soupe Harira/i }).click();

    await expect(page.getByText('DÉTAILS DU PLAT')).toBeVisible();
    await expect(page.getByRole('button', { name: /Ajouter au panier/i })).toBeVisible();

    await page.getByRole('button', { name: /Fermer le détail du plat/i }).click();
    await expect(page.getByText('DÉTAILS DU PLAT')).toHaveCount(0);
    await expect(page).toHaveURL('/menu');
  });

  test('keeps unavailable dishes non-interactive in the catalog', async ({ page }) => {
    const unavailablePlats = plats.map((plat) =>
      plat.id === 12 ? { ...plat, est_disponible: false } : plat,
    );

    await page.unroute(/\/api\/plats\/?(\?.*)?$/);
    await page.route(/\/api\/plats\/?(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const catParam = url.searchParams.get('categorie');
      const searchParam = url.searchParams.get('search');
      let filtered = unavailablePlats;
      if (catParam) {
        filtered = filtered.filter(p => p.categorie === Number(catParam));
      }
      if (searchParam) {
        const q = searchParam.toLowerCase();
        filtered = filtered.filter(p => p.nom.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtered) });
    });

    await page.goto('/menu', routeReady);
    await expect(page.getByText('Briouates')).toBeVisible();
    await expect(page.getByRole('button', { name: /Ajouter.*au panier/i })).toHaveCount(1);

    await page.getByText('Briouates').click();
    await expect(page.getByText('DÉTAILS DU PLAT')).toHaveCount(0);
  });

  test('renders image-backed dishes safely in both the catalog and detail modal', async ({ page }) => {
    await page.route('**/media/plats/tagine-poulet-hero.png', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: tinyPng,
      });
    });
    await page.unroute(/\/api\/plats\/?(\?.*)?$/);
    await page.route(/\/api\/plats\/?(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const catParam = url.searchParams.get('categorie');
      const searchParam = url.searchParams.get('search');
      let filtered = [plats[0], plats[1], imageBackedPlat];
      if (catParam) {
        filtered = filtered.filter(p => p.categorie === Number(catParam));
      }
      if (searchParam) {
        const q = searchParam.toLowerCase();
        filtered = filtered.filter(p => p.nom.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });

    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: 'Tous les plats' }).click();

    await expect(page.getByRole('img', { name: 'Tagine Poulet' }).first()).toHaveAttribute(
      'src',
      /tagine-poulet-hero\.png/,
    );

    await page.getByRole('button', { name: /Voir le détail de Tagine Poulet/i }).click();
    await expect(page.getByText('DÉTAILS DU PLAT')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Tagine Poulet' }).last()).toHaveAttribute(
      'src',
      /tagine-poulet-hero\.png/,
    );
  });
});
