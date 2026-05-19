import { expect, test } from '@playwright/test';

test.describe('serveur browser workflows', () => {
  test('lands on the salle route and only sees serveur navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/salle$/);
    await expect(page.getByRole('heading', { name: 'Architectural Floor Plan' })).toBeVisible();

    await expect(page.getByTestId('nav-salle')).toBeVisible();
    await expect(page.getByTestId('nav-reservations')).toBeVisible();
    await expect(page.getByTestId('nav-dashboard')).toHaveCount(0);
    await expect(page.getByTestId('nav-categories')).toHaveCount(0);
    await expect(page.getByTestId('nav-kds')).toHaveCount(0);
  });

  test('keeps serveur users on allowed routes and redirects forbidden ones', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page).toHaveURL(/\/reservations$/);
    await expect(page.getByRole('heading', { name: 'Réservations' })).toBeVisible();

    await page.goto('/ordering/1');
    await expect(page).toHaveURL(/\/ordering\/1$/);
    await expect(page.getByText(/Station Table/i)).toBeVisible();
    await expect(page.getByText('Operational Cart')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Push to Kitchen' })).toBeVisible();

    for (const forbiddenPath of ['/categories', '/stock', '/hr', '/avis', '/settings', '/menu', '/kds']) {
      await page.goto(forbiddenPath);
      await expect(page).toHaveURL(/\/salle$/);
    }
  });

  test('redirects an authenticated serveur away from login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/salle$/);
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
    await page.getByRole('button', { name: 'EN ATTENTE' }).click();
    await expect(page.getByText('Alice Martin')).toBeVisible();
    await expect(page.getByText('Yassine Haddad')).toHaveCount(0);

    await page.getByRole('button', { name: 'Confirmer' }).click();
    await expect(page.getByText('Aucune réservation trouvée.')).toBeVisible();

    await page.getByRole('button', { name: 'CONFIRMEE' }).click();
    await expect(page.getByText('Alice Martin')).toBeVisible();
    await expect(page.getByText('Yassine Haddad')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Annuler' })).toHaveCount(2);

    await page.getByRole('button', { name: 'Annuler' }).first().click();
    await expect(page.getByText('Alice Martin')).toHaveCount(0);
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
    await expect(page.getByText('Aucune réservation trouvée.')).toBeVisible();
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
    await page.getByRole('button', { name: 'Confirmer' }).click();
    await expect(page.getByText('Sara Bennani')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmer' })).toHaveCount(1);

    await page.getByRole('button', { name: 'Annuler' }).last().click();
    await expect(page.getByText('Omar Idrissi')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Annuler' })).toHaveCount(1);
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
    await page.getByPlaceholder('Chercher un client...').fill('nadia');
    await expect(page.getByPlaceholder('Chercher un client...')).toHaveValue('nadia');
    await expect(reservationsGrid.getByText('Nadia Search')).toBeVisible();
    await expect(reservationsGrid.getByText('Karim Visible')).toHaveCount(0);
    await expect(reservationsGrid.getByText('"Allergies"')).toBeVisible();

    await page.getByPlaceholder('Chercher un client...').fill('');
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
    const searchInput = page.getByPlaceholder('Chercher un client...');

    await searchInput.fill('  naDIA  ');
    await expect(searchInput).toHaveValue('  naDIA  ');
    await expect(reservationsGrid.getByText('Nadia Search')).toBeVisible();
    await expect(reservationsGrid.getByText('Client', { exact: true })).toHaveCount(0);

    await searchInput.fill('client');
    await expect(reservationsGrid.getByText('Nadia Search')).toHaveCount(0);
    await expect(reservationsGrid.getByText('Client', { exact: true })).toBeVisible();
    await expect(reservationsGrid.getByText('"Sans gluten"')).toBeVisible();
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

    await page.getByRole('button', { name: 'CONFIRMEE' }).click();
    await expect(reservationsGrid.getByText('Salma Transit')).toBeVisible();

    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(reservationsGrid.getByText('Salma Transit')).toHaveCount(0);
    await expect(page.getByText('Aucune réservation trouvée.')).toBeVisible();

    await page.getByRole('button', { name: 'ANNULEE' }).click();
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
    await page.getByRole('button', { name: 'Confirmer' }).click();
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
    const searchInput = page.getByPlaceholder('Chercher un client...');

    await searchInput.fill('client');
    await expect(reservationsGrid.getByText('Client', { exact: true })).toHaveCount(2);
    await expect(reservationsGrid.getByText('Nadia Named')).toHaveCount(0);

    await page.getByRole('button', { name: 'EN ATTENTE' }).click();
    await expect(reservationsGrid.getByText('Client', { exact: true })).toHaveCount(1);
    await expect(reservationsGrid.getByText('Nadia Named')).toHaveCount(0);

    await page.getByRole('button', { name: 'ANNULEE' }).click();
    await expect(reservationsGrid.getByText('Client', { exact: true })).toHaveCount(1);
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
            user_username: 'Client Karim',
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
    const searchInput = page.getByPlaceholder('Chercher un client...');

    await searchInput.fill('  cLiEnt  ');
    await expect(reservationsGrid.getByText('Client Karim')).toBeVisible();
    await expect(reservationsGrid.getByText('Client', { exact: true })).toBeVisible();

    await searchInput.fill('karim');
    await expect(reservationsGrid.getByText('Client Karim')).toBeVisible();
    await expect(reservationsGrid.getByText('Client', { exact: true })).toHaveCount(0);
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/ordering/1');
    await expect(page.getByText('Transaction buffer is empty.')).toBeVisible();

    await page.getByPlaceholder('Lookup culinary data...').fill('salade');
    const saladeCard = page.getByRole('button', { name: /Salade fraiche 12\.50DH 8m/i });
    await expect(saladeCard).toBeVisible();
    await expect(page.getByText('Soupe du jour')).toHaveCount(0);

    await saladeCard.click();
    await expect(page.getByText('Salade fraiche')).toHaveCount(2);
    const cartPanel = page.locator('aside');
    const cartItem = cartPanel.locator('div').filter({
      has: page.getByText('Salade fraiche', { exact: true }),
    }).filter({
      has: page.getByText('12.50 DH / UNIT', { exact: true }),
    }).first();
    await expect(cartItem.getByText('12.50DH')).toBeVisible();
    await expect(cartPanel.getByText('12.50DH').last()).toBeVisible();

    await cartItem.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).click();
    await expect(cartItem.getByText('25.00DH')).toBeVisible();
    await expect(cartPanel.getByText('25.00DH').last()).toBeVisible();
    await cartItem.getByRole('button').filter({ has: page.locator('svg.lucide-minus') }).click();
    await expect(cartItem.getByText('12.50DH')).toBeVisible();

    await cartItem.getByRole('button').filter({ has: page.locator('svg.lucide-trash-2') }).click();
    await expect(page.getByText('Transaction buffer is empty.')).toBeVisible();
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/ordering/1');
    await page.getByRole('button', { name: /Poulet grille 15\.00DH 12m/i }).click();
    await page.getByRole('button', { name: /The menthe 4\.00DH 2m/i }).click();
    await expect(page.locator('aside').getByText('19.00DH').last()).toBeVisible();

    const pouletItem = page.locator('aside').locator('div').filter({
      has: page.getByText('Poulet grille', { exact: true }),
    }).first();

    await pouletItem.locator('button').nth(1).click();
    await expect(pouletItem.getByText('15.00DH')).toBeVisible();
    await expect(pouletItem.locator('span.w-8').first()).toHaveText('1');
    await expect(page.locator('aside').getByText('19.00DH').last()).toBeVisible();
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/ordering/1');
    await page.getByPlaceholder('Lookup culinary data...').fill('orange');
    await expect(page.getByText('Salade orange')).toBeVisible();
    await expect(page.getByText('Tarte orange')).toHaveCount(0);

    await page.getByRole('button', { name: 'Desserts' }).click();
    await expect(page.getByText('Salade orange')).toHaveCount(0);
    await expect(page.getByText('Tarte orange')).toBeVisible();
    await expect(page.getByText('Mousse chocolat')).toHaveCount(0);
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/ordering/1');
    await page.getByRole('button', { name: /Briouates 11\.00DH 6m/i }).click();

    const cartPanel = page.locator('aside');
    await expect(cartPanel.getByText('Briouates')).toBeVisible();
    await expect(cartPanel.getByText('11.00DH').last()).toBeVisible();

    await page.getByRole('button', { name: 'Desserts' }).click();
    await expect(page.getByText('Corne de gazelle')).toBeVisible();
    await expect(page.getByText('Briouates')).toHaveCount(1);
    await expect(cartPanel.getByText('11.00DH').last()).toBeVisible();

    await page.getByRole('button', { name: 'Entrees' }).click();
    await expect(page.getByText('Briouates')).toHaveCount(2);
    await expect(cartPanel.getByText('11.00DH').last()).toBeVisible();
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/ordering/1');
    await page.getByRole('button', { name: /Tagine citron 19\.00DH 15m/i }).click();

    const cartPanel = page.locator('aside');
    const searchInput = page.getByPlaceholder('Lookup culinary data...');

    await searchInput.fill('pastilla');
    await expect(page.getByText('Tagine citron')).toHaveCount(1);
    await expect(page.getByText('Pastilla mer')).toBeVisible();
    await expect(cartPanel.getByText('Tagine citron')).toBeVisible();
    await expect(cartPanel.getByText('19.00DH').last()).toBeVisible();

    await searchInput.fill('');
    await expect(page.getByText('Tagine citron')).toHaveCount(2);
    await expect(cartPanel.getByText('Tagine citron')).toBeVisible();
    await expect(cartPanel.getByText('19.00DH').last()).toBeVisible();
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/ordering/1');
    await page.getByRole('button', { name: /Salade orange 10\.00DH 5m/i }).click();
    await page.getByRole('button', { name: 'Desserts' }).click();
    await page.getByRole('button', { name: /Tarte orange 13\.00DH 7m/i }).click();

    const cartPanel = page.locator('aside');
    const searchInput = page.getByPlaceholder('Lookup culinary data...');
    await expect(cartPanel.getByText('Salade orange')).toBeVisible();
    await expect(cartPanel.getByText('Tarte orange')).toBeVisible();
    await expect(cartPanel.getByText('23.00DH').last()).toBeVisible();

    await searchInput.fill('orange');
    await expect(page.getByText('Tarte orange')).toHaveCount(2);
    await expect(page.getByText('Mousse cacao')).toHaveCount(0);
    await expect(cartPanel.getByText('23.00DH').last()).toBeVisible();

    await page.getByRole('button', { name: 'Entrees' }).click();
    await expect(page.getByText('Salade orange')).toHaveCount(2);
    await expect(page.getByText('Tarte orange')).toHaveCount(1);
    await expect(cartPanel.getByText('Salade orange')).toBeVisible();
    await expect(cartPanel.getByText('Tarte orange')).toBeVisible();
    await expect(cartPanel.getByText('23.00DH').last()).toBeVisible();

    await searchInput.fill('');
    await page.getByRole('button', { name: 'Desserts' }).click();
    await expect(page.getByText('Tarte orange')).toHaveCount(2);
    await expect(page.getByText('Mousse cacao')).toBeVisible();
    await expect(cartPanel.getByText('23.00DH').last()).toBeVisible();
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
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
    await page.getByText('Burger signature').click();
    await page.getByRole('button', { name: 'Push to Kitchen' }).click();

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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
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
    await expect(page.getByText('Session Active • #9901')).toBeVisible();
    await page.getByRole('button', { name: /Couscous royal 22\.00DH 18m/i }).click();
    await page.getByRole('button', { name: 'Push to Kitchen' }).click();

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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 9952, statut: 'PRETE', table: 1 },
          { id: 9951, statut: 'EN_COURS', table: 1 },
          { id: 9953, statut: 'EN_CUISINE', table: 1 },
        ]),
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
    await expect(page.getByText(/Session Active/i)).toBeVisible();
    await page.getByRole('button', { name: /Brochettes agneau 21\.00DH 13m/i }).click();
    await page.getByRole('button', { name: 'Push to Kitchen' }).click();

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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
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
    await page.getByRole('button', { name: /Salade mechouia 11\.00DH 6m/i }).click();

    const searchInput = page.getByPlaceholder('Lookup culinary data...');
    await page.getByRole('button', { name: 'Desserts' }).click();
    await searchInput.fill('orange');
    await page.getByRole('button', { name: /Creme orange 9\.00DH 3m/i }).click();
    await expect(page.getByText('Millefeuille')).toHaveCount(0);

    await searchInput.fill('');
    await page.getByRole('button', { name: 'Push to Kitchen' }).click();

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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
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
    const cartPanel = page.locator('aside');
    const searchInput = page.getByPlaceholder('Lookup culinary data...');

    await page.getByRole('button', { name: /Tajine citron 19\.00DH 16m/i }).click();
    await page.getByRole('button', { name: /Tajine citron 19\.00DH 16m/i }).click();
    await expect(cartPanel.getByText('38.00DH').last()).toBeVisible();

    await page.getByRole('button', { name: 'Desserts' }).click();
    await searchInput.fill('orange');
    await page.getByRole('button', { name: /Orange mousse 8\.00DH 4m/i }).click();
    await expect(page.getByText('Corne de gazelle')).toHaveCount(0);

    await searchInput.fill('tajine');
    const tajineCartItem = cartPanel.locator('div').filter({
      has: page.getByText('Tajine citron', { exact: true }),
    }).first();
    await tajineCartItem.getByRole('button').nth(2).click();
    await expect(tajineCartItem.getByText('3')).toBeVisible();

    await searchInput.fill('');
    await page.getByRole('button', { name: 'Push to Kitchen' }).click();

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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
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
    const cartPanel = page.locator('aside');

    await expect(page.getByText('Session Active • #9961')).toBeVisible();
    await page.getByRole('button', { name: /Tacos poulet 17\.00DH 9m/i }).click();
    await page.getByRole('button', { name: /Tacos poulet 17\.00DH 9m/i }).click();
    await expect(cartPanel.getByText('34.00DH').last()).toBeVisible();

    await page.getByRole('button', { name: 'Push to Kitchen' }).click();

    await expect(page).toHaveURL(/\/ordering\/1$/);
    await expect(page.getByText('Session Active • #9961')).toBeVisible();
    await expect(cartPanel.getByText('Tacos poulet')).toBeVisible();
    await expect(cartPanel.getByText('2')).toBeVisible();
    await expect(cartPanel.getByText('34.00DH').last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Push to Kitchen' })).toBeEnabled();
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

    await page.route('**/api/commandes/?table=1&statut=EN_COURS,EN_CUISINE,PRETE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/ordering/1');
    await page.getByRole('button', { name: /Tagine olive 18\.00DH 14m/i }).click();
    await page.getByRole('button', { name: /Pastilla lait 12\.00DH 6m/i }).click();

    const cartPanel = page.locator('aside');
    const searchInput = page.getByPlaceholder('Lookup culinary data...');
    await expect(cartPanel.getByText('30.00DH').last()).toBeVisible();

    await searchInput.fill('tagine');
    await expect(page.getByText('Pastilla lait')).toHaveCount(1);

    const visibleCartItem = cartPanel.locator('div').filter({
      has: page.getByText('Tagine olive', { exact: true }),
    }).first();
    await visibleCartItem.locator('button').first().click();

    await expect(cartPanel.getByText('Tagine olive')).toHaveCount(0);
    await expect(cartPanel.getByText('Pastilla lait')).toBeVisible();
    await expect(cartPanel.getByText('12.00DH').last()).toBeVisible();

    await searchInput.fill('');
    await expect(page.getByText('Pastilla lait')).toHaveCount(2);
    await expect(cartPanel.getByText('Pastilla lait')).toBeVisible();
    await expect(cartPanel.getByText('Tagine olive')).toHaveCount(0);
  });
});
