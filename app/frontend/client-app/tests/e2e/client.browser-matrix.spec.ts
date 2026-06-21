import { expect, test } from '@playwright/test';

import { mockConfig, mockRefreshFail } from './fixtures/api';

const routeReady = { waitUntil: 'domcontentloaded' } as const;

const categories = [
  { id: 1, nom: 'Entrées', description: 'Les entrées', ordre_affichage: 1, est_active: true },
  { id: 2, nom: 'Plats', description: 'Les plats principaux', ordre_affichage: 2, est_active: true },
];

const plats = [
  {
    id: 11,
    nom: 'Soupe Harira',
    prix: '15.00',
    description: 'Soupe marocaine traditionnelle',
    temps_preparation: 10,
    categorie: 1,
    image: null,
    est_active: true,
    est_disponible: true,
  },
  {
    id: 21,
    nom: 'Tagine Poulet',
    prix: '55.00',
    description: 'Tagine de poulet aux olives',
    temps_preparation: 30,
    categorie: 2,
    image: null,
    est_active: true,
    est_disponible: true,
  },
];

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
  await page.route('**/api/categories/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(categories),
    });
  });
  await page.route(/\/api\/plats\/?(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const catParam = url.searchParams.get('categorie');
    let filtered = plats;
    if (catParam) {
      filtered = filtered.filter(p => p.categorie === Number(catParam));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  });
});

test.describe('client expanded browser matrix smoke', () => {
  test('keeps the guest route shell stable across core public pages', async ({ page }) => {
    await page.goto('/', routeReady);
    await expect(page.getByRole('link', { name: /Voir la carte/i }).first()).toBeVisible();

    await page.goto('/menu', routeReady);
    await expect(page.getByRole('button', { name: 'Tous les plats' })).toBeVisible();

    await page.goto('/login', routeReady);
    await expect(page.getByLabel('Utilisateur')).toBeVisible();

    await page.goto('/register', routeReady);
    await expect(page.getByLabel('Email')).toBeVisible();

    await page.goto('/missing-route', routeReady);
    await expect(page.getByRole('heading', { name: 'Page Introuvable' })).toBeVisible();
  });

  test('keeps login validation feedback visible without relying on desktop-only affordances', async ({ page }) => {
    await page.goto('/login', routeReady);
    await page.getByTestId('login-username').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('login-error')).toContainText('Veuillez remplir tous les champs');
  });

  test('keeps category switching and search stable in the public menu', async ({ page }) => {
    await page.goto('/menu', routeReady);
    await expect(page.getByText('Soupe Harira')).toBeVisible();

    await page.getByRole('button', { name: 'Plats', exact: true }).click();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);

    await page.getByRole('button', { name: 'Tous les plats' }).click();
    await page.getByLabel('Rechercher').fill('tagine');
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
  });

  test('keeps the mobile catalog CTA path visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: /Ajouter.*au panier/i }).first().click();
    await expect(page.getByRole('link', { name: /Voir le panier/i })).toBeVisible();
  });
});
