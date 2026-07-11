import { expect, test } from '@playwright/test';

test('anonymous shorten, redirect, and dashboard analytics', async ({
  page,
  context,
  request
}) => {
  const destination = 'https://example.com/';

  await page.goto('/');
  await page.getByLabel('Long URL').fill(destination);
  await page
    .locator('form[aria-label="URL shortener form"] button[type="submit"]')
    .click();

  const result = page.locator('#short-url-output');
  await expect(result).toBeVisible();
  const shortUrl = (await result.inputValue()).trim();
  expect(shortUrl).toMatch(
    /^https?:\/\/localhost:5173\/[a-zA-Z0-9_-]+$/
  );

  const slug = shortUrl.split('/').pop();
  const redirectResponse = await request.get(`http://127.0.0.1:3011/${slug}`, {
    maxRedirects: 0
  });
  expect(redirectResponse.status()).toBeGreaterThanOrEqual(300);
  expect(redirectResponse.status()).toBeLessThan(400);
  expect(redirectResponse.headers().location).toBe(destination);

  const redirectPage = await context.newPage();
  await redirectPage.goto(`http://127.0.0.1:3011/${slug}`);
  await expect(redirectPage).toHaveURL(destination);

  const email = `e2e-${Date.now()}@example.com`;
  const password = 'correct horse battery staple';

  await page.goto('/register');
  await page.getByLabel('Full name').fill('E2E User');
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

  await expect(page.getByRole('heading', { name: 'Your links' })).toBeVisible();
  await page.getByRole('tab', { name: 'Analytics' }).click();
  await expect(
    page.getByRole('heading', { name: 'Clicks over time' })
  ).toBeVisible();
});
