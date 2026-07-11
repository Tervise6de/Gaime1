'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const store = require('./db');
const transcriber = require('./transcribe');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
// Upload handling: 15MB limit, mime whitelist, random stored names in data/
// (uploads are served only through the tokenized route below, never directly).
// ---------------------------------------------------------------------------
const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: store.UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = ALLOWED[file.mimetype] || '.bin';
      cb(null, crypto.randomBytes(16).toString('base64url') + ext);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    cb(
      new Error(
        'Unsupported file type. Upload a JPG, PNG, or WEBP image (export PDF pages as images first).'
      )
    );
  },
});

function defaultTitle(originalName) {
  const base = path.basename(originalName, path.extname(originalName));
  const cleaned = base.replace(/[_-]+/g, ' ').trim();
  return cleaned || 'Untitled document';
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.render('home', {
    isStub: transcriber.isStub(),
    provider: transcriber.activeProviderName(),
    error: null,
    collectionToken: null,
  });
});

app.post('/upload', (req, res) => {
  upload.single('document')(req, res, async (err) => {
    const renderError = (message, status = 400) =>
      res.status(status).render('home', {
        isStub: transcriber.isStub(),
        provider: transcriber.activeProviderName(),
        error: message,
        collectionToken: (req.body && req.body.collection_token) || null,
      });

    if (err) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'That file is larger than the 15MB limit.'
          : err.message;
      return renderError(msg);
    }
    if (!req.file) return renderError('Choose an image to upload.');

    // Collection: reuse if a valid token was passed, otherwise create one.
    let collection = null;
    if (req.body.collection_token) {
      collection = store.getCollectionByToken(req.body.collection_token);
    }
    if (!collection) collection = store.createCollection();

    let result;
    try {
      result = await transcriber.transcribe(req.file.path, {
        mediaType: req.file.mimetype,
        originalName: req.file.originalname,
      });
    } catch (e) {
      result = {
        status: 'failed',
        provider: transcriber.activeProviderName(),
        lines: [],
        warnings: [`Transcription crashed: ${e.message}`],
      };
    }

    const doc = store.createDocument({
      collectionId: collection.id,
      title: defaultTitle(req.file.originalname),
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      mime: req.file.mimetype,
      provider: result.provider,
      status: result.status,
      lines: result.lines,
      warnings: result.warnings,
    });

    res.redirect(`/a/${doc.token}`);
  });
});

// Public artifact page (tokenized, shareable).
app.get('/a/:token', (req, res) => {
  const doc = store.getDocumentByToken(req.params.token);
  if (!doc) return res.status(404).render('notfound', { what: 'document' });
  const collection = store.getCollectionById(doc.collection_id);
  res.render('document', {
    doc,
    lines: JSON.parse(doc.transcription),
    warnings: JSON.parse(doc.warnings),
    collection,
    isStubResult: doc.provider === 'stub',
    uncertainThreshold: 0.75,
  });
});

// Rename a document (title editable on the artifact page).
app.post('/a/:token/title', (req, res) => {
  const doc = store.getDocumentByToken(req.params.token);
  if (!doc) return res.status(404).render('notfound', { what: 'document' });
  const title = (req.body.title || '').trim().slice(0, 200);
  if (title) store.updateDocumentTitle(doc.token, title);
  res.redirect(`/a/${doc.token}`);
});

// Original image, served through the app under the document's token —
// stored filenames are random and the uploads directory is never exposed.
app.get('/a/:token/image', (req, res) => {
  const doc = store.getDocumentByToken(req.params.token);
  if (!doc) return res.status(404).end();
  const filePath = path.join(store.UPLOAD_DIR, path.basename(doc.stored_filename));
  res.type(doc.mime);
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) res.status(404).end();
  });
});

// Public collection page (tokenized).
app.get('/c/:token', (req, res) => {
  const collection = store.getCollectionByToken(req.params.token);
  if (!collection) return res.status(404).render('notfound', { what: 'collection' });
  const docs = store.getDocumentsForCollection(collection.id);
  res.render('collection', {
    collection,
    docs,
    isStub: transcriber.isStub(),
    provider: transcriber.activeProviderName(),
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).send('Something went wrong.');
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`InkLine listening on http://localhost:${PORT}`);
    console.log(`Transcription provider: ${transcriber.activeProviderName()}`);
    if (transcriber.isStub()) {
      console.log(
        'STUB MODE — set TRANSCRIBE_PROVIDER=anthropic and ANTHROPIC_API_KEY for real transcription.'
      );
    }
  });
}

module.exports = app;
