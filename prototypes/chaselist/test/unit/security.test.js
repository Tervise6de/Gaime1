'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  newToken,
  storedName,
  checkFile,
  RateLimiter,
} = require('../../src/security');

test('tokens are url-safe, long enough, and unique', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const t = newToken();
    assert.match(t, /^[A-Za-z0-9_-]{22}$/); // 16 bytes base64url
    assert.ok(!seen.has(t));
    seen.add(t);
  }
});

test('stored names are randomized and keep the extension', () => {
  const a = storedName('pdf');
  const b = storedName('pdf');
  assert.notEqual(a, b);
  assert.match(a, /^[0-9a-f]{32}\.pdf$/);
});

test('checkFile accepts the whitelist', () => {
  assert.equal(checkFile('scan.JPG', 'image/jpeg').ok, true);
  assert.equal(checkFile('receipt.png', 'image/png').ok, true);
  assert.equal(checkFile('doc.pdf', 'application/pdf').ok, true);
  assert.equal(checkFile('export.csv', 'text/csv').ok, true);
  assert.equal(
    checkFile(
      'book.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ).ok,
    true
  );
});

test('checkFile rejects bad extensions and mismatched mimes', () => {
  assert.deepEqual(checkFile('malware.exe', 'application/pdf'), {
    ok: false,
    reason: 'extension',
  });
  assert.deepEqual(checkFile('noext', 'application/pdf'), {
    ok: false,
    reason: 'extension',
  });
  assert.deepEqual(checkFile('notes.txt', 'text/plain'), {
    ok: false,
    reason: 'extension',
  });
  // extension ok but mime lies
  assert.deepEqual(checkFile('fake.pdf', 'application/x-msdownload'), {
    ok: false,
    reason: 'mime',
  });
  assert.deepEqual(checkFile('fake.png', 'application/pdf'), {
    ok: false,
    reason: 'mime',
  });
});

test('rate limiter allows up to max in window, then resets', () => {
  const rl = new RateLimiter(3, 10 * 60 * 1000);
  const t0 = 1_000_000;
  assert.equal(rl.allow('tok', t0), true);
  assert.equal(rl.allow('tok', t0 + 1), true);
  assert.equal(rl.allow('tok', t0 + 2), true);
  assert.equal(rl.allow('tok', t0 + 3), false); // 4th within window
  // other tokens unaffected
  assert.equal(rl.allow('other', t0 + 3), true);
  // window slides: after 10 minutes the early hits fall out
  assert.equal(rl.allow('tok', t0 + 10 * 60 * 1000 + 5), true);
});
