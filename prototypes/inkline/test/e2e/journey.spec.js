'use strict';

const path = require('path');
const { test, expect } = require('@playwright/test');

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'handwriting-sample.png');

test.describe('InkLine full journey (stub provider)', () => {
  test('upload -> artifact page -> share -> collection -> CTA', async ({ page, browser }) => {
    // --- Home page: stub banner + upload form -----------------------------
    await page.goto('/');
    await expect(page.getByTestId('stub-banner')).toBeVisible();
    await expect(page.getByTestId('upload-form')).toBeVisible();

    // --- Upload a fixture image -------------------------------------------
    await page.setInputFiles('#file-input', FIXTURE);
    await expect(page.getByTestId('dz-filename')).toHaveText('handwriting-sample.png');
    await page.getByTestId('transcribe-btn').click();

    // --- Document/artifact page -------------------------------------------
    await page.waitForURL(/\/a\/[A-Za-z0-9_-]+$/);
    const artifactUrl = page.url();

    // Stub banner must be prominently displayed on stub results.
    await expect(page.getByTestId('stub-banner')).toBeVisible();
    await expect(page.getByTestId('provider')).toHaveText('stub');

    // Side-by-side: original image + transcription with content.
    await expect(page.locator('.original-pane img')).toBeVisible();
    await expect(page.getByTestId('transcription')).toBeVisible();
    const lineCount = await page.locator('.t-line').count();
    expect(lineCount).toBeGreaterThan(0);

    // Uncertain words highlighted with tooltip.
    const uncertain = page.getByTestId('uncertain-word');
    expect(await uncertain.count()).toBeGreaterThan(0);
    await expect(uncertain.first()).toHaveAttribute('title', /uncertain/);

    // Conversion CTA present.
    await expect(page.getByTestId('cta')).toBeVisible();
    await expect(page.getByTestId('cta')).toContainText(/first page free/i);

    // Share URL is populated with the artifact URL.
    await expect(page.getByTestId('share-url')).toHaveValue(artifactUrl);

    // --- Title is editable --------------------------------------------------
    await page.getByTestId('title-input').fill('Grandma’s letter');
    await page.getByRole('button', { name: 'Save title' }).click();
    await expect(page.getByTestId('title-input')).toHaveValue('Grandma’s letter');

    // --- Share link works in a fresh browser context (public access) -------
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await freshPage.goto(artifactUrl);
    await expect(freshPage.getByTestId('transcription')).toBeVisible();
    await expect(freshPage.getByTestId('title-input')).toHaveValue('Grandma’s letter');
    await expect(freshPage.getByTestId('cta')).toBeVisible();
    await expect(freshPage.getByTestId('stub-banner')).toBeVisible();
    await freshContext.close();

    // --- Collection page lists the document --------------------------------
    await page.getByTestId('collection-link').click();
    await page.waitForURL(/\/c\/[A-Za-z0-9_-]+$/);
    await expect(page.getByTestId('doc-list')).toContainText('Grandma’s letter');
    // Collection page is public too.
    const collectionUrl = page.url();
    const freshContext2 = await browser.newContext();
    const freshPage2 = await freshContext2.newPage();
    await freshPage2.goto(collectionUrl);
    await expect(freshPage2.getByTestId('doc-list')).toContainText('Grandma’s letter');
    await freshContext2.close();
  });

  test('rejects non-image uploads', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('#file-input', {
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });
    await page.getByTestId('transcribe-btn').click();
    await expect(page.getByTestId('upload-error')).toBeVisible();
    await expect(page.getByTestId('upload-error')).toContainText(/unsupported file type/i);
  });

  test('unknown artifact token returns 404', async ({ page }) => {
    const resp = await page.goto('/a/does-not-exist-token');
    expect(resp.status()).toBe(404);
  });
});
