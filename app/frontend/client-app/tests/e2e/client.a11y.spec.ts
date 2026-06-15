import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';

import { mockConfig, mockRefreshFail } from './fixtures/api';

const DESIGN_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1440, height: 900 },
];

const routeReady = { waitUntil: 'domcontentloaded' } as const;

const asPaginatedPayload = (route: Route, rows: unknown[]) => {
  const requestUrl = new URL(route.request().url());
  return requestUrl.searchParams.has('page') || requestUrl.searchParams.has('page_size')
    ? { count: rows.length, next: null, previous: null, results: rows }
    : rows;
};

const mockHomeRecommendations = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/plats/top-recommendations/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 9001,
          categorie: 1,
          nom: 'Tagine Signature',
          description: 'Cuisson lente aux épices douces.',
          prix: '120.00',
          temps_preparation: 24,
          image: null,
          est_disponible: true,
          est_active: true,
          sentiment_score: 19,
        },
      ]),
    });
  });
};

const mockMenuCatalog = async (page: Parameters<typeof test>[0]['page']) => {
  await page.route('**/api/categories/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, nom: 'Plats', description: 'Cuisine maison', ordre_affichage: 1, image: null, est_active: true },
        { id: 2, nom: 'Desserts', description: 'Final sucré', ordre_affichage: 2, image: null, est_active: true },
      ]),
    });
  });

  await page.route(/\/api\/plats\/(?:\?.*)?$/, async (route) => {
    const rows = [
      {
        id: 9101,
        categorie: 1,
        nom: 'Couscous Royal',
        description: 'Semoule fine, légumes de saison et bouillon parfumé.',
        prix: '135.00',
        temps_preparation: 30,
        image: null,
        est_disponible: true,
        est_active: true,
        sentiment_score: 22,
      },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(asPaginatedPayload(route, rows)),
    });
  });
};

const expectNoBlockingViolations = async (page: Parameters<typeof test>[0]['page']) => {
  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    impact === 'critical' || impact === 'serious',
  );

  expect(blockingViolations).toEqual([]);
};

const expectNoUnexpectedHorizontalOverflow = async (page: Parameters<typeof test>[0]['page']) => {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;

    return (
      root.scrollWidth > root.clientWidth + 1 ||
      body.scrollWidth > body.clientWidth + 1
    );
  });

  expect(hasOverflow).toBe(false);
};

const expectTouchTargetsAtLeast44 = async (page: Parameters<typeof test>[0]['page']) => {
  const offenders = await page.locator('button, [role="button"], input, select, textarea').evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          text: (element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 60),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44),
  );

  expect(offenders).toEqual([]);
};

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('client public accessibility and responsiveness', () => {
  test('keeps the public home usable on a narrow viewport', async ({ page }) => {
    await mockHomeRecommendations(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', routeReady);

    await expect(page.getByRole('link', { name: /voir la carte/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /réserver/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /ouvrir la navigation/i })).toBeVisible();
    await expect(page.getByText('Tagine Signature')).toBeVisible();
    await expect(page.getByText(/Tastify/i).first()).toBeVisible();
  });

  test('keeps public routes stable at DesignMeter mobile and desktop sizes', async ({ page }) => {
    await mockHomeRecommendations(page);
    await mockMenuCatalog(page);

    for (const viewport of DESIGN_VIEWPORTS) {
      await page.setViewportSize(viewport);

      await page.goto('/', routeReady);
      await expect(page.getByRole('link', { name: /voir la carte/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /réserver/i }).first()).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
      await expectTouchTargetsAtLeast44(page);

      await page.goto('/menu', routeReady);
      await expect(page.getByRole('heading', { name: /la carte/i })).toBeVisible();
      await expect(page.getByText('Couscous Royal')).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
      await expectTouchTargetsAtLeast44(page);

      await page.goto('/reservations', routeReady);
      await expect(page.getByRole('heading', { name: /Prenez place/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Créer un compte/i })).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
      await expectTouchTargetsAtLeast44(page);

      await page.goto('/contact', routeReady);
      await expect(page.getByRole('heading', { name: /Écrivez-nous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Envoyer le message/i })).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
      await expectTouchTargetsAtLeast44(page);

      await page.goto('/login', routeReady);
      await expect(page.getByRole('button', { name: /Accéder au compte/i })).toBeVisible();
      await expectNoUnexpectedHorizontalOverflow(page);
      await expectTouchTargetsAtLeast44(page);
    }
  });

  test('has no critical or serious axe violations on login', async ({ page }) => {
    await page.goto('/login', routeReady);

    await expectNoBlockingViolations(page);
  });

  test('has no critical or serious axe violations on key public surfaces', async ({ page }) => {
    await mockHomeRecommendations(page);
    await mockMenuCatalog(page);

    await page.setViewportSize({ width: 375, height: 812 });

    for (const route of ['/', '/menu', '/login']) {
      await page.goto(route, routeReady);
      await expectNoBlockingViolations(page);
    }
  });
});
