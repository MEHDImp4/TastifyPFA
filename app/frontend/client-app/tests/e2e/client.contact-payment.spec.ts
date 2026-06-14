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
    await expectInvalid(page.getByLabel('Identité'));
    await expectInvalid(page.getByLabel('Coordonnée'));
    await expectInvalid(page.getByLabel('Sujet'));
    await expectInvalid(page.getByLabel('Message'));
  });

  test('submits successfully, shows loading, and resets the form', async ({ page }) => {
    await page.goto('/contact');

    await page.getByPlaceholder('Votre nom').fill('Mehdi');
    await page.getByPlaceholder('votre@email.com').fill('mehdi@example.com');
    await page.getByLabel('Sujet').selectOption('partenariat');
    await page.getByPlaceholder(/Votre message\.\.\./i).fill('Long-term partnership proposal');
    const submitButton = page.getByTestId('contact-submit');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(page.getByText('Manifeste Transmis. Notre concierge vous contactera.')).toBeVisible();
    await expect(page.getByPlaceholder('Votre nom')).toHaveValue('');
    await expect(page.getByLabel('Sujet')).toHaveValue('');
    await expect(page.getByPlaceholder(/Votre message\.\.\./i)).toHaveValue('');
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
    await expect(page.getByRole('button', { name: /Confirmer le Règlement/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Votre Addition/i })).toHaveCount(0);
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

    await page.getByRole('button', { name: /Confirmer le Règlement/i }).click();
    await expect(page.getByText('Autorisation Réussie')).toBeVisible();
    expect(payPayloads[0]).toMatchObject({ token: 'live-token', montant: '180.00' });

    payPayloads = [];
    await page.goto('/pay/live-token');
    await page.getByRole('button', { name: /^Partager$/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('90.00 DH');
    await page.getByRole('button', { name: /Augmenter le nombre de parts/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('60.00 DH');
    await page.getByRole('button', { name: /Confirmer le Règlement/i }).click();
    await expect(page.getByText('Autorisation Réussie')).toBeVisible();

    expect(payPayloads[0]).toMatchObject({
      token: 'live-token',
      montant: '60.00',
    });

    payPayloads = [];
    await page.goto('/pay/live-token');
    await page.getByRole('button', { name: /^Par Article$/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('0.00 DH');
    await expect(page.getByRole('button', { name: /Confirmer le Règlement/i })).toBeDisabled();

    await page.getByRole('button', { name: /Harira/i }).click();
    await page.getByRole('button', { name: /Tagine/i }).click();
    await expect(page.getByTestId('payment-payable-amount')).toHaveText('180.00 DH');
    await page.getByRole('button', { name: /Confirmer le Règlement/i }).click();

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
    const confirmButton = page.getByRole('button', { name: /Confirmer le Règlement/i });
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
    await page.getByRole('button', { name: /Confirmer le Règlement/i }).click();

    await expect(page.getByRole('heading', { name: /Paiement Sécurisé\./i })).toBeVisible();
    await page.getByRole('button', { name: /Retour à l'Accueil/i }).click();
    await expect(page).toHaveURL('/');
  });
});
