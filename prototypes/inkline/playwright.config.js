'use strict';

// Browsers are preinstalled at /opt/pw-browsers — never run `playwright install`.
process.env.PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';

const path = require('path');
const { defineConfig } = require('@playwright/test');

const PORT = 4173;

module.exports = defineConfig({
  testDir: './test/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: 'chromium',
  },
  webServer: {
    command: 'rm -rf data/e2e && node src/server.js',
    port: PORT,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      // e2e always runs against the stub with an isolated database.
      TRANSCRIBE_PROVIDER: '',
      ANTHROPIC_API_KEY: '',
      INKLINE_DATA_DIR: path.join(__dirname, 'data', 'e2e'),
    },
  },
});
