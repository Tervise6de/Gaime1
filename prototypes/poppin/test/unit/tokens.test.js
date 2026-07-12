'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

// Isolate the DB for this test file.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'poppin-tok-'));
process.env.POPPIN_DATA_DIR = TMP;
const store = require('../../src/db');

after(() => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {} });

test('newToken: base64url, unguessable length, unique', () => {
  const t = store.newToken();
  assert.match(t, /^[A-Za-z0-9_-]+$/); // base64url alphabet, no +/=
  assert.ok(t.length >= 20, 'token should be long (16 random bytes)');
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(store.newToken());
  assert.equal(seen.size, 2000, 'no collisions across 2000 tokens');
});

test('slugifyHandle: lowercases and strips non-alphanumerics', () => {
  assert.equal(store.slugifyHandle('Aria Gold ✨'), 'ariagold');
  assert.equal(store.slugifyHandle('  Lash.Bar_22 '), 'lashbar22');
  assert.equal(store.slugifyHandle(''), 'artist');
  assert.equal(store.slugifyHandle('!!!'), 'artist');
});

test('uniqueHandle: appends counter on collision', () => {
  const a = store.createArtist({ name: 'Handle Test' });
  assert.equal(a.handle, 'handletest');
  const b = store.createArtist({ name: 'Handle Test' });
  assert.equal(b.handle, 'handletest2');
  const c = store.createArtist({ name: 'Handle Test' });
  assert.equal(c.handle, 'handletest3');
});

test('createArtist: owner_token present, unique, pro defaults 0', () => {
  const a = store.createArtist({ name: 'Tokened One' });
  const b = store.createArtist({ name: 'Tokened Two' });
  assert.ok(a.owner_token && b.owner_token);
  assert.notEqual(a.owner_token, b.owner_token);
  assert.equal(a.pro, 0);
});

test('createDemoArtist: seeds catalog + a live event with public_token', () => {
  const { artist, event } = store.createDemoArtist();
  assert.ok(artist.handle.startsWith('ariagold'));
  assert.ok(event.public_token && event.public_token !== artist.owner_token);
  assert.equal(event.status, 'live');
  const catalog = store.stmts.catalogByArtist.all(artist.id);
  assert.ok(catalog.length >= 3);
});
