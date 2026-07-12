'use strict';

const { test, expect } = require('@playwright/test');

// Full artifact-distribution + walk-in journey, run in an iPhone 13 context
// (configured in playwright.config.js). One serial flow so state carries over.
test.describe.configure({ mode: 'serial' });

let ownerUrl;       // /dashboard/:owner_token
let publicEventUrl; // /e/:public_token
let caseySpotUrl;   // customer #1's live confirmation
let handle;

test('home → create page spins up a demo artist dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /create my pop-up page/i })).toBeVisible();
  await page.getByRole('button', { name: /create my pop-up page/i }).click();
  await expect(page).toHaveURL(/\/dashboard\//);
  ownerUrl = page.url();
  await expect(page.getByRole('heading', { name: 'Aria Gold' })).toBeVisible();
});

test('owner adds a catalog item', async ({ page }) => {
  await page.goto(ownerUrl);
  const addForm = page.locator('form[action$="/catalog"]');
  await addForm.locator('#c-name').fill('Test Bracelet');
  await addForm.locator('input[name="description"]').fill('Welded test chain');
  await addForm.locator('input[name="price"]').fill('55');
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  await expect(page.getByText('Test Bracelet')).toBeVisible();
  await expect(page.getByText('$55')).toBeVisible();
});

test('owner creates an event', async ({ page }) => {
  await page.goto(ownerUrl);
  await page.locator('#e-title').fill('Saturday Market Pop-Up');
  await page.locator('input[name="venue_name"]').fill('The Maker Market');
  await page.getByRole('button', { name: 'Create pop-up' }).click();
  await expect(page.getByText('Saturday Market Pop-Up')).toBeVisible();

  // Capture the handle for the public artist page assertion later.
  handle = (await page.locator('.card-head .small.muted').first().textContent()).trim().replace('@', '');
  expect(handle).toBeTruthy();
});

test('public event page: QR, footer, join form all present (mobile)', async ({ page }) => {
  await page.goto(ownerUrl);
  // Open the freshly created (upcoming) event's board, then its public page.
  await page.getByText('Saturday Market Pop-Up').click();
  await expect(page).toHaveURL(/\/event\/\d+$/);
  // Go live so "N ahead" state shows.
  await page.getByRole('button', { name: /go live/i }).click();

  const [pub] = await Promise.all([
    page.context().waitForEvent('page'),
    page.getByRole('link', { name: /preview public page/i }).click(),
  ]);
  await pub.waitForLoadState();
  publicEventUrl = pub.url();
  expect(publicEventUrl).toMatch(/\/e\//);

  await expect(pub.locator('img[alt*="QR"]')).toBeVisible();
  await expect(pub.getByText(/Made with/i)).toBeVisible();
  await expect(pub.getByText('Poppin', { exact: false })).toBeVisible();
  await expect(pub.getByRole('button', { name: /join the list/i })).toBeVisible();
  await pub.close();
});

test('customer #1 joins → confirmation shows position #1', async ({ page }) => {
  await page.goto(publicEventUrl);
  await page.locator('#name').fill('Casey');
  await page.locator('#party_size').selectOption('1');
  await page.getByRole('button', { name: /join the list/i }).click();

  await expect(page).toHaveURL(/\/spot\//);
  caseySpotUrl = page.url();
  await expect(page.getByText("You're on the list, Casey")).toBeVisible();
  await expect(page.locator('[data-position]')).toHaveText('#1');
  // 0 ahead => "up next"
  await expect(page.getByText(/up next/i)).toBeVisible();
});

test('entry appears on owner board; notify then served flow', async ({ page }) => {
  await page.goto(ownerUrl);
  await page.getByText('Saturday Market Pop-Up').click();
  await expect(page.locator('[data-queue]')).toContainText('Casey');
  // metric shows 1 person waiting
  await expect(page.locator('[data-metric-people]')).toHaveText('1');

  // Notify next → outbox row appears (nothing really sent).
  await page.getByRole('button', { name: /notify next/i }).click();
  await expect(page.locator('[data-notified]')).toContainText('Casey');
  await expect(page.getByText(/you're up next at the pop-up/i)).toBeVisible();

  // Mark served.
  await page.locator('[data-notified]').getByRole('button', { name: 'Served' }).click();
  await expect(page.getByText('Recently handled')).toBeVisible();
});

test("customer #1's confirmation reflects served state (live poll)", async ({ page }) => {
  await page.goto(caseySpotUrl);
  // The page's 5s poll flips the view to "served"; wait for it.
  await expect(page.getByText(/All done/i)).toBeVisible({ timeout: 12_000 });
});

test('customer #2 joins with a party of 3; ordering reflects party size', async ({ page }) => {
  await page.goto(publicEventUrl);
  await page.locator('#name').fill('Devon');
  await page.locator('#party_size').selectOption('3');
  await page.getByRole('button', { name: /join the list/i }).click();
  await expect(page).toHaveURL(/\/spot\//);
  // Casey was served, so Devon is #1 with 0 ahead.
  await expect(page.locator('[data-position]')).toHaveText('#1');
  const spotUrl = page.url();

  // Add a third customer to confirm party-size counts toward "ahead".
  const third = await page.context().newPage();
  await third.goto(publicEventUrl);
  await third.locator('#name').fill('Emm');
  await third.locator('#party_size').selectOption('1');
  await third.getByRole('button', { name: /join the list/i }).click();
  // Devon is a party of 3, so Emm should see 3 people ahead.
  await expect(third.getByText(/3 people ahead of you/i)).toBeVisible();
  await third.close();

  // Devon's live spot still shows #1.
  await page.goto(spotUrl);
  await expect(page.locator('[data-position]')).toHaveText('#1');
});

test('public artist page lists the event and shows the footer', async ({ page }) => {
  await page.goto(`/@${handle}`);
  await expect(page.getByRole('heading', { name: 'Aria Gold' })).toBeVisible();
  await expect(page.getByText('Saturday Market Pop-Up').or(page.getByText('The Maker Market'))).toBeVisible();
  await expect(page.getByText(/Made with/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /create your own pop-up page/i })).toBeVisible();
});

test('bad tokens render a friendly 404', async ({ page }) => {
  const res = await page.goto('/e/not-a-real-token');
  expect(res.status()).toBe(404);
  await expect(page.getByText(/Nothing here/i)).toBeVisible();

  const res2 = await page.goto('/@nobodyhere');
  expect(res2.status()).toBe(404);

  const res3 = await page.goto('/dashboard/bogus-owner-token');
  expect(res3.status()).toBe(404);
});
