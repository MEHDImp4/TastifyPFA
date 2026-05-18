export const STAFF_PASSWORD = 'password123';

export const staffUsers = {
  gerant: {
    username: 'gerant_test',
    password: STAFF_PASSWORD,
    homePath: '/',
  },
  serveur: {
    username: 'serveur_test',
    password: STAFF_PASSWORD,
    homePath: '/salle',
  },
  cuisinier: {
    username: 'cuisinier_test',
    password: STAFF_PASSWORD,
    homePath: '/kds',
  },
} as const;

export async function loginThroughUi(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-username').fill(username);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}
