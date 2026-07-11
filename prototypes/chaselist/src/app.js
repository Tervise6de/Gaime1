'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const archiver = require('archiver');

const { createDb } = require('./db');
const security = require('./security');
const reminders = require('./reminders');
const templates = require('./templates');

const DAY_MS = 24 * 60 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function isExpired(request, now = new Date()) {
  return new Date(request.expires_at).getTime() <= now.getTime();
}

function itemStats(items) {
  const received = items.filter((i) => i.status === 'received').length;
  const na = items.filter((i) => i.status === 'not_available').length;
  return { total: items.length, received, na, resolved: received + na };
}

/**
 * Build the ChaseList Express app.
 * @param {{dbPath:string, uploadsDir:string}} opts
 */
function createApp(opts = {}) {
  const dbPath = opts.dbPath || path.join(__dirname, '..', 'data', 'chaselist.db');
  const uploadsDir = opts.uploadsDir || path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const db = createDb(dbPath);
  const limiter = new security.RateLimiter();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: security.MAX_FILE_BYTES, files: 1 },
    fileFilter(req, file, cb) {
      // Multer decodes originalname as latin1; fix to utf8.
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const check = security.checkFile(file.originalname, file.mimetype);
      if (!check.ok) {
        const err = new Error('file type not allowed');
        err.code = 'BAD_FILE_TYPE';
        return cb(err);
      }
      file.checkedExt = check.ext;
      cb(null, true);
    },
  });

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(express.urlencoded({ extended: true }));
  app.use('/assets', express.static(path.join(__dirname, '..', 'public')));

  // ---------- helpers ----------

  const getRequest = db.prepare('SELECT * FROM requests WHERE id = ?');
  const getRequestByToken = db.prepare('SELECT * FROM requests WHERE token = ?');
  const getItems = db.prepare(
    'SELECT * FROM request_items WHERE request_id = ? ORDER BY id'
  );
  const getClient = db.prepare('SELECT * FROM clients WHERE id = ?');
  const getFilesForItem = db.prepare(
    'SELECT * FROM files WHERE item_id = ? ORDER BY id'
  );

  function baseUrl(req) {
    return `${req.protocol}://${req.get('host')}`;
  }

  function maybeComplete(requestId) {
    const items = getItems.all(requestId);
    if (reminders.allResolved(items)) {
      db.prepare("UPDATE requests SET status = 'complete' WHERE id = ?").run(requestId);
    }
  }

  function loadRecipient(token) {
    const request = getRequestByToken.get(token);
    if (!request) return { error: 'invalid' };
    if (isExpired(request)) return { error: 'expired', request };
    const items = getItems.all(request.id).map((item) => ({
      ...item,
      files: getFilesForItem.all(item.id),
    }));
    // Note: named clientInfo (not "client") — EJS renderFile treats a
    // top-level "client" local as its compile-to-client option.
    return { request, items, clientInfo: getClient.get(request.client_id) };
  }

  // ---------- sender: dashboard ----------

  app.get('/', (req, res) => {
    const rows = db
      .prepare('SELECT * FROM requests ORDER BY created_at DESC, id DESC')
      .all()
      .map((request) => {
        const items = getItems.all(request.id);
        return {
          ...request,
          client: getClient.get(request.client_id),
          stats: itemStats(items),
          expired: isExpired(request),
        };
      });
    res.render('dashboard', { requests: rows });
  });

  // ---------- sender: new request ----------

  app.get('/requests/new', (req, res) => {
    const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
    res.render('new-request', { clients, templates });
  });

  app.post('/requests', (req, res) => {
    const body = req.body || {};
    let clientId = parseInt(body.client_id, 10);
    if (!clientId || body.client_id === 'new') {
      const name = String(body.client_name || '').trim();
      const email = String(body.client_email || '').trim();
      if (!name) return res.status(400).send('Client name is required.');
      clientId = db
        .prepare('INSERT INTO clients (name, email) VALUES (?, ?)')
        .run(name, email).lastInsertRowid;
    } else if (!getClient.get(clientId)) {
      return res.status(400).send('Unknown client.');
    }

    const title = String(body.title || '').trim();
    if (!title) return res.status(400).send('Title is required.');

    const labels = [].concat(body.item_label || []);
    const descs = [].concat(body.item_description || []);
    const items = labels
      .map((label, i) => ({
        label: String(label || '').trim(),
        description: String(descs[i] || '').trim(),
      }))
      .filter((it) => it.label);
    if (items.length === 0) return res.status(400).send('At least one item is required.');

    let expiresDays = parseInt(body.expires_days, 10);
    if (Number.isNaN(expiresDays)) expiresDays = security.DEFAULT_EXPIRY_DAYS;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresDays * DAY_MS).toISOString();

    const requestId = db.transaction(() => {
      const id = db
        .prepare(
          `INSERT INTO requests (client_id, title, note, token, expires_at, created_at, status)
           VALUES (?, ?, ?, ?, ?, ?, 'open')`
        )
        .run(
          clientId,
          title,
          String(body.note || '').trim(),
          security.newToken(),
          expiresAt,
          now.toISOString()
        ).lastInsertRowid;
      const ins = db.prepare(
        'INSERT INTO request_items (request_id, label, description) VALUES (?, ?, ?)'
      );
      for (const it of items) ins.run(id, it.label, it.description);
      return id;
    })();

    res.redirect(`/requests/${requestId}`);
  });

  // ---------- sender: request detail ----------

  app.get('/requests/:id', (req, res) => {
    const request = getRequest.get(req.params.id);
    if (!request) return res.status(404).send('Request not found.');
    const items = getItems.all(request.id).map((item) => ({
      ...item,
      files: getFilesForItem.all(item.id),
    }));
    const outbox = db
      .prepare('SELECT * FROM outbox WHERE request_id = ? ORDER BY scheduled_for')
      .all(request.id);
    const schedule = reminders.computeSchedule(request, items, new Date());
    res.render('request-detail', {
      request,
      clientInfo: getClient.get(request.client_id),
      items,
      stats: itemStats(items),
      outbox,
      schedule,
      expired: isExpired(request),
      recipientUrl: `${baseUrl(req)}/r/${request.token}`,
    });
  });

  // Serve stored files only via this sender route (id-based, checked in DB).
  app.get('/requests/:id/files/:fileId', (req, res) => {
    const request = getRequest.get(req.params.id);
    if (!request) return res.status(404).send('Not found.');
    const file = db
      .prepare(
        `SELECT f.* FROM files f
         JOIN request_items i ON i.id = f.item_id
         WHERE f.id = ? AND i.request_id = ?`
      )
      .get(req.params.fileId, request.id);
    if (!file) return res.status(404).send('Not found.');
    const abs = path.join(uploadsDir, path.basename(file.stored_name));
    if (!fs.existsSync(abs)) return res.status(410).send('File missing on disk.');
    res.type(file.mime);
    res.download(abs, file.original_name);
  });

  // Download everything as a ZIP bundle.
  app.get('/requests/:id/download.zip', (req, res) => {
    const request = getRequest.get(req.params.id);
    if (!request) return res.status(404).send('Not found.');
    const files = db
      .prepare(
        `SELECT f.*, i.label AS item_label FROM files f
         JOIN request_items i ON i.id = f.item_id
         WHERE i.request_id = ? ORDER BY i.id, f.id`
      )
      .all(request.id);

    res.status(200);
    res.setHeader('Content-Type', 'application/zip');
    const zipName = request.title.replace(/[^\w.-]+/g, '_') || 'chaselist';
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', () => res.destroy());
    archive.pipe(res);
    const seen = new Set();
    for (const f of files) {
      const abs = path.join(uploadsDir, path.basename(f.stored_name));
      if (!fs.existsSync(abs)) continue;
      const prefix = f.item_label.replace(/[^\w.-]+/g, '_').slice(0, 60);
      let name = `${prefix}/${f.original_name}`;
      let n = 1;
      while (seen.has(name)) name = `${prefix}/${n++}_${f.original_name}`;
      seen.add(name);
      archive.file(abs, { name });
    }
    if (files.length === 0) {
      archive.append(`No files uploaded yet for "${request.title}".\n`, {
        name: 'EMPTY.txt',
      });
    }
    archive.finalize();
  });

  // Reminder tick: materialize due reminders into the outbox (log only).
  app.post('/tick', (req, res) => {
    const created = reminders.runTick(db, new Date());
    if (req.get('accept') && req.get('accept').includes('json')) {
      return res.json({ created });
    }
    res.redirect(req.get('referer') || '/');
  });

  // ---------- recipient (tokenized, no login) ----------

  app.get('/r/:token', (req, res) => {
    const ctx = loadRecipient(req.params.token);
    if (ctx.error) {
      return res.status(ctx.error === 'invalid' ? 404 : 410).render('token-error', {
        kind: ctx.error,
      });
    }
    const stats = itemStats(ctx.items);
    if (stats.resolved === stats.total && !req.query.edit) {
      return res.render('recipient-done', { ...ctx, stats });
    }
    res.render('recipient', {
      ...ctx,
      stats,
      err: typeof req.query.err === 'string' ? req.query.err : null,
      errItem: typeof req.query.item === 'string' ? req.query.item : null,
    });
  });

  function recipientItem(req, res) {
    const ctx = loadRecipient(req.params.token);
    if (ctx.error) {
      res.status(ctx.error === 'invalid' ? 404 : 410).render('token-error', {
        kind: ctx.error,
      });
      return null;
    }
    const item = ctx.items.find((i) => String(i.id) === String(req.params.itemId));
    if (!item) {
      res.status(404).render('token-error', { kind: 'invalid' });
      return null;
    }
    return { ...ctx, item };
  }

  app.post('/r/:token/items/:itemId/upload', (req, res) => {
    const ctx = recipientItem(req, res);
    if (!ctx) return;
    const redirectErr = (err) =>
      res.redirect(
        `/r/${req.params.token}?err=${err}&item=${ctx.item.id}#item-${ctx.item.id}`
      );

    if (!limiter.allow(req.params.token)) return redirectErr('rate');

    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return redirectErr('too-large');
        if (err.code === 'BAD_FILE_TYPE') return redirectErr('bad-type');
        return redirectErr('upload');
      }
      if (!req.file) return redirectErr('no-file');

      const stored = security.storedName(req.file.checkedExt);
      fs.writeFileSync(path.join(uploadsDir, stored), req.file.buffer);
      db.transaction(() => {
        db.prepare(
          `INSERT INTO files (item_id, original_name, stored_name, size, mime, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          ctx.item.id,
          req.file.originalname,
          stored,
          req.file.size,
          req.file.mimetype,
          nowIso()
        );
        db.prepare(
          "UPDATE request_items SET status = 'received', na_note = '' WHERE id = ?"
        ).run(ctx.item.id);
      })();
      maybeComplete(ctx.request.id);
      res.redirect(`/r/${req.params.token}#item-${ctx.item.id}`);
    });
  });

  app.post('/r/:token/items/:itemId/na', (req, res) => {
    const ctx = recipientItem(req, res);
    if (!ctx) return;
    if (ctx.item.status !== 'received') {
      db.prepare(
        "UPDATE request_items SET status = 'not_available', na_note = ? WHERE id = ?"
      ).run(String((req.body && req.body.note) || '').trim().slice(0, 500), ctx.item.id);
      maybeComplete(ctx.request.id);
    }
    res.redirect(`/r/${req.params.token}#item-${ctx.item.id}`);
  });

  // Let a recipient undo "I don't have this" while the link is live.
  app.post('/r/:token/items/:itemId/reopen', (req, res) => {
    const ctx = recipientItem(req, res);
    if (!ctx) return;
    if (ctx.item.status === 'not_available') {
      db.prepare(
        "UPDATE request_items SET status = 'pending', na_note = '' WHERE id = ?"
      ).run(ctx.item.id);
      db.prepare("UPDATE requests SET status = 'open' WHERE id = ?").run(ctx.request.id);
    }
    res.redirect(`/r/${req.params.token}#item-${ctx.item.id}`);
  });

  app.use((req, res) => res.status(404).send('Not found.'));

  app.locals.db = db; // exposed for tests/server shutdown
  return app;
}

module.exports = { createApp };
