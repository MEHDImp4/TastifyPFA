import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { loginThroughUi, staffUsers } from './fixtures/auth';

const authFiles = {
  gerant: './tests/e2e/.auth/gerant.json',
  serveur: './tests/e2e/.auth/serveur.json',
  cuisinier: './tests/e2e/.auth/cuisinier.json',
} as const;

test('capture authenticated storage states for seeded staff roles', async ({ browser }) => {
  for (const [role, user] of Object.entries(staffUsers)) {
    const authFile = authFiles[role as keyof typeof authFiles];
    mkdirSync(dirname(authFile), { recursive: true });

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, user.username, user.password);
    await expect.poll(() => new URL(page.url()).pathname).toBe(user.homePath);
    await context.storageState({ path: authFile });
    await context.close();
  }
});
