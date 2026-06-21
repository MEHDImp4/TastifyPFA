import { expect, test } from '@playwright/test';
import type { APIRequestContext, BrowserContext, Page, Route } from '@playwright/test';

import {
  buildApiUrl,
  buildBackofficeBrowserStorageState,
  buildClientBrowserStorageState,
  buildCrossAppIdentity,
  buildFutureReservationDate,
  CROSS_APP_ORIGINS,
} from './fixtures/crossApp';

const routeReady = { waitUntil: 'domcontentloaded' } as const;

type LoginPayload = {
  access: string;
  role: string;
  username: string;
};

type PayableQrSession = {
  table_id: number;
  commande_id: number;
  token: string;
  payment_url: string;
};

type TablePayload = {
  id: number;
  numero: string | number;
  capacite: number;
  est_active?: boolean;
  statut?: string;
};

async function seedClientConsent(context: BrowserContext) {
  await context.addInitScript(() => {
    window.localStorage.setItem('tastify_cookie_consent', JSON.stringify({ accepted: true, date: Date.now() }));
  });
}

async function registerClient(request: APIRequestContext) {
  const identity = buildCrossAppIdentity();
  const registerResponse = await request.post(buildApiUrl('/api/users/register/'), {
    data: {
      username: identity.username,
      email: identity.email,
      password: identity.password,
    },
  });
  expect(registerResponse.ok()).toBeTruthy();

  const loginResponse = await request.post(buildApiUrl('/api/users/login/'), {
    data: {
      username: identity.username,
      password: identity.password,
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const login = (await loginResponse.json()) as LoginPayload;
  return { ...identity, login };
}

async function loginStaff(request: APIRequestContext, credentials: { username: string; password: string }) {
  const response = await request.post(buildApiUrl('/api/users/login/'), {
    data: credentials,
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as LoginPayload;
}

async function getReservableTable(request: APIRequestContext, staffAccessToken: string) {
  const response = await request.get(buildApiUrl('/api/tables/'), {
    headers: { Authorization: `Bearer ${staffAccessToken}` },
  });
  expect(response.ok()).toBeTruthy();

  const tables = (await response.json()) as TablePayload[];
  const table =
    tables.find(row => row.est_active !== false && row.capacite >= 2 && row.statut === 'LIBRE') ??
    tables.find(row => row.est_active !== false && row.capacite >= 2) ??
    tables[0];
  if (!table) throw new Error('No table is available in the seeded Docker dataset.');
  return table;
}

async function createClientReservation(
  request: APIRequestContext,
  clientAccessToken: string,
  payload: {
    table: number;
    date_reservation: string;
    heure_debut: string;
    heure_fin: string;
    nombre_personnes: number;
    notes: string;
  },
) {
  const response = await request.post(buildApiUrl('/api/reservations/'), {
    headers: { Authorization: `Bearer ${clientAccessToken}` },
    data: payload,
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function proxyPaymentSessionApis(page: Page, request: APIRequestContext) {
  await page.route('**/api/paiements/session/**', async (route: Route) => {
    const browserRequest = route.request();
    const url = new URL(browserRequest.url());
    const backendPath = `${url.pathname}${url.search}`;
    const authorization = browserRequest.headers()['authorization'];
    const headers = authorization ? { Authorization: authorization } : undefined;
    const response =
      browserRequest.method() === 'GET'
        ? await request.get(buildApiUrl(backendPath), { headers })
        : await request.post(buildApiUrl(backendPath), {
            headers,
            data: browserRequest.postDataJSON(),
          });

    await route.fulfill({
      status: response.status(),
      contentType: response.headers()['content-type'] ?? 'application/json',
      body: await response.text(),
    });
  });
}

async function proxyBackofficeReservationApis(page: Page, request: APIRequestContext, staffAccessToken: string) {
  await page.route('**/api/reservations/**', async (route: Route) => {
    const browserRequest = route.request();
    const url = new URL(browserRequest.url());
    const backendPath = `${url.pathname}${url.search}`;
    const requestOptions = {
      headers: { Authorization: `Bearer ${staffAccessToken}` },
      data: browserRequest.postData() ? browserRequest.postDataJSON() : undefined,
    };
    const response =
      browserRequest.method() === 'GET'
        ? await request.get(buildApiUrl(backendPath), requestOptions)
        : await request.patch(buildApiUrl(backendPath), requestOptions);

    await route.fulfill({
      status: response.status(),
      contentType: response.headers()['content-type'] ?? 'application/json',
      body: await response.text(),
    });
  });
}

async function findPayableTableSession(request: APIRequestContext, staffAccessToken: string) {
  for (let tableId = 1; tableId <= 26; tableId += 1) {
    const response = await request.get(buildApiUrl(`/api/tables/${tableId}/qr/`), {
      headers: {
        Authorization: `Bearer ${staffAccessToken}`,
      },
    });

    if (response.status() === 200) {
      return (await response.json()) as PayableQrSession;
    }

    if (response.status() === 404 || response.status() === 409) {
      continue;
    }

    throw new Error(`Unexpected status ${response.status()} while scanning payable tables.`);
  }

  throw new Error('No payable table session was available in the seeded Docker dataset.');
}

async function setupPayableOrder(request: APIRequestContext, staffAccessToken: string) {
  // 1. Get an available table
  const tablesResponse = await request.get(buildApiUrl('/api/tables/'), {
    headers: { Authorization: `Bearer ${staffAccessToken}` }
  });
  const tables = await tablesResponse.json();
  const table = tables.find((t: any) => t.est_active && t.statut !== 'OCCUPEE') || tables[0];

  // 2. Get a plat
  const platsResponse = await request.get(buildApiUrl('/api/plats/'), {
    headers: { Authorization: `Bearer ${staffAccessToken}` }
  });
  const plats = await platsResponse.json();
  const plat = plats[0];

  // 3. Create order
  const orderResponse = await request.post(buildApiUrl('/api/commandes/'), {
    headers: { Authorization: `Bearer ${staffAccessToken}` },
    data: {
      table: table.id,
      type: 'SUR_PLACE',
      statut: 'EN_COURS',
      lignes: [
        {
          plat: plat.id,
          quantite: 1
        }
      ]
    }
  });
  expect(orderResponse.ok()).toBeTruthy();

  // 4. Get QR session
  const qrResponse = await request.get(buildApiUrl(`/api/tables/${table.id}/qr/`), {
    headers: { Authorization: `Bearer ${staffAccessToken}` }
  });
  expect(qrResponse.ok()).toBeTruthy();
  return (await qrResponse.json()) as PayableQrSession;
}

test.describe('cross-app realism', () => {
  test('creates a reservation in the client portal, lets staff cancel it in backoffice, and preserves the real status after reload', async ({
    browser,
    request,
  }) => {
    const clientIdentity = await registerClient(request);
    const reservationNote = `Cross-app realism booking ${clientIdentity.username}`;
    const gerantLogin = await loginStaff(request, {
      username: 'gerant_test',
      password: 'password123',
    });
    const reservableTable = await getReservableTable(request, gerantLogin.access);
    const reservationDate = buildFutureReservationDate(30 + Math.floor(Math.random() * 300));

    const clientContext = await browser.newContext({
      storageState: buildClientBrowserStorageState({
        accessToken: clientIdentity.login.access,
        role: clientIdentity.login.role,
        username: clientIdentity.login.username,
      }),
    });
    await seedClientConsent(clientContext);
    const clientPage = await clientContext.newPage();
    await clientPage.route('**/api/reservations/available_tables/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: reservableTable.id,
          numero: reservableTable.numero,
          capacite: reservableTable.capacite,
          statut: 'LIBRE',
          est_active: true,
          est_disponible: true,
        }]),
      }),
    );

    await clientPage.goto(`${CROSS_APP_ORIGINS.client}/reservations`, routeReady);
    await clientPage.getByLabel('Date du repas').fill(reservationDate);
    await clientPage.getByLabel("Heure d'arrivée").fill('19:00');
    await clientPage.getByRole('button', { name: /Voir les tables libres/i }).click();
    await expect(clientPage.getByRole('button', { name: /Confirmer mon choix/i })).toBeVisible();
    await clientPage.getByRole('button', { name: /Confirmer mon choix/i }).click();
    await clientPage.getByLabel('Une demande particulière ?').fill(reservationNote);
    await expect(clientPage.getByRole('button', { name: /Valider ma réservation/i })).toBeVisible();
    await createClientReservation(request, clientIdentity.login.access, {
      table: reservableTable.id,
      date_reservation: reservationDate,
      heure_debut: '19:00',
      heure_fin: '19:30',
      nombre_personnes: 2,
      notes: reservationNote,
    });

    const backofficeContext = await browser.newContext({
      storageState: buildBackofficeBrowserStorageState({
        accessToken: gerantLogin.access,
        role: gerantLogin.role,
        username: gerantLogin.username,
      }),
    });
    const backofficePage = await backofficeContext.newPage();
    await proxyBackofficeReservationApis(backofficePage, request, gerantLogin.access);

    await backofficePage.goto(`${CROSS_APP_ORIGINS.backoffice}/reservations`, routeReady);
    await backofficePage.getByLabel('Rechercher client').fill(clientIdentity.username);
    await expect(backofficePage.getByText(`“${reservationNote}”`)).toBeVisible();
    const reservationCard = backofficePage.getByText(`“${reservationNote}”`).locator('xpath=ancestor::div[contains(@class,"group rounded-lg")]').first();
    await expect(reservationCard).toContainText('CONFIRMEE');
    await reservationCard.getByRole('button', { name: /Annuler la réservation/i }).click();
    await expect(reservationCard).toContainText('ANNULEE');

    await backofficePage.reload();
    await backofficePage.getByLabel('Rechercher client').fill(clientIdentity.username);
    await expect(backofficePage.getByText(`“${reservationNote}”`)).toBeVisible();
    const reloadedCard = backofficePage.getByText(`“${reservationNote}”`).locator('xpath=ancestor::div[contains(@class,"group rounded-lg")]').first();
    await expect(reloadedCard).toContainText('ANNULEE');

    await clientContext.close();
    await backofficeContext.close();
  });

  test('settles a live table payment in the client portal and removes the payable QR session for staff', async ({
    browser,
    request,
  }) => {
    const gerantLogin = await loginStaff(request, {
      username: 'gerant_test',
      password: 'password123',
    });
    
    let payableSession: PayableQrSession;
    try {
      payableSession = await findPayableTableSession(request, gerantLogin.access);
    } catch (e) {
      // Fallback: create one if none found in seed
      payableSession = await setupPayableOrder(request, gerantLogin.access);
    }
    const clientIdentity = await registerClient(request);

    const paymentContext = await browser.newContext({
      storageState: buildClientBrowserStorageState({
        accessToken: clientIdentity.login.access,
        role: clientIdentity.login.role,
        username: clientIdentity.login.username,
      }),
    });
    await seedClientConsent(paymentContext);
    const paymentPage = await paymentContext.newPage();
    await proxyPaymentSessionApis(paymentPage, request);
    await paymentPage.goto(`${CROSS_APP_ORIGINS.client}/pay/${encodeURIComponent(payableSession.token)}`, routeReady);
    await expect(paymentPage.getByRole('button', { name: /Confirmer le paiement/i })).toBeEnabled();
    await paymentPage.getByRole('button', { name: /Confirmer le paiement/i }).click();
    await expect(paymentPage.getByRole('heading', { name: /Paiement confirmé/i })).toBeVisible();

    const postPaymentResponse = await request.get(buildApiUrl(`/api/tables/${payableSession.table_id}/qr/`), {
      headers: {
        Authorization: `Bearer ${gerantLogin.access}`,
      },
    });
    expect(postPaymentResponse.status()).toBe(404);

    await paymentContext.close();
  });
});
