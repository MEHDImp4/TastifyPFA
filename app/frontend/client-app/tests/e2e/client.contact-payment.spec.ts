import { expect, test } from '@playwright/test';
import { mockConfig, mockRefreshFail } from './fixtures/api';

async function expectInvalid(locator: ReturnType<Parameters<typeof test>[0]['page']['getByLabel']>) {
  expect(await locator.evaluate((element) => !element.checkValidity())).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('contact form', () => {
  test('requires all fields before submit', async ({ page }) => {
    await page.goto('/contact');
    await page.getByTestId('contact-submit').click();

    await expect(page).toHaveURL('/contact');
    await expectInvalid(page.getByLabel('Identity'));
    await expectInvalid(page.getByLabel('Coordinate'));
    await expectInvalid(page.getByLabel('Subject'));
    await expectInvalid(page.getByLabel('Message'));
  });

  test('submits successfully, shows loading, and resets the form', async ({ page }) => {
    await page.goto('/contact');

    await page.getByPlaceholder('NOM_COMPLET').fill('Mehdi');
    await page.getByPlaceholder('EMAIL@DOMAIN.COM').fill('mehdi@example.com');
    await page.getByLabel('Subject').selectOption('partenariat');
    await page.getByPlaceholder(/DETAIL THE NUANCES/i).fill('Long-term partnership proposal');
    const submitButton = page.getByTestId('contact-submit');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(page.getByText('Manifest Transmitted. Our concierge will reach out.')).toBeVisible();
    await expect(page.getByPlaceholder('NOM_COMPLET')).toHaveValue('');
    await expect(page.getByLabel('Subject')).toHaveValue('');
    await expect(page.getByPlaceholder(/DETAIL THE NUANCES/i)).toHaveValue('');
  });
});

test.describe('payment portal', () => {
  test('surfaces invalid secure links', async ({ page }) => {
    await page.route('**/api/paiements/session/resolve/**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'not found' }),
      });
    });

    await page.goto('/pay/bad-token');
    await expect(page.getByRole('button', { name: /Confirm Payment/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Your Bill/i })).toHaveCount(0);
  });

  test('supports full payment, equal split, individual item split, and zero-total guard', async ({ page }) => {
    const session = {
      table_numero: '12',
      montant_restant: '180.00',
      lignes: [
        { id: 1, plat_nom: 'Harira', quantite: 1, montant_restant: '40.00' },
        { id: 2, plat_nom: 'Tagine', quantite: 2, montant_restant: '140.00' },
      ],
    };

    let payPayloads: Array<Record<string, unknown>> = [];

    await page.route('**/api/paiements/session/resolve/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session) });
    });
    await page.route('**/api/paiements/session/equal-split/', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}');
      const count = Number(body.split_count);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ share_amount: (180 / count).toFixed(2) }),
      });
    });
    await page.route('**/api/paiements/session/pay/', async (route) => {
      payPayloads.push(JSON.parse(route.request().postData() ?? '{}'));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/pay/live-token');
    await expect(page.getByTestId('payment-session-total')).toHaveText('180.00 DH');

    await page.getByRole('button', { name: /Confirm Payment/i }).click();
    await expect(page.getByText('Authorization Successful')).toBeVisible();
    expect(payPayloads[0]).toMatchObject({ token: 'live-token', montant: '180.00' });

    payPayloads = [];
    await page.goto('/pay/live-token');
    await page.getByRole('button', { name: /^Split$/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('90.00 DH');
    await page.getByRole('button', { name: /Increase split count/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('60.00 DH');
    await page.getByRole('button', { name: /Confirm Payment/i }).click();
    await expect(page.getByText('Authorization Successful')).toBeVisible();

    expect(payPayloads[0]).toMatchObject({
      token: 'live-token',
      montant: '60.00',
    });

    payPayloads = [];
    await page.goto('/pay/live-token');
    await page.getByRole('button', { name: /^Items$/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('0.00 DH');
    await expect(page.getByRole('button', { name: /Confirm Payment/i })).toBeDisabled();

    await page.getByRole('button', { name: /Harira/i }).click();
    await page.getByRole('button', { name: /Tagine/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('180.00 DH');
    await page.getByRole('button', { name: /Confirm Payment/i }).click();

    expect(payPayloads[0]).toMatchObject({
      token: 'live-token',
      montant: '180.00',
      contributions: [
        { ligne_id: 1, montant: '40.00' },
        { ligne_id: 2, montant: '140.00' },
      ],
    });
  });

  test('keeps payment submission single-shot when the first attempt fails slowly', async ({ page }) => {
    let payAttempts = 0;

    await page.route('**/api/paiements/session/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          table_numero: '7',
          montant_restant: '42.00',
          lignes: [{ id: 1, plat_nom: 'Mocktail', quantite: 1, montant_restant: '42.00' }],
        }),
      });
    });
    await page.route('**/api/paiements/session/pay/', async (route) => {
      payAttempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'PAYMENT_RETRY_LATER' }),
      });
    });

    await page.goto('/pay/retry-token');
    const confirmButton = page.getByRole('button', { name: /Confirm Payment/i });
    await confirmButton.dblclick();

    await expect(page.getByText('PAYMENT_RETRY_LATER')).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    expect(payAttempts).toBe(1);
  });

  test('shows successful payment confirmation screen', async ({ page }) => {
    await page.route('**/api/paiements/session/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          table_numero: '9',
          montant_restant: '25.00',
          lignes: [{ id: 1, plat_nom: 'Coffee', quantite: 1, montant_restant: '25.00' }],
        }),
      });
    });
    await page.route('**/api/paiements/session/pay/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/pay/success-token');
    await page.getByRole('button', { name: /Confirm Payment/i }).click();

    await expect(page.getByRole('heading', { name: /Payment Secured\./i })).toBeVisible();
    await page.getByRole('button', { name: /Return Home/i }).click();
    await expect(page).toHaveURL('/');
  });
});
