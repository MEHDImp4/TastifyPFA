import { expect, test } from '@playwright/test';

import { mockConfig, mockRefreshFail } from './fixtures/api';

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
  await page.route('**/api/plats/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(plats),
    });
  });
});

test.describe('client expanded browser matrix smoke', () => {
  test('keeps the guest route shell stable across core public pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Voir la carte/i }).first()).toBeVisible();

    await page.goto('/menu');
    await expect(page.getByRole('button', { name: /All Selections/i })).toBeVisible();

    await page.goto('/login');
    await expect(page.getByLabel('Username')).toBeVisible();

    await page.goto('/register');
    await expect(page.getByLabel('Registry Email')).toBeVisible();

    await page.goto('/missing-route');
    await expect(page.getByRole('heading', { name: /Une Table Introuvable/i })).toBeVisible();
  });

  test('keeps login validation feedback visible without relying on desktop-only affordances', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('login-error')).toContainText('Veuillez remplir tous les champs');
  });

  test('keeps category switching and search stable in the public menu', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByText('Soupe Harira')).toBeVisible();

    await page.getByRole('button', { name: /Plats/i }).click();
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
    await expect(page.getByText('Soupe Harira')).toHaveCount(0);

    await page.getByRole('button', { name: /All Selections/i }).click();
    await page.getByPlaceholder('FIND A CREATION...').fill('tagine');
    await expect(page.getByText('Tagine Poulet')).toBeVisible();
  });

  test('keeps the mobile catalog CTA path visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu');
    await page.getByRole('button', { name: /Add to cart/i }).click();
    await expect(page.getByRole('link', { name: /Open checkout with 1 item/i })).toBeVisible();
  });
});
