import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';

import {
  AUTHENTICATED_STORAGE_STATE,
  mockConfig,
  mockRefreshFail,
} from './fixtures/api';

const routeReady = { waitUntil: 'domcontentloaded' } as const;

const expectNoBlockingViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    impact === 'critical' || impact === 'serious',
  );

  expect(blockingViolations).toEqual([]);
};

const asPaginatedPayload = (route: Route, rows: unknown[]) => {
  const requestUrl = new URL(route.request().url());
  return requestUrl.searchParams.has('page') || requestUrl.searchParams.has('page_size')
    ? { count: rows.length, next: null, previous: null, results: rows }
    : rows;
};

const expectNoLayoutOverflow = async (page: Page) => {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
};

const expectDocumentScrollWorks = async (page: Page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  const before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => window.scrollY);
  const scrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 20);

  if (scrollable) {
    expect(after).toBeGreaterThan(before);
  }
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
  await page.route(/\/api\/plats\/(?:\?.*)?$/, async (route) => {
    const rows = [
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
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(asPaginatedPayload(route, rows)),
    });
  });
};

const mockPaymentSession = async (page: Page) => {
  await page.route(/\/api\/paiements\/session\/resolve\/\?.*/, async (route) => {
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
    await page.goto('/login', routeReady);
    await expect(page.getByLabel('Utilisateur')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('link', { name: /Retour/i })).toBeVisible();
    await expectNoBlockingViolations(page);

    await page.goto('/register', routeReady);
    await expect(page.getByLabel('Utilisateur')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps guest navigation stable across home, menu, login, register, and 404', async ({ page }) => {
    await mockMenuData(page);
    const openMenuFromGuestNav = async () => {
      const desktopMenuLink = page.locator('header').getByRole('link', { name: /LA CARTE/i });
      if (await desktopMenuLink.isVisible()) {
        await desktopMenuLink.click();
        return;
      }

      await page.getByRole('button', { name: /Ouvrir la navigation/i }).click();
      await page.locator('#mobile-navigation').getByRole('link', { name: /La Carte/i }).click();
    };

    await page.goto('/', routeReady);
    const desktopLoginLink = page.getByRole('link', { name: "S'identifier" });
    if (await desktopLoginLink.isVisible()) {
      await expect(desktopLoginLink).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: /Ouvrir la navigation/i })).toBeVisible();
    }

    await openMenuFromGuestNav();
    await expect(page).toHaveURL('/menu');
    await expect(page.getByLabel('Rechercher')).toBeVisible();

    await page.goto('/login', routeReady);
    await expect(page.getByRole('heading', { name: 'Connexion.' })).toBeVisible();

    await page.goto('/register', routeReady);
    await expect(page.getByRole('heading', { name: 'Inscription.' })).toBeVisible();

    await page.goto('/missing-route', routeReady);
    await expect(page.getByRole('heading', { name: 'Page Introuvable' })).toBeVisible();
    await page.getByRole('button', { name: /Voir le Menu/i }).click();
    await expect(page).toHaveURL('/menu');
  });

  test('renders the offline recovery state and retry affordance', async ({ page }) => {
    await page.goto('/offline', routeReady);

    await expect(page.getByRole('heading', { name: /Connexion interrompue/i })).toBeVisible();
    await page.getByRole('button', { name: /Réessayer/i }).click();
    await expect(page.getByText(/Tentative de reconnexion/i)).toBeVisible();
  });

  test('keeps the menu usable on a narrow viewport with modal open and close', async ({ page }) => {
    await mockMenuData(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/menu', routeReady);
    await expect(page.getByLabel('Rechercher')).toBeVisible();

    await page.getByRole('button', { name: /Ajouter.*au panier/i }).click();
    // Cart link is hidden on mobile (hidden md:flex) — navigate directly
    await page.goto('/checkout', routeReady);
    await expect(page).toHaveURL('/checkout');
    await page.goto('/menu', routeReady);

    await page.getByRole('button', { name: /Voir le détail de Couscous Maison/i }).click();
    await expect(page.getByRole('button', { name: /Fermer le détail du plat/i })).toBeVisible();
    await page.getByRole('button', { name: /Fermer le détail du plat/i }).click();
    await expect(page.getByRole('button', { name: /Fermer le détail du plat/i })).toHaveCount(0);
  });

  test('keeps guest mobile navigation direct and scroll-safe', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/', routeReady);
    await expect(page.getByRole('button', { name: /Ouvrir la navigation/i })).toBeVisible();

    await page.getByRole('button', { name: /Ouvrir la navigation/i }).click();
    const mobileNavigation = page.locator('#mobile-navigation');
    await expect(mobileNavigation.getByText('Navigation invitée')).toBeVisible();
    await expect(mobileNavigation.getByRole('link', { name: /La Carte/i })).toBeVisible();
    await expect(mobileNavigation.getByRole('link', { name: /Réservations/i })).toBeVisible();
    await expect(mobileNavigation.getByRole('link', { name: /Se connecter/i })).toBeVisible();
  });

  test('prevents horizontal overflow and preserves document scrolling across public routes', async ({ page }) => {
    await mockMenuData(page);
    await mockPaymentSession(page);
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of ['/', '/menu', '/reservations', '/contact', '/login', '/register', '/pay/quality-token', '/offline', '/missing-route']) {
      await page.goto(route, routeReady);
      await expectNoLayoutOverflow(page);
      await expectDocumentScrollWorks(page);
    }
  });

  test('locks body scroll while mobile navigation and dish modal overlays are open', async ({ page }) => {
    await mockMenuData(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/', routeReady);
    await page.getByRole('button', { name: /Ouvrir la navigation/i }).click();
    await expect(page.locator('#mobile-navigation')).toBeVisible();
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    await page.getByRole('button', { name: /Fermer la navigation/i }).click();
    await expect(page.locator('#mobile-navigation')).toHaveCount(0);

    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: /Voir le détail de Couscous Maison/i }).click();
    await expect(page.getByRole('button', { name: /Fermer le détail du plat/i })).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await expectNoLayoutOverflow(page);
    await page.getByRole('button', { name: /Fermer le détail du plat/i }).click();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });
});

