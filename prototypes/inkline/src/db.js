'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.INKLINE_DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'inkline.sqlite3'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Family documents',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  transcription TEXT NOT NULL, -- JSON: [{words:[{text,confidence}]}]
  warnings TEXT NOT NULL,      -- JSON: [string]
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

function newToken() {
  return crypto.randomBytes(16).toString('base64url');
}

const stmts = {
  insertCollection: db.prepare(
    'INSERT INTO collections (token, title) VALUES (?, ?)'
  ),
  collectionByToken: db.prepare('SELECT * FROM collections WHERE token = ?'),
  collectionById: db.prepare('SELECT * FROM collections WHERE id = ?'),
  insertDocument: db.prepare(`
    INSERT INTO documents
      (token, collection_id, title, original_filename, stored_filename, mime,
       provider, status, transcription, warnings)
    VALUES
      (@token, @collection_id, @title, @original_filename, @stored_filename,
       @mime, @provider, @status, @transcription, @warnings)
  `),
  documentByToken: db.prepare('SELECT * FROM documents WHERE token = ?'),
  documentsByCollection: db.prepare(
    'SELECT * FROM documents WHERE collection_id = ? ORDER BY created_at DESC, id DESC'
  ),
  updateTitle: db.prepare('UPDATE documents SET title = ? WHERE token = ?'),
};

function createCollection(title = 'Family documents') {
  const token = newToken();
  const info = stmts.insertCollection.run(token, title);
  return stmts.collectionById.get(info.lastInsertRowid);
}

function getCollectionByToken(token) {
  return stmts.collectionByToken.get(token);
}

function getCollectionById(id) {
  return stmts.collectionById.get(id);
}

function createDocument(fields) {
  const token = newToken();
  stmts.insertDocument.run({
    token,
    collection_id: fields.collectionId,
    title: fields.title,
    original_filename: fields.originalFilename,
    stored_filename: fields.storedFilename,
    mime: fields.mime,
    provider: fields.provider,
    status: fields.status,
    transcription: JSON.stringify(fields.lines),
    warnings: JSON.stringify(fields.warnings),
  });
  return stmts.documentByToken.get(token);
}

function getDocumentByToken(token) {
  return stmts.documentByToken.get(token);
}

function getDocumentsForCollection(collectionId) {
  return stmts.documentsByCollection.all(collectionId);
}

function updateDocumentTitle(token, title) {
  return stmts.updateTitle.run(title, token);
}

module.exports = {
  db,
  DATA_DIR,
  UPLOAD_DIR,
  newToken,
  createCollection,
  getCollectionByToken,
  getCollectionById,
  createDocument,
  getDocumentByToken,
  getDocumentsForCollection,
  updateDocumentTitle,
};
