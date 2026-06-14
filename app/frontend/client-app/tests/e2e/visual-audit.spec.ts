import { expect, test, type Page, type Route } from '@playwright/test';

const clientBaseURL = process.env.CLIENT_BASE_URL ?? 'http://127.0.0.1:3003';
const backofficeBaseURL = process.env.BACKOFFICE_BASE_URL ?? 'http://127.0.0.1:3000';

const categories = [
  { id: 1, nom: 'Signatures', description: 'Plats maison', image: null, est_active: true },
  { id: 2, nom: 'Desserts', description: 'Final sucre', image: null, est_active: true },
];

const plats = [
  {
    id: 101,
    nom: 'Couscous Maison',
    description: 'Semoule fine, legumes de saison et bouillon parfume.',
    prix: '120.00',
    categorie: 1,
    categorie_nom: 'Signatures',
    image: null,
    est_active: true,
    est_disponible: true,
    temps_preparation: 25,
    score_moyen: 18,
    top_avis: [],
  },
  {
    id: 102,
    nom: 'Tajine Safran',
    description: 'Poulet fermier, citron confit et olives violettes.',
    prix: '135.00',
    categorie: 1,
    categorie_nom: 'Signatures',
    image: null,
    est_active: true,
    est_disponible: true,
    temps_preparation: 30,
    score_moyen: 19,
    top_avis: [],
  },
  {
    id: 103,
    nom: 'Pastilla Amandes',
    description: 'Feuilletage croustillant, cannelle et amandes grillees.',
    prix: '90.00',
    categorie: 2,
    categorie_nom: 'Desserts',
    image: null,
    est_active: true,
    est_disponible: true,
    temps_preparation: 18,
    score_moyen: 17,
    top_avis: [],
  },
];

const tables = [
  { id: 1, numero: 1, capacite: 2, statut: 'LIBRE', position_x: 20, position_y: 24, is_active: true },
  { id: 2, numero: 2, capacite: 4, statut: 'OCCUPEE', position_x: 48, position_y: 38, is_active: true },
  { id: 3, numero: 3, capacite: 6, statut: 'RESERVEE', position_x: 70, position_y: 58, is_active: true },
];

const reservations = [
  {
    id: 501,
    nom_client: 'Sara Benali',
    client_nom: 'Sara Benali',
    telephone: '0611223344',
    nombre_personnes: 4,
    date_reservation: '2026-06-20',
    heure_reservation: '20:00',
    statut: 'EN_ATTENTE',
    table: 2,
    table_numero: 2,
  },
  {
    id: 502,
    nom_client: 'Yanis Idrissi',
    client_nom: 'Yanis Idrissi',
    telephone: '0655667788',
    nombre_personnes: 2,
    date_reservation: '2026-06-20',
    heure_reservation: '21:00',
    statut: 'CONFIRMEE',
    table: 1,
    table_numero: 1,
  },
];

const ingredients = [
  { id: 1, nom: 'Safran', unite: 'g', stock_actuel: '80.00', seuil_alerte: '20.00', cout_unitaire: '5.00', est_active: true },
  { id: 2, nom: 'Semoule fine', unite: 'kg', stock_actuel: '14.00', seuil_alerte: '5.00', cout_unitaire: '2.00', est_active: true },
];

const employes = [
  {
    id: 1,
    poste: 'GERANT',
    telephone: '0612345678',
    cin: 'AB123',
    salaire: '4500.00',
    date_embauche: '2026-01-01',
    user_details: {
      username: 'gerant',
      first_name: 'Nora',
      last_name: 'Amrani',
      email: 'nora@tastify.test',
      is_active: true,
    },
  },
];

const avis = [
  {
    id: 1,
    note: 5,
    commentaire: 'Service impeccable et tajine remarquable.',
    sentiment_score: 18,
    user: 1,
    user_username: 'client.vip',
    plat: 101,
    plat_nom: 'Tajine Safran',
    created_at: '2026-06-10T12:00:00Z',
  },
];

const commandes = [
  {
    id: 9001,
    table: 2,
    table_numero: 2,
    statut: 'EN_CUISINE',
    total: '255.00',
    created_at: '2026-06-14T12:00:00Z',
    lignes: [
      { id: 1, plat: 101, plat_nom: 'Couscous Maison', quantite: 2, statut: 'EN_CUISINE', notes: '' },
    ],
  },
];

const paginated = <T,>(rows: T[]) => ({ count: rows.length, next: null, previous: null, results: rows });

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const arrayOrPage = <T,>(route: Route, rows: T[]) => {
  const url = new URL(route.request().url());
  return url.searchParams.has('page') || url.searchParams.has('page_size') ? paginated(rows) : rows;
};

async function mockClientApis(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('tastify_cookie_consent', JSON.stringify({ accepted: true, date: Date.now() }));
  });
  await page.route('**/api/settings/public/', route =>
    fulfillJson(route, {
      restaurant_name: 'Tastify',
      phone: '+212 600 000 000',
      address: 'Marrakech',
      opening_hours: '12:00 - 23:00',
    }),
  );
  await page.route('**/api/users/refresh/', route => fulfillJson(route, {}, 401));
  await page.route('**/api/categories/', route => fulfillJson(route, categories));
  await page.route('**/api/plats/top-recommendations/', route => fulfillJson(route, plats.slice(0, 2)));
  await page.route(/\/api\/plats\/(?:\?.*)?$/, route => fulfillJson(route, arrayOrPage(route, plats)));
  await page.route('**/api/reservations/available_tables/**', route => fulfillJson(route, tables));
  await page.route('**/api/reservations/', route => fulfillJson(route, paginated(reservations)));
  await page.route(
    url => new URL(url).pathname.startsWith('/api/'),
    route => fulfillJson(route, []),
  );
}

