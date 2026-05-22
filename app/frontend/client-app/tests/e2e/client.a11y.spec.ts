import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockConfig, mockRefreshFail } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockConfig(page);
  await mockRefreshFail(page);
});

test.describe('client public accessibility and responsiveness', () => {
  test('keeps the public home usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('link', { name: /menu/i }).first()).toBeVisible();
    await expect(page.getByText(/Tastify/i).first()).toBeVisible();
  });

  test('has no critical or serious axe violations on login', async ({ page }) => {
    await page.goto('/login');

    const results = await new AxeBuilder({ page }).analyze();
    const blockingViolations = results.violations.filter(({ impact }) =>
      impact === 'critical' || impact === 'serious',
    );

    expect(blockingViolations).toEqual([]);
  });
});
