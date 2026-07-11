'use strict';
const path = require('path');
const { createApp } = require('./app');
const reminders = require('./reminders');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const dbPath =
  process.env.DB_PATH || path.join(__dirname, '..', 'data', 'chaselist.db');
const uploadsDir =
  process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

const app = createApp({ dbPath, uploadsDir });

// Materialize due reminders on startup and every 10 minutes (log only).
reminders.runTick(app.locals.db, new Date());
setInterval(() => reminders.runTick(app.locals.db, new Date()), 10 * 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`ChaseList listening on http://localhost:${PORT}`);
});
