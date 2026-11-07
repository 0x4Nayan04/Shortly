import { expect, test } from '@playwright/test';

test('mobile feature details and short-screen navigation remain usable', async ({
  page
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: /02 Custom aliases/ }).click();
  await expect(page.locator('#feature-detail-02')).toBeVisible();
  await page.getByRole('button', { name: /04 QR export/ }).click();
  await expect(page.locator('#feature-detail-04')).toBeVisible();
  await expect(page.locator('#feature-detail-02')).toBeHidden();
  await page.setViewportSize({ width: 568, height: 260 });
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.locator('#landing-mobile-menu');
  expect(
    await menu.evaluate(
      (element) => element.getBoundingClientRect().bottom <= innerHeight
    )
  ).toBe(true);
  await menu.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('account menu, sorting, tabs, and dialogs support keyboard navigation', async ({
  page
}) => {
  await page.route(/\/api\/(auth|create)\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body =
      path === '/api/auth/me'
        ? {
            user: {
              _id: 'ui-user',
              name: 'UI Tester',
              email: `${'long'.repeat(20)}@example.com`
            }
          }
        : {
            urls: [
              {
                _id: 'link-1',
                short_url: 'ui-link',
                full_url: 'https://example.com/long-destination',
                click: 0,
                createdAt: '2026-11-01T00:00:00Z'
              }
            ],
            totalCount: 1,
            stats: { totalUrls: 1, totalClicks: 0, avgClicksPerUrl: 0 },
            recentActivity: [],
            topUrls: [],
            clickAnalytics: {}
          };
    await route.fulfill({ json: body });
  });
  await page.goto('/dashboard');
  await expect(
    page.getByRole('heading', { name: 'Your links', exact: true })
  ).toBeVisible();
  const trigger = page.getByRole('button', {
    name: 'Account menu for UI Tester'
  });
  await expect(page.locator('.nav-user-avatar-fallback')).toBeVisible();
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(
    page.getByRole('menuitem', { name: 'Dashboard', exact: true })
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('menuitem', { name: 'View profile' })
  ).toBeFocused();
  await page.keyboard.press('Enter');
  const profile = page.getByRole('dialog', { name: 'User profile' });
  await expect(profile).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(profile).toBeHidden();

  await page.getByRole('button', { name: 'Edit ui-link', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Edit link', exact: true });
  await expect(edit).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(
    edit.getByRole('button', { name: 'Save changes' })
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(edit).toBeHidden();
  await page
    .getByRole('button', { name: 'Share ui-link', exact: true })
    .click();
  const share = page.getByRole('dialog', { name: 'Share this link' });
  await expect(share.getByAltText('QR Code')).toBeVisible();
  await page.setViewportSize({ width: 375, height: 667 });
  const download = await Promise.all([
    page.waitForEvent('download'),
    share.getByRole('button', { name: 'Download QR', exact: true }).click()
  ]);
  expect(download[0].suggestedFilename()).toBe('qr-ui-link.png');
  await page.keyboard.press('Escape');
  await expect(share).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    'hidden'
  );
  await page
    .getByRole('button', { name: 'Delete ui-link', exact: true })
    .click();
  const deleteDialog = page.getByRole('dialog', {
    name: 'Delete link',
    exact: true
  });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();

  const sort = page.getByRole('combobox', { name: 'Sort by' });
  await sort.click();
  await expect(page.getByRole('listbox', { name: 'Sort by' })).toBeVisible();
  await sort.press('End');
  await sort.press('Enter');
  await expect(sort).toHaveText('Destination');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await sort.click();
  await sort.press('ArrowUp');
  await sort.press('Enter');
  await expect(sort).toHaveText('Short URL');

  const linksTab = page.getByRole('tab', { name: 'All Links' });
  await linksTab.focus();
  await linksTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Analytics' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Analytics');
  await page.keyboard.press('ArrowLeft');
  await expect(linksTab).toBeFocused();

  await page.setViewportSize({ width: 375, height: 260 });
  await trigger.click();
  const menu = page.getByRole('menu', { name: 'Account menu' });
  expect(
    await menu.evaluate(
      (element) => element.getBoundingClientRect().bottom <= innerHeight
    )
  ).toBe(true);
  await menu.press('End');
  await page.keyboard.press('Enter');
  const logout = page.getByRole('dialog', { name: 'Sign out', exact: true });
  await expect(logout).toBeVisible();
  await logout.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(logout).toBeHidden();
});
