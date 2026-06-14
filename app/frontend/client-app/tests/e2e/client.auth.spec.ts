import { expect, test } from '@playwright/test';
import { AUTHENTICATED_STORAGE_STATE, mockConfig, mockRefreshFail } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('login form — validation', () => {
  test('shows error when both fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-username').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('login-error')).toContainText('Veuillez remplir tous les champs');
  });

  test('shows error when only username is filled', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-username').fill('testuser');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toContainText('Veuillez remplir tous les champs');
  });

  test('shows error when only password is filled', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('login-password').fill('somepass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toContainText('Veuillez remplir tous les champs');
  });
});

test.describe('login form — API responses', () => {
  test('shows error on invalid credentials (401)', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No active account found with the given credentials' }),
      });
    });

    await page.goto('/login');
    await page.getByTestId('login-username').fill('wronguser');
    await page.getByTestId('login-password').fill('wrongpass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('Identifiants invalides')).toBeVisible();
  });

  test('shows error when staff role tries to log in as client', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'tok', role: 'GERANT', username: 'gerant_test' }),
      });
    });
    await page.route('**/api/users/logout/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/login');
    await page.getByTestId('login-username').fill('gerant_test');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('Accès réservé aux clients')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('shows system error on server failure (5xx)', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    await page.goto('/login');
    await page.getByTestId('login-username').fill('someuser');
    await page.getByTestId('login-password').fill('somepass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('Une erreur est survenue')).toBeVisible();
  });

  test('successful CLIENT login navigates to home', async ({ page }) => {
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'valid-token', role: 'CLIENT', username: 'client_test' }),
      });
    });

    await page.goto('/login');
    await page.getByTestId('login-username').fill('client_test');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('register form — API responses', () => {
  test('shows backend detail and stays on register when registration fails', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'USERNAME_ALREADY_EXISTS' }),
      });
    });

    await page.goto('/register');
    await page.getByTestId('register-username').fill('taken_user');
    await page.getByTestId('register-email').fill('taken@example.com');
    await page.getByLabel('Mot de passe').fill('password123');
    await page.getByRole('button', { name: /Créer mon profil/i }).click();

    await expect(page).toHaveURL('/register');
    await expect(page.getByText('USERNAME_ALREADY_EXISTS')).toBeVisible();
  });

  test('registers a client account then logs in and redirects home', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 91, username: 'fresh_guest' }),
      });
    });
    await page.route('**/api/users/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'fresh-token', role: 'CLIENT', username: 'fresh_guest' }),
      });
    });

    await page.goto('/register');
    await page.getByTestId('register-username').fill('fresh_guest');
    await page.getByTestId('register-email').fill('fresh@example.com');
    await page.getByLabel('Mot de passe').fill('password123');
    await page.getByRole('button', { name: /Créer mon profil/i }).click();

    await expect(page).toHaveURL('/');
  });
});

test.describe('password reset flow — API responses', () => {
  test('submits forgot-password request and shows the confirmation state', async ({ page }) => {
    await page.route('**/api/users/request-reset/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'RESET_REQUEST_ACCEPTED' }),
      });
    });

    await page.goto('/forgot-password');
    await page.getByLabel("Email d'Enregistrement").fill('client_test@tastify.ma');
    await page.getByRole('button', { name: /Envoyer le Lien de Récupération/i }).click();

    await expect(page.getByText("Instructions envoyées si l'adresse est enregistrée.")).toBeVisible();
  });

  test('shows invalid state when the reset token cannot be validated', async ({ page }) => {
    await page.route('**/api/users/validate-reset-token/', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ token: ['RESET_TOKEN_INVALID'] }),
      });
    });

    await page.goto('/reset-password?uid=abc&token=broken-token');
    await expect(page.getByText('Ce lien de réinitialisation est invalide ou expiré.')).toBeVisible();
  });

  test('completes the reset flow with a valid token', async ({ page }) => {
    await page.route('**/api/users/validate-reset-token/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'RESET_TOKEN_VALID' }),
      });
    });
    await page.route('**/api/users/confirm-reset/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'RESET_PASSWORD_UPDATED' }),
      });
    });

    await page.goto('/reset-password?uid=valid-uid&token=valid-token');
    await page.getByLabel("Nouveau Code d'accès").fill('newpassword123');
    await page.getByLabel('Confirmer le Code').fill('newpassword123');
    await page.getByRole('button', { name: /Mettre à jour le Code/i }).click();

    await expect(page.getByText('Votre mot de passe a été mis à jour.')).toBeVisible();
  });

  test('surfaces password mismatch and token replay errors during confirmation', async ({ page }) => {
    await page.route('**/api/users/validate-reset-token/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'RESET_TOKEN_VALID' }),
      });
    });
    let attempts = 0;
    await page.route('**/api/users/confirm-reset/', async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ password_confirm: ['PASSWORD_CONFIRM_MISMATCH'] }),
        });
        return;
      }

      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ token: ['RESET_TOKEN_INVALID'] }),
      });
    });

    await page.goto('/reset-password?uid=valid-uid&token=valid-token');
    await page.getByLabel("Nouveau Code d'accès").fill('newpassword123');
    await page.getByLabel('Confirmer le Code').fill('differentpassword123');
    await page.getByRole('button', { name: /Mettre à jour le Code/i }).click();
    await expect(page.getByText('Les deux mots de passe ne correspondent pas.')).toBeVisible();

    await page.getByLabel('Confirmer le Code').fill('newpassword123');
    await page.getByRole('button', { name: /Mettre à jour le Code/i }).click();
    await expect(page.getByText('PASSWORD_CONFIRM_MISMATCH').first()).toBeVisible();

    await page.getByRole('button', { name: /Mettre à jour le Code/i }).click();
    await expect(page.getByText('Ce lien de réinitialisation est invalide ou expiré.').first()).toBeVisible();
  });
});

test.describe('authenticated user — route guards', () => {
  test.use({ storageState: AUTHENTICATED_STORAGE_STATE });

  test('authenticated user is redirected from /login to home', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/');
  });

  test('authenticated user is redirected from /register to home', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/');
  });

  test('authenticated user can access /account', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.goto('/account');
    await expect(page).toHaveURL('/account');
    await expect(page).not.toHaveURL(/login/);
  });
});
