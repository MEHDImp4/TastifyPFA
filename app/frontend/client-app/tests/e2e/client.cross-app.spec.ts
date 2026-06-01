import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

import {
  buildApiUrl,
  buildBackofficeBrowserStorageState,
  buildClientBrowserStorageState,
  buildCrossAppIdentity,
  buildFutureReservationDate,
  CROSS_APP_ORIGINS,
} from './fixtures/crossApp';

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

    const clientContext = await browser.newContext({
      storageState: buildClientBrowserStorageState({
        accessToken: clientIdentity.login.access,
        role: clientIdentity.login.role,
        username: clientIdentity.login.username,
      }),
    });
    const clientPage = await clientContext.newPage();

    await clientPage.goto(`${CROSS_APP_ORIGINS.client}/reservations`);
    await clientPage.getByLabel('Temporal Window').fill(buildFutureReservationDate());
    await clientPage.getByLabel('Arrival Pivot').fill('19:00');
    await clientPage.getByRole('button', { name: /Analyze Availability/i }).click();
    await expect(clientPage.getByRole('button', { name: /Confirm Placement/i })).toBeVisible();
    await clientPage.getByRole('button', { name: /Confirm Placement/i }).click();
    await clientPage.getByLabel('Specific Manifest Requirements').fill(reservationNote);
    await clientPage.getByRole('button', { name: /Commit to Registry/i }).click();
    await expect(clientPage.getByRole('heading', { name: /Secured\./i })).toBeVisible();

    const backofficeContext = await browser.newContext({
      storageState: buildBackofficeBrowserStorageState({
        accessToken: gerantLogin.access,
        role: gerantLogin.role,
        username: gerantLogin.username,
      }),
    });
    const backofficePage = await backofficeContext.newPage();

    await backofficePage.goto(`${CROSS_APP_ORIGINS.backoffice}/reservations`);
    await expect(backofficePage.getByText(`“${reservationNote}”`)).toBeVisible();
    const reservationCard = backofficePage.getByText(`“${reservationNote}”`).locator('xpath=ancestor::div[contains(@class,"group rounded-lg")]').first();
    await expect(reservationCard).toContainText('CONFIRMEE');
    await reservationCard.getByRole('button', { name: 'CANCEL BOOKING' }).click();
    await expect(reservationCard).toContainText('ANNULEE');

    await backofficePage.reload();
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

    const paymentContext = await browser.newContext();
    const paymentPage = await paymentContext.newPage();
    await paymentPage.goto(payableSession.payment_url);
    await expect(paymentPage.getByRole('button', { name: /Confirm Payment/i })).toBeEnabled();
    await paymentPage.getByRole('button', { name: /Confirm Payment/i }).click();
    await expect(paymentPage.getByRole('heading', { name: /Payment Secured\./i })).toBeVisible();

    const postPaymentResponse = await request.get(buildApiUrl(`/api/tables/${payableSession.table_id}/qr/`), {
      headers: {
        Authorization: `Bearer ${gerantLogin.access}`,
      },
    });
    expect(postPaymentResponse.status()).toBe(404);

    await paymentContext.close();
  });
});