async function mockBackofficeApis(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'backoffice-auth-storage',
      JSON.stringify({
        state: {
          accessToken: 'visual-token',
          role: 'GERANT',
          username: 'gerant',
          isAuthenticated: true,
          hasSession: true,
        },
        version: 0,
      }),
    );
  });
  await page.route('**/api/users/refresh/', route =>
    fulfillJson(route, { access: 'visual-token', role: 'GERANT', username: 'gerant' }),
  );
  await page.route('**/api/users/logout/', route => fulfillJson(route, {}));
  await page.route('**/api/analytics/dashboard/', route =>
    fulfillJson(route, {
      total_revenue: 12840,
      orders_today: 34,
      reservations_today: 8,
      average_order_value: 378,
      revenue_series: [],
      top_plats: [],
    }),
  );
  await page.route('**/api/categories/', route => fulfillJson(route, categories));
  await page.route(/\/api\/plats\/(?:\?.*)?$/, route => fulfillJson(route, paginated(plats)));
  await page.route(/\/api\/stock\/ingredients\/(?:\?.*)?$/, route => fulfillJson(route, paginated(ingredients)));
  await page.route('**/api/stock/plat-ingredients/', route => fulfillJson(route, []));
  await page.route(/\/api\/employes\/(?:\?.*)?$/, route => fulfillJson(route, paginated(employes)));
  await page.route(/\/api\/avis\/(?:\?.*)?$/, route => fulfillJson(route, paginated(avis)));
  await page.route(/\/api\/reservations\/(?:\?.*)?$/, route => fulfillJson(route, paginated(reservations)));
  await page.route('**/api/tables/', route => fulfillJson(route, tables));
  await page.route('**/api/plan-texts/', route => fulfillJson(route, []));
  await page.route(/\/api\/commandes\/(?:\?.*)?$/, route => fulfillJson(route, commandes));
  await page.route(
    url => new URL(url).pathname.startsWith('/api/'),
    route => fulfillJson(route, []),
  );
}

async function expectUsableViewport(page: Page, browserErrors: string[]) {
  await expect
    .poll(async () => page.locator('body').innerText(), {
      message: `Page should render visible text. Browser errors: ${browserErrors.join(' | ') || 'none'}`,
    })
    .not.toEqual('');

  const metrics = await page.evaluate(() => {
    const interactive = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')]
      .filter(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const isScreenReaderOnly =
          element.classList.contains('sr-only') && element !== document.activeElement;
        if (isScreenReaderOnly) return false;
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map(element => {
        const rect = element.getBoundingClientRect();
        return {
          label: (element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 80),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });

    return {
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      tinyTargets: interactive.filter(target => target.width < 44 || target.height < 44),
    };
  });

  expect(metrics.overflow, 'No global horizontal overflow').toBeLessThanOrEqual(2);
  expect(metrics.tinyTargets, 'Visible touch targets should be at least 44x44').toEqual([]);
}

test.describe('desktop and mobile visual audit', () => {
  for (const viewport of [
    { label: 'desktop', width: 1440, height: 900 },
    { label: 'mobile', width: 375, height: 812 },
  ]) {
    test(`client and backoffice stay usable on ${viewport.label}`, async ({ browser }, testInfo) => {
      const clientContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const clientPage = await clientContext.newPage();
      const clientErrors: string[] = [];
      clientPage.on('pageerror', error => clientErrors.push(error.message));
      clientPage.on('console', message => {
        if (message.type() === 'error') clientErrors.push(message.text());
      });
      await mockClientApis(clientPage);

      for (const path of ['/', '/menu', '/reservations', '/contact', '/login']) {
        await clientPage.goto(`${clientBaseURL}${path}`);
        await clientPage.waitForTimeout(500);
        await expectUsableViewport(clientPage, clientErrors);
      }

      await testInfo.attach(`client-home-${viewport.label}`, {
        body: await clientPage.screenshot(),
        contentType: 'image/png',
      });
      await clientContext.close();

      const loginContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const loginPage = await loginContext.newPage();
      const loginErrors: string[] = [];
      loginPage.on('pageerror', error => loginErrors.push(error.message));
      loginPage.on('console', message => {
        if (message.type() === 'error') loginErrors.push(message.text());
      });
      await loginPage.route('**/api/users/refresh/', route => fulfillJson(route, {}, 401));
      await loginPage.goto(`${backofficeBaseURL}/login`);
      await loginPage.waitForTimeout(500);
      await expectUsableViewport(loginPage, loginErrors);
      await testInfo.attach(`backoffice-login-${viewport.label}`, {
        body: await loginPage.screenshot(),
        contentType: 'image/png',
      });
      await loginContext.close();

      const backofficeContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const backofficePage = await backofficeContext.newPage();
      const backofficeErrors: string[] = [];
      backofficePage.on('pageerror', error => backofficeErrors.push(error.message));
      backofficePage.on('console', message => {
        if (message.type() === 'error') backofficeErrors.push(message.text());
      });
      await mockBackofficeApis(backofficePage);

      for (const path of ['/', '/menu', '/stock', '/avis', '/reservations', '/salle', '/kds']) {
        await backofficePage.goto(`${backofficeBaseURL}${path}`);
        await backofficePage.waitForTimeout(500);
        await expectUsableViewport(backofficePage, backofficeErrors);
      }

      await testInfo.attach(`backoffice-dashboard-${viewport.label}`, {
        body: await backofficePage.screenshot(),
        contentType: 'image/png',
      });
      await backofficeContext.close();
    });
  }
});
