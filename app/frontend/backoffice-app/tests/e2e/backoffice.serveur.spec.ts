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
});
