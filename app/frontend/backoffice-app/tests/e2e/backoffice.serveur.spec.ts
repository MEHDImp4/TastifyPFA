import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const expectNoBlockingViolations = async (page: Parameters<typeof test>[0]['page']) => {
  const results = await new AxeBuilder({ page }).include('main').analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    impact === 'critical' || impact === 'serious',
  );

  expect(blockingViolations).toEqual([]);
};

test.describe('serveur browser workflows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    await page.route('**/api/users/logout/', async route => {
      await route.fulfill({ status: 200 });
    });
    await page.route('**/api/users/refresh/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'test-token', role: 'SERVEUR', username: 'serveur_test' }),
      });
    });
    // Default tables mock so any test that navigates to /salle (serveur home) doesn't hang
    await page.route('**/api/tables/', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/plan-texts/', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Default mock for status updates (fire to kitchen)
    await page.route(/\/api\/commandes\/\d+\/$/, async (route) => {
      if (route.request().method() === 'PATCH') {
        const id = route.request().url().split('/').filter(Boolean).pop();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: Number(id), statut: route.request().postDataJSON()?.statut || 'EN_CUISINE' }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('lands on the salle route and only sees serveur navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/salle$/);
    await expect(page.getByRole('heading', { name: 'Plan de Salle', includeHidden: true })).toBeVisible();

    await expect(page.getByTestId('nav-salle')).toBeVisible();
    await expect(page.getByTestId('nav-reservations')).toBeVisible();
    await expect(page.getByTestId('nav-dashboard')).toHaveCount(0);
    await expect(page.getByTestId('nav-categories')).toHaveCount(0);
    await expect(page.getByTestId('nav-kds')).toHaveCount(0);
  });

  test('keeps the reservations nav active after a direct route load', async ({ page }) => {
    await page.route('**/api/reservations/', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.goto('/reservations');

    await expect(page).toHaveURL(/\/reservations$/);
    await expect(page.getByTestId('nav-reservations')).toHaveClass(/border-primary/);
    await expect(page.getByRole('heading', { name: 'Reservations Admin' })).toBeVisible();
  });

  test('renders mocked salle table states and opens ordering from a free table', async ({ page }) => {
    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 41, numero: 11, capacite: 4, statut: 'LIBRE', pos_x: 25, pos_y: 25, est_active: true },
          { id: 42, numero: 12, capacite: 6, statut: 'OCCUPEE', pos_x: 55, pos_y: 40, est_active: true },
          { id: 43, numero: 14, capacite: 2, statut: 'RESERVEE', pos_x: 75, pos_y: 55, est_active: true },
        ]),
      });
    });
    await page.route('**/api/plan-texts/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/commandes/?table=41*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/salle');

    const freeTable = page.getByTestId('table-11');
    const occupiedTable = page.getByTestId('table-12');
    const reservedTable = page.getByTestId('table-14');

    await expect(freeTable).toBeVisible();
    await expect(occupiedTable).toBeVisible();
    await expect(reservedTable).toBeVisible();
    await expect(freeTable).toContainText('11');
    await expect(occupiedTable).toContainText('12');
    await expect(reservedTable).toContainText('14');
    await expect(occupiedTable).toHaveClass(/bg-amber/);
    await expect(reservedTable).toHaveClass(/bg-aged-paper/);

    await freeTable.click({ force: true });
    await expect(page).toHaveURL(/\/ordering\/41$/);
    await expect(page.getByText('Active Ticket')).toBeVisible();
  });

  test('keeps serveur users on allowed routes and redirects forbidden ones', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page).toHaveURL(/\/reservations$/);
    await expect(page.getByRole('heading', { name: 'Reservations Admin' })).toBeVisible();

    await page.goto('/ordering/1');
    await expect(page).toHaveURL(/\/ordering\/1$/);
    await expect(page.getByText('Active Ticket')).toBeVisible();
    await expect(page.getByTestId('order-submit')).toBeVisible();

    for (const forbiddenPath of ['/categories', '/stock', '/hr', '/avis', '/settings', '/menu', '/kds']) {
      await page.goto(forbiddenPath);
      await expect(page).toHaveURL(/\/salle$/);
    }
  });

  test('redirects an authenticated serveur away from login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/salle$/);
  });

  test('keeps serveur logout working after visiting a secondary route', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page).toHaveURL(/\/reservations$/);

    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('keeps serveur users on the same allowed route after a hard refresh', async ({ page }) => {
    await page.goto('/salle');
    await page.reload();

    await expect(page).toHaveURL(/\/salle$/);
    await expect(page.getByRole('heading', { name: 'Plan de Salle', includeHidden: true })).toBeVisible();
  });

  test('keeps an ordering handoff stable after a hard refresh', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 81, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });
    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 82, nom: 'Couscous Maison', prix: '18.00', temps_preparation: 12, categorie: 81, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });
    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 41, numero: 11, capacite: 4, statut: 'LIBRE', est_active: true }]),
      });
    });
    await page.route(/\/api\/commandes\/\?table=41/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 981, statut: 'EN_COURS' }]),
      });
    });
    await page.route('**/api/commandes/981/add_items/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/ordering/41');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Active Ticket')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/ordering\/41$/);

    await page.getByTestId('menu-catalog').getByRole('button', { name: /Couscous Maison/i }).click({ force: true });
    await expect(page.getByTestId('cart-item-82')).toBeVisible();
    await page.getByTestId('order-submit').click();
    await expect(page).toHaveURL(/\/salle$/);
  });

  test('has no critical or serious axe violations on the salle page', async ({ page }) => {
    // tables mock is set globally in beforeEach
    await page.goto('/salle');

    await expect(page.getByRole('heading', { name: 'Plan de Salle', includeHidden: true })).toBeVisible();
    await expectNoBlockingViolations(page);
  });

  test('keeps the salle page usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/salle');

    const menuButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-menu') }).first();
    await menuButton.click();

    await expect(page.getByTestId('nav-salle')).toBeVisible();
    await expect(page.getByText(/Table/i).first()).toBeVisible();
  });

  test('filters reservations and applies confirm then cancel transitions', async ({ page }) => {
    const reservations = [
      {
        id: 7101,
        user_username: 'Alice Martin',
        statut: 'EN_ATTENTE',
        date_reservation: '2026-05-19',
        heure_debut: '19:30',
        heure_fin: '21:00',
        nombre_personnes: 4,
        table: 3,
        table_numero: 3,
        notes: 'Anniversaire',
      },
      {
        id: 7102,
        user_username: 'Yassine Haddad',
        statut: 'CONFIRMEE',
        date_reservation: '2026-05-19',
        heure_debut: '20:00',
        heure_fin: '21:30',
        nombre_personnes: 2,
        table: 5,
        table_numero: 5,
        notes: '',
      },
    ];

    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reservations),
      });
    });

    await page.route('**/api/reservations/*/confirmer/', async (route) => {
      const id = Number(route.request().url().match(/reservations\/(\d+)\/confirmer/)?.[1]);
      const target = reservations.find((reservation) => reservation.id === id);
      if (target) {
        target.statut = 'CONFIRMEE';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target),
      });
    });

    await page.route('**/api/reservations/*/annuler/', async (route) => {
      const id = Number(route.request().url().match(/reservations\/(\d+)\/annuler/)?.[1]);
      const target = reservations.find((reservation) => reservation.id === id);
      if (target) {
        target.statut = 'ANNULEE';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target),
      });
    });

    await page.goto('/reservations');
    await page.getByRole('button', { name: 'EN ATTENTE', exact: true }).click();
    await expect(page.getByText('Alice Martin')).toBeVisible();
    await expect(page.getByText('Yassine Haddad')).toHaveCount(0);

    await page.getByRole('button', { name: 'CONFIRM', exact: true }).click();
    await expect(page.getByText('No Bookings Logged')).toBeVisible();

    await page.getByRole('button', { name: 'CONFIRMEE', exact: true }).click();
    await expect(page.getByText('Alice Martin')).toBeVisible();
    await expect(page.getByText('Yassine Haddad')).toBeVisible();
    await expect(page.getByRole('button', { name: 'CANCEL BOOKING', exact: true })).toHaveCount(2);

    await page.getByRole('button', { name: 'CANCEL BOOKING', exact: true }).first().click();
    await expect(page.getByText('Alice Martin')).toHaveCount(0);
  });

  test('keeps reservation search and status filter stable after a refreshing status mutation', async ({ page }) => {
    const reservations = [
      {
        id: 7401,
        user_username: 'Amina Refresh',
        statut: 'EN_ATTENTE',
        date_reservation: '2026-05-19',
        heure_debut: '19:30',
        heure_fin: '21:00',
        nombre_personnes: 2,
        table: 3,
        table_numero: 3,
        notes: 'Birthday',
      },
      {
        id: 7402,
        user_username: 'Amina Confirmed',
        statut: 'CONFIRMEE',
        date_reservation: '2026-05-19',
        heure_debut: '20:00',
        heure_fin: '21:00',
        nombre_personnes: 4,
        table: 4,
        table_numero: 4,
        notes: '',
      },
    ];

    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reservations),
      });
    });

    await page.route('**/api/reservations/*/confirmer/', async (route) => {
      reservations[0].statut = 'CONFIRMEE';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reservations[0]),
      });
    });

    await page.goto('/reservations');
    const searchInput = page.getByPlaceholder('SEARCH GUEST IDENTITY...');
    const reservationsGrid = page.locator('.grid.grid-cols-1.gap-4').first();

    await searchInput.fill('amina');
    await page.getByRole('button', { name: 'EN ATTENTE', exact: true }).click();
    await expect(reservationsGrid.getByText('Amina Refresh')).toBeVisible();
    await expect(reservationsGrid.getByText('Amina Confirmed')).toHaveCount(0);

    await page.getByRole('button', { name: 'CONFIRM', exact: true }).click();
    await expect(searchInput).toHaveValue('amina');
    await expect(reservationsGrid.getByText('Amina Refresh')).toHaveCount(0);
    await expect(page.getByText('No Bookings Logged')).toBeVisible();

    await page.getByRole('button', { name: 'CONFIRMEE', exact: true }).click();
    await expect(searchInput).toHaveValue('amina');
    await expect(reservationsGrid.getByText('Amina Refresh')).toBeVisible();
    await expect(reservationsGrid.getByText('Amina Confirmed')).toBeVisible();
  });

  test('renders the reservations empty state when no bookings are returned', async ({ page }) => {
    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/reservations');
    await expect(page.getByText('No Bookings Logged')).toBeVisible();
  });

  test('keeps reservation actions stable when confirm and cancel fail', async ({ page }) => {
    const reservations = [
      {
        id: 7201,
        user_username: 'Sara Bennani',
        statut: 'EN_ATTENTE',
        date_reservation: '2026-05-19',
        heure_debut: '18:30',
        heure_fin: '20:00',
        nombre_personnes: 3,
        table: 4,
        table_numero: 4,
        notes: 'Fenetre',
      },
      {
        id: 7202,
        user_username: 'Omar Idrissi',
        statut: 'CONFIRMEE',
        date_reservation: '2026-05-19',
        heure_debut: '20:30',
        heure_fin: '22:00',
        nombre_personnes: 2,
        table: 6,
        table_numero: 6,
        notes: '',
      },
    ];

    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reservations),
      });
    });

    await page.route('**/api/reservations/*/confirmer/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'confirm failed' }),
      });
    });

    await page.route('**/api/reservations/*/annuler/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'cancel failed' }),
      });
    });

    await page.goto('/reservations');
    await page.getByRole('button', { name: 'CONFIRM', exact: true }).click();
    await expect(page.getByText('Sara Bennani')).toBeVisible();
    await expect(page.getByRole('button', { name: 'CONFIRM', exact: true })).toHaveCount(1);

    const confirmedBookingCancelButton = page.getByRole('button', {
      name: /^CANCEL BOOKING$/,
    });

    await confirmedBookingCancelButton.click();
    await expect(page.getByText('Omar Idrissi')).toBeVisible();
    await expect(confirmedBookingCancelButton).toHaveCount(1);
  });

  test('filters reservations by client search and cancelled status', async ({ page }) => {
    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 7301,
            user_username: 'Nadia Search',
            statut: 'ANNULEE',
            date_reservation: '2026-05-19',
            heure_debut: '19:00',
            heure_fin: '20:30',
            nombre_personnes: 5,
            table: 8,
            table_numero: 8,
            notes: 'Allergies',
          },
          {
            id: 7302,
            user_username: 'Karim Visible',
            statut: 'CONFIRMEE',
            date_reservation: '2026-05-19',
            heure_debut: '20:00',
            heure_fin: '21:30',
            nombre_personnes: 2,
            table: 2,
            table_numero: 2,
            notes: '',
          },
        ]),
      });
    });

    await page.goto('/reservations');
    const reservationsGrid = page.locator('.grid.grid-cols-1.gap-4').first();
    await page.getByPlaceholder('SEARCH GUEST IDENTITY...').fill('nadia');
    await expect(page.getByPlaceholder('SEARCH GUEST IDENTITY...')).toHaveValue('nadia');
    await expect(reservationsGrid.getByText('Nadia Search')).toBeVisible();
    await expect(reservationsGrid.getByText('Karim Visible')).toHaveCount(0);
    await expect(reservationsGrid.getByText('“Allergies”')).toBeVisible();

    await page.getByPlaceholder('SEARCH GUEST IDENTITY...').fill('');
    await page.getByRole('button', { name: 'ANNULEE' }).click();
    await expect(reservationsGrid.getByText('Nadia Search')).toBeVisible();
    await expect(reservationsGrid.getByText('Karim Visible')).toHaveCount(0);
  });

  test('normalizes reservation search input and supports fallback client names', async ({ page }) => {
    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 7311,
            user_username: 'Nadia Search',
            statut: 'CONFIRMEE',
            date_reservation: '2026-05-19',
            heure_debut: '19:00',
            heure_fin: '20:30',
            nombre_personnes: 5,
            table: 8,
            table_numero: 8,
            notes: '',
          },
          {
            id: 7312,
            user_username: null,
            statut: 'EN_ATTENTE',
            date_reservation: '2026-05-19',
            heure_debut: '20:00',
            heure_fin: '21:00',
            nombre_personnes: 2,
            table: 3,
            table_numero: 3,
            notes: 'Sans gluten',
          },
        ]),
      });
    });

    await page.goto('/reservations');
    const reservationsGrid = page.locator('.grid.grid-cols-1.gap-4').first();
    const searchInput = page.getByPlaceholder('SEARCH GUEST IDENTITY...');

    await searchInput.fill('  naDIA  ');
    await expect(searchInput).toHaveValue('  naDIA  ');
    await expect(reservationsGrid.getByText('Nadia Search')).toBeVisible();
    await expect(reservationsGrid.getByText('ANONYMOUS GUEST', { exact: true })).toHaveCount(0);

    await searchInput.fill('guest');
    await expect(reservationsGrid.getByText('Nadia Search')).toHaveCount(0);
    await expect(reservationsGrid.getByText('ANONYMOUS GUEST', { exact: true })).toBeVisible();
    await expect(reservationsGrid.getByText('“Sans gluten”')).toBeVisible();
  });

  test('moves a confirmed reservation into the cancelled tab after cancellation', async ({ page }) => {
    const reservations = [
      {
        id: 7321,
        user_username: 'Salma Transit',
        statut: 'CONFIRMEE',
        date_reservation: '2026-05-19',
        heure_debut: '19:30',
        heure_fin: '21:00',
        nombre_personnes: 4,
        table: 5,
        table_numero: 5,
        notes: '',
      },
    ];

    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reservations),
      });
    });

    await page.route('**/api/reservations/*/annuler/', async (route) => {
      reservations[0].statut = 'ANNULEE';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reservations[0]),
      });
    });

    await page.goto('/reservations');
    const reservationsGrid = page.locator('.grid.grid-cols-1.gap-4').first();

    await page.getByRole('button', { name: 'CONFIRMEE', exact: true }).click();
    await expect(reservationsGrid.getByText('Salma Transit')).toBeVisible();

    await page.getByRole('button', { name: 'CANCEL BOOKING', exact: true }).click();
    await expect(reservationsGrid.getByText('Salma Transit')).toHaveCount(0);
    await expect(page.getByText('No Bookings Logged')).toBeVisible();

    await page.getByRole('button', { name: 'ANNULEE', exact: true }).click();
    await expect(reservationsGrid.getByText('Salma Transit')).toBeVisible();
  });

  test('keeps reservation statuses isolated across tabs when an action fails', async ({ page }) => {
    const reservations = [
      {
        id: 7331,
        user_username: 'Amina Pending',
        statut: 'EN_ATTENTE',
        date_reservation: '2026-05-19',
        heure_debut: '18:00',
        heure_fin: '19:30',
        nombre_personnes: 2,
        table: 1,
        table_numero: 1,
        notes: '',
      },
      {
        id: 7332,
        user_username: 'Rachid Confirmed',
        statut: 'CONFIRMEE',
        date_reservation: '2026-05-19',
        heure_debut: '20:00',
        heure_fin: '21:30',
        nombre_personnes: 4,
        table: 6,
        table_numero: 6,
        notes: '',
      },
      {
        id: 7333,
        user_username: 'Leila Cancelled',
        statut: 'ANNULEE',
        date_reservation: '2026-05-19',
        heure_debut: '21:00',
        heure_fin: '22:00',
        nombre_personnes: 3,
        table: 7,
        table_numero: 7,
        notes: '',
      },
    ];

    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reservations),
      });
    });

    await page.route('**/api/reservations/*/confirmer/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'confirm failed' }),
      });
    });

    await page.goto('/reservations');
    const reservationsGrid = page.locator('.grid.grid-cols-1.gap-4').first();

    await page.getByRole('button', { name: 'EN ATTENTE' }).click();
    await page.getByRole('button', { name: 'CONFIRM', exact: true }).click();
    await expect(reservationsGrid.getByText('Amina Pending')).toBeVisible();

    await page.getByRole('button', { name: 'CONFIRMEE' }).click();
    await expect(reservationsGrid.getByText('Rachid Confirmed')).toBeVisible();
    await expect(reservationsGrid.getByText('Amina Pending')).toHaveCount(0);

    await page.getByRole('button', { name: 'ANNULEE' }).click();
    await expect(reservationsGrid.getByText('Leila Cancelled')).toBeVisible();
    await expect(reservationsGrid.getByText('Amina Pending')).toHaveCount(0);
  });

  test('filters fallback client identities by active reservation status', async ({ page }) => {
    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 7341,
            user_username: null,
            statut: 'EN_ATTENTE',
            date_reservation: '2026-05-19',
            heure_debut: '18:30',
            heure_fin: '20:00',
            nombre_personnes: 2,
            table: 3,
            table_numero: 3,
            notes: '',
          },
          {
            id: 7342,
            user_username: null,
            statut: 'ANNULEE',
            date_reservation: '2026-05-19',
            heure_debut: '20:30',
            heure_fin: '22:00',
            nombre_personnes: 5,
            table: 9,
            table_numero: 9,
            notes: '',
          },
          {
            id: 7343,
            user_username: 'Nadia Named',
            statut: 'EN_ATTENTE',
            date_reservation: '2026-05-19',
            heure_debut: '19:00',
            heure_fin: '20:00',
            nombre_personnes: 3,
            table: 4,
            table_numero: 4,
            notes: '',
          },
        ]),
      });
    });

    await page.goto('/reservations');
    const reservationsGrid = page.locator('.grid.grid-cols-1.gap-4').first();
    const searchInput = page.getByPlaceholder('SEARCH GUEST IDENTITY...');

    await searchInput.fill('guest');
    await expect(reservationsGrid.getByText(/ANONYMOUS GUEST/i)).toHaveCount(2);
    await expect(reservationsGrid.getByText('Nadia Named')).toHaveCount(0);

    await page.getByRole('button', { name: 'EN ATTENTE', exact: true }).click();
    await expect(reservationsGrid.getByText(/ANONYMOUS GUEST/i)).toHaveCount(1);
    await expect(reservationsGrid.getByText('Nadia Named')).toHaveCount(0);

    await page.getByRole('button', { name: 'ANNULEE', exact: true }).click();
    await expect(reservationsGrid.getByText(/ANONYMOUS GUEST/i)).toHaveCount(1);
    await expect(reservationsGrid.getByText('Nadia Named')).toHaveCount(0);
  });

  test('distinguishes fallback client matches from real client names during search normalization', async ({ page }) => {
    await page.route('**/api/reservations/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 7351,
            user_username: 'ANONYMOUS GUEST Karim',
            statut: 'CONFIRMEE',
            date_reservation: '2026-05-19',
            heure_debut: '19:15',
            heure_fin: '20:45',
            nombre_personnes: 2,
            table: 2,
            table_numero: 2,
            notes: '',
          },
          {
            id: 7352,
            user_username: null,
            statut: 'CONFIRMEE',
            date_reservation: '2026-05-19',
            heure_debut: '21:00',
            heure_fin: '22:30',
            nombre_personnes: 4,
            table: 8,
            table_numero: 8,
            notes: '',
          },
        ]),
      });
    });

    await page.goto('/reservations');
    const reservationsGrid = page.locator('.grid.grid-cols-1.gap-4').first();
    const searchInput = page.getByPlaceholder('SEARCH GUEST IDENTITY...');

    await searchInput.fill('  gUeSt  ');
    await expect(reservationsGrid.getByText('ANONYMOUS GUEST Karim')).toBeVisible();
    await expect(reservationsGrid.getByText(/ANONYMOUS GUEST/i).nth(1)).toBeVisible();

    await searchInput.fill('karim');
    await expect(reservationsGrid.getByText('ANONYMOUS GUEST Karim')).toBeVisible();
    await expect(reservationsGrid.getByText('ANONYMOUS GUEST', { exact: true })).toHaveCount(0);
  });

  test('builds and clears an ordering cart with search and quantity controls', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 21, nom: 'Entrees', ordre_affichage: 1, est_active: true },
          { id: 22, nom: 'Desserts', ordre_affichage: 2, est_active: true },
        ]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 31, nom: 'Salade fraiche', prix: '12.50', temps_preparation: 8, categorie: 21, image: null, est_active: true, est_disponible: true },
          { id: 32, nom: 'Soupe du jour', prix: '9.00', temps_preparation: 6, categorie: 21, image: null, est_active: true, est_disponible: true },
          { id: 33, nom: 'Tiramisu maison', prix: '14.00', temps_preparation: 4, categorie: 22, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');

    await expect(cart).toBeVisible({ timeout: 15000 });

    await page.getByPlaceholder('SEARCH MENU...').fill('salade');
    const saladeCard = catalog.getByRole('button', { name: /Salade fraiche/i });
    await expect(saladeCard).toBeVisible();
    await expect(catalog.getByText('Soupe du jour')).toHaveCount(0);

    await saladeCard.click({ force: true });
    await expect(cart.locator('p', { hasText: 'Salade fraiche' })).toBeVisible();
    const cartItem = cart.getByTestId('cart-item-31');
    await expect(cartItem.getByText('13 DH')).toBeVisible();

    await cartItem.getByTestId('qty-plus').click();
    await expect(cartItem.getByText('2x')).toBeVisible();
    await cartItem.getByTestId('qty-minus').click();
    await expect(cartItem.getByText('1x')).toBeVisible();

    await cartItem.getByTestId('remove-item').click();
    await expect(page.getByText(/Ticket Buffer Empty/i)).toBeVisible({ timeout: 15000 });
  });

  test('keeps ordering quantities floored at one and totals mixed carts correctly', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 61, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 71, nom: 'Poulet grille', prix: '15.00', temps_preparation: 12, categorie: 61, image: null, est_active: true, est_disponible: true },
          { id: 72, nom: 'The menthe', prix: '4.00', temps_preparation: 2, categorie: 61, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');

    await catalog.getByRole('button', { name: /Poulet grille/i }).click({ force: true });
    await catalog.getByRole('button', { name: /The menthe/i }).click({ force: true });
    await expect(cart.getByText('19 DH').last()).toBeVisible();

    const pouletItem = cart.getByTestId('cart-item-71');

    await pouletItem.getByTestId('qty-minus').click();
    await expect(pouletItem.getByText('15 DH')).toBeVisible();
    await expect(pouletItem.getByText('1x')).toBeVisible();
    await expect(cart.getByText('19 DH').last()).toBeVisible();
  });

  test('intersects ordering category switches with text search', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 101, nom: 'Entrees', ordre_affichage: 1, est_active: true },
          { id: 102, nom: 'Desserts', ordre_affichage: 2, est_active: true },
        ]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 111, nom: 'Salade orange', prix: '10.00', temps_preparation: 5, categorie: 101, image: null, est_active: true, est_disponible: true },
          { id: 112, nom: 'Tarte orange', prix: '13.00', temps_preparation: 7, categorie: 102, image: null, est_active: true, est_disponible: true },
          { id: 113, nom: 'Mousse chocolat', prix: '12.00', temps_preparation: 4, categorie: 102, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    await page.getByPlaceholder('SEARCH MENU...').fill('orange');
    await expect(catalog.getByText('Salade orange')).toBeVisible();
    await expect(catalog.getByText('Tarte orange')).toHaveCount(0);

    await catalog.getByRole('button', { name: 'Desserts' }).click();
    await expect(catalog.getByText('Salade orange')).toHaveCount(0);
    await expect(catalog.getByText('Tarte orange')).toBeVisible();
    await expect(catalog.getByText('Mousse chocolat')).toHaveCount(0);
  });

  test('preserves cart state while category tabs change', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 121, nom: 'Entrees', ordre_affichage: 1, est_active: true },
          { id: 122, nom: 'Desserts', ordre_affichage: 2, est_active: true },
        ]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 131, nom: 'Briouates', prix: '11.00', temps_preparation: 6, categorie: 121, image: null, est_active: true, est_disponible: true },
          { id: 132, nom: 'Corne de gazelle', prix: '9.50', temps_preparation: 4, categorie: 122, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');
    await catalog.getByRole('button', { name: /Briouates/i }).click({ force: true });

    await expect(cart.locator('p', { hasText: 'Briouates' })).toBeVisible();
    await expect(cart.getByText('11 DH').last()).toBeVisible();

    await catalog.getByRole('button', { name: 'Desserts' }).click();
    await expect(catalog.getByText('Corne de gazelle')).toBeVisible();
    await expect(cart.locator('p', { hasText: 'Briouates' })).toHaveCount(1);
    await expect(cart.getByText('11 DH').last()).toBeVisible();

    await catalog.getByRole('button', { name: 'Entrees' }).click();
    await expect(catalog.getByRole('button', { name: /Briouates/i })).toBeVisible();
    await expect(cart.locator('p', { hasText: 'Briouates' })).toHaveCount(1);
    await expect(cart.getByText('11 DH').last()).toBeVisible();
  });

  test('preserves cart state while catalog search hides and reveals items', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 141, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 151, nom: 'Tagine citron', prix: '19.00', temps_preparation: 15, categorie: 141, image: null, est_active: true, est_disponible: true },
          { id: 152, nom: 'Pastilla mer', prix: '21.00', temps_preparation: 17, categorie: 141, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');
    await catalog.getByRole('button', { name: /Tagine citron/i }).click({ force: true });

    const searchInput = page.getByPlaceholder('SEARCH MENU...');

    await searchInput.fill('pastilla');
    await expect(catalog.getByRole('button', { name: /Tagine citron/i })).toHaveCount(0);
    await expect(catalog.getByRole('button', { name: /Pastilla mer/i })).toBeVisible();
    await expect(cart.locator('p', { hasText: 'Tagine citron' })).toBeVisible();
    await expect(cart.getByText('19 DH').last()).toBeVisible();

    await searchInput.fill('');
    await expect(catalog.getByRole('button', { name: /Tagine citron/i })).toBeVisible();
    await expect(cart.locator('p', { hasText: 'Tagine citron' })).toBeVisible();
    await expect(cart.getByText('19 DH').last()).toBeVisible();
  });

  test('preserves a multi-item cart across category and search intersections', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 161, nom: 'Entrees', ordre_affichage: 1, est_active: true },
          { id: 162, nom: 'Desserts', ordre_affichage: 2, est_active: true },
        ]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 171, nom: 'Salade orange', prix: '10.00', temps_preparation: 5, categorie: 161, image: null, est_active: true, est_disponible: true },
          { id: 172, nom: 'Tarte orange', prix: '13.00', temps_preparation: 7, categorie: 162, image: null, est_active: true, est_disponible: true },
          { id: 173, nom: 'Mousse cacao', prix: '12.00', temps_preparation: 4, categorie: 162, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');
    await catalog.getByRole('button', { name: /Salade orange/i }).click({ force: true });
    await catalog.getByRole('button', { name: 'Desserts', exact: true }).click();
    await catalog.getByRole('button', { name: /Tarte orange/i }).click({ force: true });

    const searchInput = page.getByPlaceholder('SEARCH MENU...');
    await expect(cart.locator('p', { hasText: 'Salade orange' })).toBeVisible();
    await expect(cart.locator('p', { hasText: 'Tarte orange' })).toBeVisible();
    await expect(cart.getByText('23 DH').last()).toBeVisible();

    await searchInput.fill('orange');
    await expect(catalog.getByRole('button', { name: /Tarte orange/i })).toBeVisible();
    await expect(catalog.getByRole('button', { name: /Mousse cacao/i })).toHaveCount(0);
    await expect(cart.getByText('23 DH').last()).toBeVisible();

    await catalog.getByRole('button', { name: 'Entrees', exact: true }).click();
    await expect(cart.locator('p', { hasText: 'Salade orange' })).toBeVisible();
    await expect(cart.locator('p', { hasText: 'Tarte orange' })).toBeVisible();
    await expect(cart.getByText('23 DH').last()).toBeVisible();

    await searchInput.fill('');
    await catalog.getByRole('button', { name: 'Desserts', exact: true }).click();
    await expect(catalog.getByRole('button', { name: /Tarte orange/i })).toBeVisible();
    await expect(catalog.getByRole('button', { name: /Mousse cacao/i })).toBeVisible();
    await expect(cart.getByText('23 DH').last()).toBeVisible();
  });

  test('submits a fresh order to the kitchen from ordering', async ({ page }) => {
    let createdCommande: any = null;

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 41, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 51, nom: 'Burger signature', prix: '18.00', temps_preparation: 14, categorie: 41, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/commandes/', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      createdCommande = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 801, statut: 'EN_COURS', ...createdCommande }),
      });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    await catalog.getByText('Burger signature').click({ force: true });
    await page.getByTestId('order-submit').click();

    await expect(page).toHaveURL(/\/salle$/);
    expect(createdCommande).toEqual({
      table: 1,
      type: 'SUR_PLACE',
      lignes: [{ plat: 51, quantite: 1, notes: '' }],
    });
  });

  test('adds items to an existing in-progress order instead of creating a new one', async ({ page }) => {
    let addItemsPayload: any = null;
    let createCalled = false;

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 81, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 91, nom: 'Couscous royal', prix: '22.00', temps_preparation: 18, categorie: 81, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route('**/api/commandes/?table=1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 9901, statut: 'EN_COURS', table: 1 }]),
      });
    });

    await page.route('**/api/commandes/', async (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'should not create' }),
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/commandes/9901/add_items/', async (route) => {
      addItemsPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    await expect(page.getByText(/Table 1/i)).toBeVisible();
    await catalog.getByRole('button', { name: /Couscous royal/i }).click({ force: true });
    await page.getByTestId('order-submit').click();

    await expect(page).toHaveURL(/\/salle$/);
    expect(createCalled).toBe(false);
    expect(addItemsPayload).toEqual({
      lignes: [{ plat: 91, quantite: 1, notes: '' }],
    });
  });

  test('selects the mutable existing order when multiple active orders are returned for one table', async ({ page }) => {
    let addItemsPayload: any = null;
    let addItemsTargetId: number | null = null;

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 101, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 111, nom: 'Brochettes agneau', prix: '21.00', temps_preparation: 13, categorie: 101, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route('**/api/commandes/?table=1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 9952, statut: 'PRETE', table: 1 }, { id: 9951, statut: 'EN_COURS', table: 1 }, { id: 9953, statut: 'EN_CUISINE', table: 1 }]),
      });
    });

    await page.route('**/api/commandes/*/add_items/', async (route) => {
      addItemsTargetId = Number(route.request().url().match(/commandes\/(\d+)\/add_items/)?.[1] ?? 0);
      addItemsPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    await expect(page.getByText(/Table 1/i)).toBeVisible();
    await catalog.getByRole('button', { name: /Brochettes agneau/i }).click({ force: true });
    await page.getByTestId('order-submit').click();

    await expect(page).toHaveURL(/\/salle$/);
    expect(addItemsTargetId).toBe(9951);
    expect(addItemsPayload).toEqual({
      lignes: [{ plat: 111, quantite: 1, notes: '' }],
    });
  });

  test('keeps existing-order add_items payload intact while filters change', async ({ page }) => {
    let addItemsPayload: any = null;
    let createCalled = false;

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 181, nom: 'Entrees', ordre_affichage: 1, est_active: true },
          { id: 182, nom: 'Desserts', ordre_affichage: 2, est_active: true },
        ]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 191, nom: 'Salade mechouia', prix: '11.00', temps_preparation: 6, categorie: 181, image: null, est_active: true, est_disponible: true },
          { id: 192, nom: 'Creme orange', prix: '9.00', temps_preparation: 3, categorie: 182, image: null, est_active: true, est_disponible: true },
          { id: 193, nom: 'Millefeuille', prix: '14.00', temps_preparation: 5, categorie: 182, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route('**/api/commandes/?table=1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 9911, statut: 'EN_COURS', table: 1 }]),
      });
    });

    await page.route('**/api/commandes/', async (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'should not create' }),
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/commandes/9911/add_items/', async (route) => {
      addItemsPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    await catalog.getByRole('button', { name: /Salade mechouia/i }).click({ force: true });

    const searchInput = page.getByPlaceholder('SEARCH MENU...');
    await catalog.getByRole('button', { name: 'Desserts', exact: true }).click();
    await searchInput.fill('orange');
    await catalog.getByRole('button', { name: /Creme orange/i }).click({ force: true });
    await expect(catalog.getByText('Millefeuille')).toHaveCount(0);

    await searchInput.fill('');
    await page.getByTestId('order-submit').click();

    await expect(page).toHaveURL(/\/salle$/);
    expect(createCalled).toBe(false);
    expect(addItemsPayload).toEqual({
      lignes: [
        { plat: 191, quantite: 1, notes: '' },
        { plat: 192, quantite: 1, notes: '' },
      ],
    });
  });

  test('preserves existing-order quantities after cart edits under changing filters', async ({ page }) => {
    let addItemsPayload: any = null;

    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 281, nom: 'Plats', ordre_affichage: 1, est_active: true },
          { id: 282, nom: 'Desserts', ordre_affichage: 2, est_active: true },
        ]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 291, nom: 'Tajine citron', prix: '19.00', temps_preparation: 16, categorie: 281, image: null, est_active: true, est_disponible: true },
          { id: 292, nom: 'Orange mousse', prix: '8.00', temps_preparation: 4, categorie: 282, image: null, est_active: true, est_disponible: true },
          { id: 293, nom: 'Corne de gazelle', prix: '7.00', temps_preparation: 5, categorie: 282, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route('**/api/commandes/?table=1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 9921, statut: 'EN_COURS', table: 1 }]),
      });
    });

    await page.route('**/api/commandes/9921/add_items/', async (route) => {
      addItemsPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');
    const searchInput = page.getByPlaceholder('SEARCH MENU...');

    await catalog.getByRole('button', { name: /Tajine citron/i }).click({ force: true });
    await catalog.getByRole('button', { name: /Tajine citron/i }).click({ force: true });
    await expect(cart.getByText('38 DH').last()).toBeVisible();

    await catalog.getByRole('button', { name: 'Desserts', exact: true }).click();
    await searchInput.fill('orange');
    await catalog.getByRole('button', { name: /Orange mousse/i }).click({ force: true });
    await expect(catalog.getByText('Corne de gazelle')).toHaveCount(0);

    await searchInput.fill('tajine');
    const tajineCartItem = cart.getByTestId('cart-item-291');
    await tajineCartItem.getByTestId('qty-plus').click();
    await expect(tajineCartItem.getByText('3x')).toBeVisible();

    await searchInput.fill('');
    await page.getByTestId('order-submit').click();

    await expect(page).toHaveURL(/\/salle$/);
    expect(addItemsPayload).toEqual({
      lignes: [
        { plat: 291, quantite: 3, notes: '' },
        { plat: 292, quantite: 1, notes: '' },
      ],
    });
  });

  test('keeps cart and session pinned when existing-order add_items fails', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 301, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 311, nom: 'Tacos poulet', prix: '17.00', temps_preparation: 9, categorie: 301, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route('**/api/commandes/?table=1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 9961, statut: 'EN_COURS', table: 1 }]),
      });
    });

    await page.route('**/api/commandes/9961/add_items/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'add_items failed' }),
      });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');

    await expect(page.getByText(/Table 1/i)).toBeVisible();
    await catalog.getByRole('button', { name: /Tacos poulet/i }).click({ force: true });
    await catalog.getByRole('button', { name: /Tacos poulet/i }).click({ force: true });
    await expect(cart.getByText('34 DH').last()).toBeVisible();

    await page.getByTestId('order-submit').click();

    await expect(page).toHaveURL(/\/ordering\/1$/);
    await expect(page.getByText(/Table 1/i)).toBeVisible();
    await expect(cart.locator('p', { hasText: 'Tacos poulet' })).toBeVisible();
    await expect(cart.getByText('2x')).toBeVisible();
    await expect(cart.getByText('34 DH').last()).toBeVisible();
    await expect(page.getByTestId('order-submit')).toBeEnabled();
  });

  test('keeps hidden cart items stable when removing a different visible line', async ({ page }) => {
    await page.route('**/api/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 201, nom: 'Plats', ordre_affichage: 1, est_active: true }]),
      });
    });

    await page.route('**/api/plats/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 211, nom: 'Tagine olive', prix: '18.00', temps_preparation: 14, categorie: 201, image: null, est_active: true, est_disponible: true },
          { id: 212, nom: 'Pastilla lait', prix: '12.00', temps_preparation: 6, categorie: 201, image: null, est_active: true, est_disponible: true },
        ]),
      });
    });

    await page.route('**/api/tables/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, numero: 1 }]),
      });
    });

    await page.route(/\/api\/commandes\/\?table=1/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/ordering/1');
    await page.waitForLoadState('networkidle');
    const catalog = page.getByTestId('menu-catalog');
    const cart = page.getByTestId('ordering-cart');
    await catalog.getByRole('button', { name: /Tagine olive/i }).click({ force: true });
    await catalog.getByRole('button', { name: /Pastilla lait/i }).click({ force: true });
    await catalog.getByRole('button', { name: /Pastilla lait/i }).click({ force: true });

    const searchInput = page.getByPlaceholder('SEARCH MENU...');
    await expect(cart.getByText('42 DH').last()).toBeVisible();

    await searchInput.fill('tagine');
    await expect(cart.locator('p', { hasText: 'Pastilla lait' })).toHaveCount(1);

    const visibleCartItem = cart.getByTestId('cart-item-211');
    await visibleCartItem.getByTestId('remove-item').click();

    await expect(cart.getByText('Tagine olive')).toHaveCount(0);
    await expect(cart.locator('p', { hasText: 'Pastilla lait' })).toBeVisible();
    await expect(cart.getByText('24 DH').last()).toBeVisible();

    await searchInput.fill('');
    await expect(cart.locator('p', { hasText: 'Pastilla lait' })).toBeVisible();
    await expect(cart).toContainText('2x');
    await expect(cart.getByText('Tagine olive')).toHaveCount(0);
  });
});
