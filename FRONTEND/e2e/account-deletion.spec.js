import { expect, test } from '@playwright/test';

test('account deletion removes access to protected routes', async ({ page }) => {
  const email = `delete-${Date.now()}@example.com`;
  const password = 'correct horse battery staple';

  await page.goto('/register');
  await page.getByLabel('Full name').fill('Delete Me');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page
    .getByRole('form', { name: 'Create account' })
    .getByRole('button', { name: 'Create account' })
    .click();
  await page.waitForURL('**/login');

  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');

  await page.goto('/settings');
  await page.getByLabel('Type your email to confirm').fill(email);
  await page.locator('#settings-delete-password').fill(password);
  await page.getByRole('button', { name: 'Delete my account' }).click();

  await page.waitForURL('**/');
  await page.goto('/dashboard');
  await page.waitForURL('**/login**');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
