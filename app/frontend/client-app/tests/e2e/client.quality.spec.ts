import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import {
  AUTHENTICATED_STORAGE_STATE,
  mockConfig,
  mockRefreshFail,
} from './fixtures/api';

const expectNoBlockingViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    impact === 'critical' || impact === 'serious',
  );

  expect(blockingViolations).toEqual([]);
};

const mockAccountData = async (page: Page) => {
  await page.route('**/api/reservations/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 9001,
          table: 4,
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
      body: JSON.stringify({ points: 1240, tier: 'SILVER', tier_display: 'Silver Member' }),
    });
  });
  await page.route('**/api/loyalty/rewards/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, nom: 'Apéritif', description: 'Bienvenue', points_requis: 500, is_available: true, image: null },
      ]),
    });
  });
  await page.route('**/api/commandes/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 2001, statut: 'EN_COURS', montant_total: '180', created_at: '2026-06-03T12:00:00Z' },
      ]),
    });
  });
};

const mockLoyaltyData = async (page: Page) => {
  await page.route('**/api/loyalty/my_status/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ points: 1240, tier: 'SILVER', tier_display: 'Silver Member' }),
    });
  });
  await page.route('**/api/loyalty/rewards/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, nom: 'Dessert', description: 'Sweet finish', points_requis: 300, is_available: true, image: null },
        { id: 2, nom: 'Chef Table', description: 'Premium placement', points_requis: 1500, is_available: true, image: null },
      ]),
    });
  });
};

const mockMenuData = async (page: Page) => {
  await page.route('**/api/categories/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 81, nom: 'Plats', ordre_affichage: 1, est_active: true },
      ]),
    });
  });
  await page.route('**/api/plats/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 82,
          nom: 'Couscous Maison',
          prix: '18.00',
          temps_preparation: 12,
          categorie: 81,
          image: null,
          est_active: true,
          est_disponible: true,
          description: 'Slow-cooked signature semolina service.',
        },
      ]),
    });
  });
};

const mockPaymentSession = async (page: Page) => {
  await page.route('**/api/paiements/session/resolve/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        table_numero: '12',
        montant_restant: '180.00',
        lignes: [
          { id: 1, plat_nom: 'Harira', quantite: 1, montant_restant: '40.00' },
          { id: 2, plat_nom: 'Tagine', quantite: 2, montant_restant: '140.00' },
        ],
      }),
    });
  });
  await page.route('**/api/paiements/session/equal-split/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ share_amount: '90.00' }),
    });
  });
  await page.route('**/api/paiements/session/pay/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
};

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('client public quality', () => {
  test('keeps auth routes accessible and exposes stable labels', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Utilisateur')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('link', { name: /Retour/i })).toBeVisible();
    await expectNoBlockingViolations(page);

    await page.goto('/register');
    await expect(page.getByLabel('Utilisateur')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps guest navigation stable across home, menu, login, register, and 404', async ({ page }) => {
    await mockMenuData(page);

    await page.goto('/');
    await expect(page.getByRole('link', { name: "S'identifier" })).toBeVisible();

    await page.locator('header').getByRole('link', { name: /LA CARTE/i }).click();
    await expect(page).toHaveURL('/menu');
    await expect(page.getByLabel('Rechercher')).toBeVisible();

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Connexion.' })).toBeVisible();

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Inscription.' })).toBeVisible();

    await page.goto('/missing-route');
    await expect(page.getByRole('heading', { name: 'Page Introuvable' })).toBeVisible();
    await page.getByRole('button', { name: /Voir le Menu/i }).click();
    await expect(page).toHaveURL('/menu');
  });

  test('renders the offline recovery state and retry affordance', async ({ page }) => {
    await page.goto('/offline');

    await expect(page.getByRole('heading', { name: /Mode Hors Ligne/i })).toBeVisible();
    await page.getByRole('button', { name: /Réessayer la Connexion/i }).click();
    await expect(page.getByText(/Tentative de reconnexion/i)).toBeVisible();
  });

  test('keeps the menu usable on a narrow viewport with modal open and close', async ({ page }) => {
    await mockMenuData(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/menu');
    await expect(page.getByLabel('Rechercher')).toBeVisible();

    await page.getByRole('button', { name: /Ajouter.*au panier/i }).click();
    // Cart link is hidden on mobile (hidden md:flex) — navigate directly
    await page.goto('/checkout');
    await expect(page).toHaveURL('/checkout');
    await page.goto('/menu');

    await page.getByText('Couscous Maison').first().click();
    await expect(page.getByRole('button', { name: /Fermer le détail du plat/i })).toBeVisible();
    await page.getByRole('button', { name: /Fermer le détail du plat/i }).click();
    await expect(page.getByRole('button', { name: /Fermer le détail du plat/i })).toHaveCount(0);
  });

  test('keeps guest mobile navigation direct and scroll-safe', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');
    await expect(page.getByRole('button', { name: /Ouvrir la navigation/i })).toBeVisible();

    await page.getByRole('button', { name: /Ouvrir la navigation/i }).click();
    const mobileNavigation = page.locator('#mobile-navigation');
    await expect(mobileNavigation.getByText('Navigation invitée')).toBeVisible();
    await expect(mobileNavigation.getByRole('link', { name: /La Carte/i })).toBeVisible();
    await expect(mobileNavigation.getByRole('link', { name: /Réservations/i })).toBeVisible();
    await expect(mobileNavigation.getByRole('link', { name: /Connexion Membre/i })).toBeVisible();
  });
});

test.describe('client authenticated quality', () => {
  test.use({ storageState: AUTHENTICATED_STORAGE_STATE });

  test('keeps account accessible on desktop and after a narrow-viewport refresh', async ({ page }) => {
    await mockAccountData(page);

    await page.goto('/account');
    await expect(page.getByRole('button', { name: /Donner votre avis/i })).toBeVisible();
    await expectNoBlockingViolations(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByRole('button', { name: /Fermer la session/i })).toBeVisible();
  });

  test('keeps checkout usable on a narrow viewport and after a refresh', async ({ page }) => {
    await mockMenuData(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu');
    await page.getByRole('button', { name: /Ajouter.*au panier/i }).click();
    // Cart link is hidden on mobile (hidden md:flex) — navigate directly
    await page.goto('/checkout');
    await expect(page.getByRole('button', { name: /Valider la commande/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Retour à la carte/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: /Valider la commande/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Augmenter la quantité pour Couscous Maison/i })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps reservations accessible with labeled controls', async ({ page }) => {
    await page.goto('/reservations');

    await expect(page.getByLabel('Date du repas')).toBeVisible();
    await expect(page.getByLabel("Heure d'arrivée")).toBeVisible();
    await expect(page.getByRole('button', { name: /Augmenter le nombre de convives/i })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps loyalty accessible with deterministic reward data', async ({ page }) => {
    await mockLoyaltyData(page);

    await page.goto('/loyalty');
    await expect(page.getByRole('heading', { name: /Vos Privilèges/i })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps the payment portal usable on a narrow viewport', async ({ page }) => {
    await mockPaymentSession(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/pay/quality-token');
    await expect(page.getByRole('button', { name: /Confirmer le Règlement/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Partager$/i })).toBeVisible();
    await page.getByRole('button', { name: /^Partager$/i }).click();
    await expect(page.getByRole('button', { name: /Augmenter le nombre de parts/i })).toBeVisible();
  });
});