test.describe('client authenticated quality', () => {
  test.use({ storageState: AUTHENTICATED_STORAGE_STATE });

  test('keeps account accessible on desktop and after a narrow-viewport refresh', async ({ page }) => {
    await mockAccountData(page);

    await page.goto('/account', routeReady);
    await expect(page.getByRole('button', { name: /Donner votre avis/i })).toBeVisible();
    await expectNoBlockingViolations(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByRole('button', { name: /Fermer la session/i })).toBeVisible();
  });

  test('keeps checkout usable on a narrow viewport and after a refresh', async ({ page }) => {
    await mockMenuData(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: /Ajouter.*au panier/i }).click();
    // Cart link is hidden on mobile (hidden md:flex) — navigate directly
    await page.goto('/checkout', routeReady);
    await expect(page.getByRole('button', { name: /Valider la commande/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Retour à la carte/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: /Valider la commande/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Augmenter la quantité pour Couscous Maison/i })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps reservations accessible with labeled controls', async ({ page }) => {
    await page.goto('/reservations', routeReady);

    await expect(page.getByLabel('Date du repas')).toBeVisible();
    await expect(page.getByLabel("Heure d'arrivée")).toBeVisible();
    await expect(page.getByRole('button', { name: /Augmenter le nombre de convives/i })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps loyalty accessible with deterministic reward data', async ({ page }) => {
    await mockLoyaltyData(page);

    await page.goto('/loyalty', routeReady);
    await expect(page.getByRole('heading', { name: /Vos points/i })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps the payment portal usable on a narrow viewport', async ({ page }) => {
    await mockPaymentSession(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/pay/quality-token', routeReady);
    await expect(page.getByRole('button', { name: /Confirmer le paiement/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Partager$/i })).toBeVisible();
    await page.getByRole('button', { name: /^Partager$/i }).click();
    await expect(page.getByRole('button', { name: /Augmenter le nombre de parts/i })).toBeVisible();
  });

  test('prevents overflow on authenticated mobile pages', async ({ page }) => {
    await mockAccountData(page);
    await mockLoyaltyData(page);
    await mockMenuData(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/account', routeReady);
    await expectNoLayoutOverflow(page);
    await expectDocumentScrollWorks(page);

    await page.goto('/loyalty', routeReady);
    await expectNoLayoutOverflow(page);
    await expectDocumentScrollWorks(page);

    await page.goto('/menu', routeReady);
    await page.getByRole('button', { name: /Ajouter.*au panier/i }).click();
    await page.goto('/checkout', routeReady);
    await expectNoLayoutOverflow(page);
    await expectDocumentScrollWorks(page);
  });
});
