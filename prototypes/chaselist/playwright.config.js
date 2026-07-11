'use strict';
const { defineConfig } = require('@playwright/test');

const PORT = 3199;

module.exports = defineConfig({
  testDir: './test',
  testMatch: 'e2e.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node test/e2e-server.js',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: { PORT: String(PORT) },
  },
});
