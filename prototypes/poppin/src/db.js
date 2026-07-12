'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const waitlist = require('./waitlist');

// data/ is auto-created; DB path can be overridden for isolated test runs.
const DATA_DIR = process.env.POPPIN_DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'poppin.sqlite3'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS artist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  bio TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  owner_token TEXT NOT NULL UNIQUE,
  pro INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL REFERENCES artist(id),
  title TEXT NOT NULL,
  venue_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  ends_at TEXT,
  public_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL REFERENCES artist(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS waitlist_entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES event(id),
  entry_token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  -- phone is optional and stored raw only to support a (stubbed) "you're up"
  -- text. Data minimization: never required, never displayed publicly, and
  -- nothing is ever actually sent (see outbox).
  phone TEXT,
  party_size INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting',
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  notified_at TEXT,
  served_at TEXT
);

-- Notification log. Rows here represent messages we WOULD send; nothing is
-- ever transmitted in the prototype (no SMS/email provider is wired up).
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES waitlist_entry(id),
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_event_artist ON event(artist_id);
CREATE INDEX IF NOT EXISTS idx_catalog_artist ON catalog_item(artist_id, sort);
CREATE INDEX IF NOT EXISTS idx_entry_event ON waitlist_entry(event_id, joined_at);
`);

function newToken() {
  return crypto.randomBytes(16).toString('base64url');
}

// Slugify a name into a handle candidate and make it unique against the table.
function slugifyHandle(raw) {
  let base = String(raw || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  if (!base) base = 'artist';
  return base;
}

function uniqueHandle(raw) {
  const base = slugifyHandle(raw);
  let candidate = base;
  let n = 1;
  while (stmts.artistByHandle.get(candidate)) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

const stmts = {
  insertArtist: db.prepare(
    `INSERT INTO artist (name, handle, bio, instagram, owner_token, pro)
     VALUES (@name, @handle, @bio, @instagram, @owner_token, @pro)`
  ),
  artistById: db.prepare('SELECT * FROM artist WHERE id = ?'),
  artistByHandle: db.prepare('SELECT * FROM artist WHERE handle = ? COLLATE NOCASE'),
  artistByOwnerToken: db.prepare('SELECT * FROM artist WHERE owner_token = ?'),
  updateArtist: db.prepare(
    `UPDATE artist SET name = @name, handle = @handle, bio = @bio,
       instagram = @instagram WHERE id = @id`
  ),

  insertEvent: db.prepare(
    `INSERT INTO event (artist_id, title, venue_name, address, starts_at, ends_at, public_token, status)
     VALUES (@artist_id, @title, @venue_name, @address, @starts_at, @ends_at, @public_token, @status)`
  ),
  eventById: db.prepare('SELECT * FROM event WHERE id = ?'),
  eventByToken: db.prepare('SELECT * FROM event WHERE public_token = ?'),
  eventsByArtist: db.prepare('SELECT * FROM event WHERE artist_id = ? ORDER BY (starts_at IS NULL), starts_at ASC, id DESC'),
  updateEventStatus: db.prepare('UPDATE event SET status = ? WHERE id = ?'),
  updateEvent: db.prepare(
    `UPDATE event SET title = @title, venue_name = @venue_name, address = @address,
       starts_at = @starts_at, ends_at = @ends_at, status = @status WHERE id = @id`
  ),

  insertCatalog: db.prepare(
    `INSERT INTO catalog_item (artist_id, name, description, price_cents, sort)
     VALUES (@artist_id, @name, @description, @price_cents, @sort)`
  ),
  catalogById: db.prepare('SELECT * FROM catalog_item WHERE id = ?'),
  catalogByArtist: db.prepare('SELECT * FROM catalog_item WHERE artist_id = ? ORDER BY sort ASC, id ASC'),
  updateCatalog: db.prepare(
    `UPDATE catalog_item SET name = @name, description = @description, price_cents = @price_cents WHERE id = @id`
  ),
  updateCatalogSort: db.prepare('UPDATE catalog_item SET sort = ? WHERE id = ?'),
  deleteCatalog: db.prepare('DELETE FROM catalog_item WHERE id = ? AND artist_id = ?'),
  maxCatalogSort: db.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM catalog_item WHERE artist_id = ?'),

  insertEntry: db.prepare(
    `INSERT INTO waitlist_entry (event_id, entry_token, name, phone, party_size, status, joined_at)
     VALUES (@event_id, @entry_token, @name, @phone, @party_size, 'waiting', datetime('now'))`
  ),
  entryById: db.prepare('SELECT * FROM waitlist_entry WHERE id = ?'),
  entryByToken: db.prepare('SELECT * FROM waitlist_entry WHERE entry_token = ?'),
  entriesByEvent: db.prepare('SELECT * FROM waitlist_entry WHERE event_id = ? ORDER BY joined_at ASC, id ASC'),
  setEntryStatus: db.prepare(
    `UPDATE waitlist_entry SET status = @status, notified_at = @notified_at, served_at = @served_at WHERE id = @id`
  ),

  insertOutbox: db.prepare(
    'INSERT INTO outbox (entry_id, kind, body) VALUES (@entry_id, @kind, @body)'
  ),
  outboxByEvent: db.prepare(
    `SELECT o.* FROM outbox o JOIN waitlist_entry w ON w.id = o.entry_id
     WHERE w.event_id = ? ORDER BY o.id DESC LIMIT 50`
  ),
};

// ---- Higher-level helpers --------------------------------------------------

function createArtist({ name, bio = '', instagram = '', pro = 0, handle }) {
  const finalHandle = uniqueHandle(handle || name);
  const owner_token = newToken();
  const info = stmts.insertArtist.run({
    name,
    handle: finalHandle,
    bio,
    instagram,
    owner_token,
    pro,
  });
  return stmts.artistById.get(info.lastInsertRowid);
}

// Create a ready-to-demo artist (used by "create your page" + e2e bootstrap).
function createDemoArtist() {
  const artist = createArtist({
    name: 'Aria Gold',
    handle: 'ariagold',
    bio: 'Permanent jewelry, welded on. Dainty chains, zero clasps, forever sparkle. Book me for your next market or private party.',
    instagram: 'ariagold.pj',
    pro: 0,
  });
  const seed = [
    ['Dainty chain bracelet', '14k gold-filled, welded to fit. Choose your chain.', 4800],
    ['Anklet', 'Delicate gold-filled anklet, custom sized.', 5200],
    ['Charm add-on', 'Add a little sparkle — birthstone or gold charm.', 1200],
    ['Permanent necklace', 'Clasp-free, welded to your perfect length.', 6800],
  ];
  seed.forEach(([name, description, price_cents], i) => {
    stmts.insertCatalog.run({ artist_id: artist.id, name, description, price_cents, sort: i });
  });
  const event = createEvent({
    artist_id: artist.id,
    title: 'Permanent Jewelry Pop-Up',
    venue_name: 'Bloom & Vine Boutique',
    address: '128 Maple St, Rosewood',
    starts_at: null,
    ends_at: null,
    status: 'live',
  });
  return { artist, event };
}

function createEvent(data) {
  const public_token = newToken();
  const info = stmts.insertEvent.run({
    artist_id: data.artist_id,
    title: data.title,
    venue_name: data.venue_name || '',
    address: data.address || '',
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
    public_token,
    status: data.status || 'upcoming',
  });
  return stmts.eventById.get(info.lastInsertRowid);
}

function addCatalogItem({ artist_id, name, description = '', price_cents = null }) {
  const sort = stmts.maxCatalogSort.get(artist_id).m + 1;
  const info = stmts.insertCatalog.run({ artist_id, name, description, price_cents, sort });
  return stmts.catalogById.get(info.lastInsertRowid);
}

// Reorder one item up/down among its artist's catalog by swapping sort values.
function moveCatalogItem(artist_id, itemId, direction) {
  const items = stmts.catalogByArtist.all(artist_id);
  const idx = items.findIndex((it) => it.id === itemId);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return;
  const a = items[idx];
  const b = items[swapIdx];
  const tx = db.transaction(() => {
    stmts.updateCatalogSort.run(a.sort, b.id);
    stmts.updateCatalogSort.run(b.sort, a.id);
  });
  tx();
}

function joinWaitlist({ event_id, name, phone = null, party_size = 1 }) {
  const entry_token = newToken();
  const info = stmts.insertEntry.run({
    event_id,
    entry_token,
    name,
    phone: phone || null,
    party_size: Math.max(1, Math.min(20, Number(party_size) || 1)),
  });
  return stmts.entryById.get(info.lastInsertRowid);
}

function entriesForEvent(eventId) {
  return stmts.entriesByEvent.all(eventId);
}

// Persist a transition result (fresh queue) computed by waitlist.js: only rows
// whose status/timestamps changed are written back.
function persistEntry(next) {
  stmts.setEntryStatus.run({
    id: next.id,
    status: next.status,
    notified_at: next.notified_at,
    served_at: next.served_at,
  });
}

// Notify the next waiting guest for an event. Uses the PURE waitlist transition
// to decide who's next and how the row changes, then persists + logs an outbox
// row (the stubbed "you're up" text). Returns the notified entry or null.
function notifyNext(eventId) {
  const entries = entriesForEvent(eventId);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const { entries: nextEntries, notified } = waitlist.notifyNext(entries, now);
  if (!notified) return null;
  const persisted = nextEntries.find((e) => e.id === notified.id);
  const tx = db.transaction(() => {
    persistEntry(persisted);
    stmts.insertOutbox.run({
      entry_id: persisted.id,
      kind: 'sms',
      body: `Hi ${persisted.name}! You're up next at the pop-up — come to the table when you're ready. ✨`,
    });
  });
  tx();
  return stmts.entryById.get(persisted.id);
}

function markServed(eventId, entryId) {
  const entries = entriesForEvent(eventId);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const { entry } = waitlist.markServed(entries, entryId, now);
  if (!entry) return null;
  persistEntry(entry);
  return stmts.entryById.get(entryId);
}

function markNoShow(eventId, entryId) {
  const entries = entriesForEvent(eventId);
  const { entry } = waitlist.markNoShow(entries, entryId);
  if (!entry) return null;
  persistEntry(entry);
  return stmts.entryById.get(entryId);
}

function cancelEntry(eventId, entryId) {
  const entries = entriesForEvent(eventId);
  const { entry } = waitlist.cancel(entries, entryId);
  if (!entry) return null;
  persistEntry(entry);
  return stmts.entryById.get(entryId);
}

module.exports = {
  db,
  DATA_DIR,
  newToken,
  slugifyHandle,
  uniqueHandle,
  stmts,
  createArtist,
  createDemoArtist,
  createEvent,
  addCatalogItem,
  moveCatalogItem,
  joinWaitlist,
  entriesForEvent,
  notifyNext,
  markServed,
  markNoShow,
  cancelEntry,
};
