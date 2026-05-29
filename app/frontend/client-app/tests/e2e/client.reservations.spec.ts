import { expect, test } from '@playwright/test';
import { AUTHENTICATED_STORAGE_STATE, mockConfig, mockRefreshFail } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('reservation journey', () => {
  test('guest users are gated and sent to login to reserve', async ({ page }) => {
    await page.goto('/reservations');

    await expect(page.getByRole('heading', { name: /Prenez place\./i })).toBeVisible();
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test.describe('authenticated user flow', () => {
    test.use({ storageState: AUTHENTICATED_STORAGE_STATE });

    test('completes a reservation and navigates to the account page', async ({ page }) => {
      let availabilityQuery = '';
      let reservationPayload: Record<string, unknown> | null = null;

      await page.route('**/api/reservations/available_tables/**', async (route) => {
        availabilityQuery = route.request().url();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 12, numero: 'A1', capacite: 4, est_disponible: true },
            { id: 15, numero: 'B4', capacite: 6, est_disponible: false },
          ]),
        });
      });

      await page.route('**/api/reservations/', async (route) => {
        reservationPayload = JSON.parse(route.request().postData() ?? '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 301 }),
        });
      });

      await page.goto('/reservations');
      await page.locator('input[type="date"]').fill('2026-06-05');
      await page.locator('input[type="time"]').fill('20:30');
      await page.getByRole('button', { name: /Voir les tables libres/i }).click();

      await expect.poll(() => availabilityQuery).toContain('nombre_personnes=2');
      await expect.poll(() => availabilityQuery).toContain('date=2026-06-05');
      await expect(page.getByRole('button', { name: /Confirmer mon choix/i })).toBeVisible();

      await page.getByRole('button', { name: /Confirmer mon choix/i }).click();
      await page.getByPlaceholder(/Allergies, anniversaire, préférences/i).fill('Window seat');
      await page.getByRole('button', { name: /Valider ma réservation/i }).click();

      await expect(page.getByRole('heading', { name: /C.est confirmé\./i })).toBeVisible();
      await expect(reservationPayload).toEqual({
        table: 12,
        date_reservation: '2026-06-05',
        heure_debut: '20:30',
        heure_fin: '21:00',
        nombre_personnes: 2,
        notes: 'Window seat',
      });

      await page.getByRole('button', { name: /Voir mes réservations/i }).click();
      await expect(page).toHaveURL('/account');
    });

    test('shows an error and stays in the flow when availability lookup fails', async ({ page }) => {
      let firstAttempt = true;
      await page.route('**/api/reservations/available_tables/**', async (route) => {
        if (firstAttempt) {
          firstAttempt = false;
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'boom' }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 41, numero: 'D3', capacite: 2, est_disponible: true }]),
        });
      });

      await page.goto('/reservations');
      await page.getByRole('button', { name: /Voir les tables libres/i }).click();

      await expect(page.getByText('Échec de la vérification de disponibilité')).toBeVisible();
      await expect(page.getByRole('button', { name: /Voir les tables libres/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Confirmer mon choix/i })).toHaveCount(0);

      await page.getByRole('button', { name: /Voir les tables libres/i }).click();
      await expect(page.getByRole('button', { name: /Confirmer mon choix/i })).toBeVisible();
    });

    test('shows backend reservation failure and preserves the confirmation step', async ({ page }) => {
      await page.route('**/api/reservations/available_tables/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 21, numero: 'C7', capacite: 4, est_disponible: true }]),
        });
      });

      await page.route('**/api/reservations/', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'TABLE_ALREADY_RESERVED' }),
        });
      });

      await page.goto('/reservations');
      await page.getByRole('button', { name: /Voir les tables libres/i }).click();
      await page.getByRole('button', { name: /Confirmer mon choix/i }).click();
      await page.getByPlaceholder(/Allergies, anniversaire, préférences/i).fill('Quiet corner');
      await page.getByRole('button', { name: /Valider ma réservation/i }).click();

      await expect(page.getByText('TABLE_ALREADY_RESERVED')).toBeVisible();
      await expect(page.getByRole('button', { name: /Valider ma réservation/i })).toBeVisible();
      await expect(page.getByPlaceholder(/Allergies, anniversaire, préférences/i)).toHaveValue('Quiet corner');
    });
  });
});
