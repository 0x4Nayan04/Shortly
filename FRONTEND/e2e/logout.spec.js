import { expect, test } from '@playwright/test';

test('logout confirmation blurs the dashboard and returns to the landing page', async ({ page }) => {
  page.setDefaultTimeout(10_000);
  await page.route(/\/api\/(auth|create)\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/auth/me'
      ? { user: { _id: 'qa-user', name: 'QA User', email: 'qa@example.com' } }
      : { urls: [], totalCount: 0, stats: { totalUrls: 0, totalClicks: 0, avgClicksPerUrl: 0 }, recentActivity: [], topUrls: [], clickAnalytics: {} };
    await route.fulfill({ json: body });
  });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Your links', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Account menu for QA User' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sign out' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => getComputedStyle(element, '::backdrop').backdropFilter)).toBe('blur(8px)');
  await page.screenshot({ path: '/tmp/shortly-logout-desktop.png', animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/shortly-logout-mobile.png', animations: 'disabled' });
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Account menu for QA User' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await dialog.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Account menu for QA User' })).toHaveCount(0);
});
