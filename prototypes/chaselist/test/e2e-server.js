'use strict';
// Starts the app against a throwaway DB + uploads dir for Playwright runs.
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'e2e.db');
const uploadsDir = path.join(__dirname, '..', 'uploads', 'e2e');

for (const p of [dbPath, dbPath + '-wal', dbPath + '-shm']) {
  fs.rmSync(p, { force: true });
}
fs.rmSync(uploadsDir, { recursive: true, force: true });

process.env.DB_PATH = dbPath;
process.env.UPLOADS_DIR = uploadsDir;
require('../src/server');
