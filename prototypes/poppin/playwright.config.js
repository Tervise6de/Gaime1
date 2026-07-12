'use strict';

// Browsers are preinstalled at /opt/pw-browsers — never run `playwright install`.
process.env.PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';

const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const PORT = 3241;

module.exports = defineConfig({
  testDir: './test/e2e',
  testMatch: 'e2e.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Mobile-first product: run the journey in an iPhone 13 viewport, but on
    // the preinstalled Chromium (WebKit isn't available at /opt/pw-browsers).
    ...devices['iPhone 13'],
    browserName: 'chromium',
    defaultBrowserType: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'rm -rf data/e2e && node src/server.js',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      PORT: String(PORT),
      POPPIN_DATA_DIR: path.join(__dirname, 'data', 'e2e'),
    },
  },
});
