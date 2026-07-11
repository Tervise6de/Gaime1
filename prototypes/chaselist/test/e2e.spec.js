'use strict';
const path = require('path');
const { test, expect, devices } = require('@playwright/test');

const BASE = 'http://127.0.0.1:3199';
const FIXTURES = path.join(__dirname, 'fixtures');

/** Create a request via the HTTP API; returns { detailUrl, id, recipientUrl, token }. */
async function apiCreateRequest(request, { title, itemLabel, expiresDays }) {
  const res = await request.post('/requests', {
    form: {
      client_id: 'new',
      client_name: 'API Client',
      client_email: 'api@example.com',
      title,
      item_label: itemLabel,
      expires_days: String(expiresDays),
    },
  });
  expect(res.status()).toBe(200); // after redirect to detail page
  const detailUrl = res.url();
  const html = await res.text();
  const m = html.match(/value="[^"]*\/r\/([A-Za-z0-9_-]+)"/);
  expect(m, 'share link should be on the detail page').toBeTruthy();
  return {
    detailUrl,
    id: detailUrl.match(/\/requests\/(\d+)/)[1],
    token: m[1],
    recipientUrl: `/r/${m[1]}`,
  };
}

test.describe('full two-sided loop', () => {
  test('create from template -> mobile recipient uploads -> sender sees status -> zip -> confirmation CTA', async ({
    page,
    browser,
  }) => {
    // --- SENDER: create a request from the "Monthly close" template ---
    await page.goto('/requests/new');
    await page.fill('input[name=client_name]', 'Acme Plumbing LLC');
    await page.fill('input[name=client_email]', 'owner@acme.test');
    await page.fill('input[name=title]', 'March 2026 monthly close');
    await page.getByTestId('tpl-monthly-close').click();
    // template appended 6 item rows (plus the initial blank row was removed)
    await expect(page.locator('#items .item-editor-row')).toHaveCount(6);
    await page.getByTestId('create-request').click();
    await expect(page).toHaveURL(/\/requests\/\d+$/);
    const detailUrl = page.url();

    // --- extract the recipient link ---
    const shareLink = await page.getByTestId('share-link').inputValue();
    expect(shareLink).toMatch(/\/r\/[A-Za-z0-9_-]{22}$/);

    // --- RECIPIENT: open link on an iPhone-ish viewport, no login ---
    const mobile = await browser.newContext({ ...devices['iPhone 13'], baseURL: BASE });
    const mpage = await mobile.newPage();
    await mpage.goto(shareLink);

    const items = mpage.getByTestId('recipient-item');
    await expect(items).toHaveCount(6);
    await expect(mpage.getByTestId('recipient-progress')).toHaveText('0 of 6 done');

    // Frictionless check: a usable file input is present immediately on load —
    // tap 1 = "Choose file", tap 2 = pick file, auto-submit. No login, no modal.
    const firstInput = mpage.locator('[data-testid^="file-input-"]').first();
    await expect(firstInput).toBeEnabled();

    // upload fixture 1 (png) to item 1 — change event auto-submits the form
    await firstInput.setInputFiles(path.join(FIXTURES, 'bank-statement.png'));
    await mpage.waitForURL(/#item-\d+$/);
    await expect(items.nth(0)).toHaveAttribute('data-status', 'received');
    await expect(items.nth(0)).toContainText('bank-statement.png');
    await expect(mpage.getByTestId('recipient-progress')).toHaveText('1 of 6 done');

    // upload fixture 2 (pdf) to item 2
    await items
      .nth(1)
      .locator('[data-testid^="file-input-"]')
      .setInputFiles(path.join(FIXTURES, 'payroll-report.pdf'));
    await mpage.waitForURL(/#item-\d+$/);
    await expect(items.nth(1)).toHaveAttribute('data-status', 'received');

    // mark item 3 "I don't have this" with a note
    await items.nth(2).locator('details.na-details summary').click();
    await items.nth(2).locator('textarea[name=note]').fill('Loan was paid off in January');
    await items.nth(2).locator('button[type=submit]').click();
    await mpage.waitForURL(/#item-\d+$/);
    await expect(items.nth(2)).toHaveAttribute('data-status', 'not_available');
    await expect(mpage.getByTestId('recipient-progress')).toHaveText('3 of 6 done');

    // --- SENDER: detail page shows statuses and downloadable files ---
    await page.goto(detailUrl);
    await expect(page.getByTestId('detail-progress')).toContainText('2/6 received');
    await expect(page.getByTestId('detail-progress')).toContainText('1 marked not available');
    const rows = page.getByTestId('detail-item');
    await expect(rows.nth(0).locator('.chip-received')).toBeVisible();
    await expect(rows.nth(1).locator('.chip-received')).toBeVisible();
    await expect(rows.nth(2).locator('.chip-na')).toBeVisible();
    await expect(rows.nth(2).getByTestId('na-note')).toContainText('paid off in January');
    await expect(page.getByTestId('file-link').nth(0)).toContainText('bank-statement.png');
    await expect(page.getByTestId('file-link').nth(1)).toContainText('payroll-report.pdf');

    // a stored file downloads through the sender route
    const fileHref = await page.getByTestId('file-link').first().getAttribute('href');
    const fileRes = await page.request.get(fileHref);
    expect(fileRes.status()).toBe(200);
    expect((await fileRes.body()).length).toBeGreaterThan(0);

    // ZIP download responds 200 with zip content
    const zipRes = await page.request.get(`${detailUrl}/download.zip`);
    expect(zipRes.status()).toBe(200);
    expect(zipRes.headers()['content-type']).toContain('application/zip');
    const zipBody = await zipRes.body();
    expect(zipBody.length).toBeGreaterThan(100);
    expect(zipBody.slice(0, 2).toString()).toBe('PK'); // zip magic bytes

    // --- RECIPIENT: resolve the remaining 3 items -> confirmation + CTA ---
    for (let i = 0; i < 3; i++) {
      await mpage
        .locator('[data-testid="recipient-item"][data-status="pending"]')
        .first()
        .locator('details.na-details summary')
        .click();
      await mpage
        .locator('[data-testid="recipient-item"][data-status="pending"]')
        .first()
        .locator('button[type=submit]')
        .click();
      await mpage.waitForURL(/#item-\d+$/);
    }

    await mpage.goto(shareLink);
    await expect(mpage.getByTestId('confirmation')).toBeVisible();
    await expect(mpage.getByTestId('confirmation-summary')).toContainText('6 of 6 items resolved');
    const cta = mpage.getByTestId('conversion-cta');
    await expect(cta).toContainText('Need to collect documents from your own clients?');
    await expect(mpage.getByTestId('cta-link')).toHaveText('Create your first request list');
    await expect(mpage.getByTestId('cta-link')).toHaveAttribute('href', '/requests/new');

    // sender side flips to complete
    await page.goto(detailUrl);
    await expect(page.getByTestId('request-status')).toHaveText('complete');

    await mobile.close();
  });
});

test.describe('token safety', () => {
  test('expired token shows a friendly error page', async ({ page }) => {
    const { recipientUrl } = await apiCreateRequest(page.request, {
      title: 'Expired request',
      itemLabel: 'Doc A',
      expiresDays: 0, // expires immediately
    });
    const res = await page.goto(recipientUrl);
    expect(res.status()).toBe(410);
    await expect(page.getByTestId('token-error')).toContainText('This link has expired');
  });

  test('invalid token shows a friendly not-found page', async ({ page }) => {
    const res = await page.goto('/r/definitely-not-a-real-token');
    expect(res.status()).toBe(404);
    await expect(page.getByTestId('token-error')).toContainText("couldn't find that link");
  });
});

test.describe('upload validation', () => {
  test('oversize file is rejected with a friendly message', async ({ page }) => {
    const { recipientUrl } = await apiCreateRequest(page.request, {
      title: 'Oversize check',
      itemLabel: 'Big doc',
      expiresDays: 30,
    });
    await page.goto(recipientUrl);
    await page.locator('[data-testid^="file-input-"]').first().setInputFiles({
      name: 'huge-statement.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(11 * 1024 * 1024, 65), // 11 MB > 10 MB limit
    });
    await page.waitForURL(/err=too-large/);
    await expect(page.getByTestId('upload-error')).toContainText('too large');
    await expect(page.getByTestId('recipient-item').first()).toHaveAttribute(
      'data-status',
      'pending'
    );
  });

  test('disallowed file type is rejected with a friendly message', async ({ page }) => {
    const { recipientUrl } = await apiCreateRequest(page.request, {
      title: 'Type check',
      itemLabel: 'Some doc',
      expiresDays: 30,
    });
    await page.goto(recipientUrl);
    await page.locator('[data-testid^="file-input-"]').first().setInputFiles({
      name: 'script.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ fake executable'),
    });
    await page.waitForURL(/err=bad-type/);
    await expect(page.getByTestId('upload-error')).toContainText("isn't accepted");
    await expect(page.getByTestId('recipient-item').first()).toHaveAttribute(
      'data-status',
      'pending'
    );

    // mime spoofing: right extension, wrong reported mime
    await page.locator('[data-testid^="file-input-"]').first().setInputFiles({
      name: 'fake.pdf',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('not really a pdf'),
    });
    await page.waitForURL(/err=bad-type/);
    await expect(page.getByTestId('upload-error')).toContainText("isn't accepted");
  });
});
