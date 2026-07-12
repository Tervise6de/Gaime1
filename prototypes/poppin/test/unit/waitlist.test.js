'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const w = require('../../src/waitlist');

// Build an entry with sane defaults; joined_at ordered by the `t` seconds.
function entry(id, opts = {}) {
  const t = opts.t != null ? opts.t : id;
  const ss = String(t).padStart(2, '0');
  return {
    id,
    event_id: 1,
    name: opts.name || `P${id}`,
    phone: opts.phone || null,
    party_size: opts.party_size || 1,
    status: opts.status || w.STATUS.WAITING,
    joined_at: `2026-07-12 10:00:${ss}`,
    notified_at: null,
    served_at: null,
  };
}

test('position: 1-based rank among waiting, ordered by joined_at', () => {
  const e = [entry(1), entry(2), entry(3)];
  assert.equal(w.position(e, 1), 1);
  assert.equal(w.position(e, 2), 2);
  assert.equal(w.position(e, 3), 3);
});

test('position: unknown id and non-waiting return null', () => {
  const e = [entry(1), entry(2, { status: w.STATUS.SERVED })];
  assert.equal(w.position(e, 99), null);
  assert.equal(w.position(e, 2), null);
});

test('position: served/cancelled/notified excluded, ranks compress', () => {
  const e = [
    entry(1, { status: w.STATUS.SERVED }),
    entry(2, { status: w.STATUS.NOTIFIED }),
    entry(3),
    entry(4),
  ];
  assert.equal(w.position(e, 3), 1);
  assert.equal(w.position(e, 4), 2);
});

test('peopleAhead: 0 at the front', () => {
  const e = [entry(1), entry(2)];
  assert.equal(w.peopleAhead(e, 1), 0);
});

test('peopleAhead: party sizes count fully (party of 3 = 3 ahead)', () => {
  const e = [entry(1, { party_size: 3 }), entry(2, { party_size: 2 }), entry(3)];
  assert.equal(w.peopleAhead(e, 2), 3); // only the party of 3 is ahead
  assert.equal(w.peopleAhead(e, 3), 5); // 3 + 2 ahead
});

test('peopleAhead: only waiting count as ahead (notified excluded)', () => {
  const e = [
    entry(1, { party_size: 4, status: w.STATUS.NOTIFIED }),
    entry(2, { party_size: 2 }),
    entry(3, { party_size: 1 }),
  ];
  assert.equal(w.peopleAhead(e, 2), 0); // notified party of 4 does not count
  assert.equal(w.peopleAhead(e, 3), 2);
});

test('peopleWaiting: sums party sizes of waiting only', () => {
  const e = [
    entry(1, { party_size: 2 }),
    entry(2, { party_size: 3, status: w.STATUS.SERVED }),
    entry(3, { party_size: 1 }),
  ];
  assert.equal(w.peopleWaiting(e), 3);
});

test('estimateWaitMinutes: peopleAhead * avg, front is 0, never negative', () => {
  assert.equal(w.estimateWaitMinutes(0), 0);
  assert.equal(w.estimateWaitMinutes(3), 24); // default 8 min
  assert.equal(w.estimateWaitMinutes(2, 10), 20);
  assert.equal(w.estimateWaitMinutes(-5), 0);
});

test('join: appends a waiting entry, does not mutate input', () => {
  const e0 = [entry(1)];
  const { entries, entry: added } = w.join(e0, {
    id: 2, event_id: 1, name: 'Bea', party_size: 2, joined_at: '2026-07-12 10:05:00',
  });
  assert.equal(e0.length, 1); // original untouched
  assert.equal(entries.length, 2);
  assert.equal(added.status, w.STATUS.WAITING);
  assert.equal(added.party_size, 2);
  assert.equal(w.position(entries, 2), 2);
});

test('join: party_size floors at 1', () => {
  const { entry: added } = w.join([], { id: 1, event_id: 1, name: 'X', party_size: 0, joined_at: 't' });
  assert.equal(added.party_size, 1);
});

test('notifyNext: oldest waiting becomes notified with timestamp', () => {
  const e = [entry(1), entry(2)];
  const { entries, notified } = w.notifyNext(e, '2026-07-12 10:10:00');
  assert.equal(notified.id, 1);
  assert.equal(notified.status, w.STATUS.NOTIFIED);
  assert.equal(notified.notified_at, '2026-07-12 10:10:00');
  // #2 is now at the front
  assert.equal(w.position(entries, 2), 1);
  // input not mutated
  assert.equal(e[0].status, w.STATUS.WAITING);
});

test('notifyNext: empty queue returns null, queue unchanged', () => {
  const { entries, notified } = w.notifyNext([], 'now');
  assert.equal(notified, null);
  assert.deepEqual(entries, []);
});

test('notifyNext: skips already-notified, picks next waiting', () => {
  const e = [entry(1, { status: w.STATUS.NOTIFIED }), entry(2), entry(3)];
  const { notified } = w.notifyNext(e, 'now');
  assert.equal(notified.id, 2);
});

test('markServed: sets served status + timestamp', () => {
  const e = [entry(1), entry(2)];
  const { entries, entry: served } = w.markServed(e, 1, '2026-07-12 10:15:00');
  assert.equal(served.status, w.STATUS.SERVED);
  assert.equal(served.served_at, '2026-07-12 10:15:00');
  // reorders: #2 moves up
  assert.equal(w.position(entries, 2), 1);
});

test('markNoShow + cancel set their statuses', () => {
  const e = [entry(1), entry(2)];
  assert.equal(w.markNoShow(e, 1).entry.status, w.STATUS.NO_SHOW);
  assert.equal(w.cancel(e, 2).entry.status, w.STATUS.CANCELLED);
});

test('cancel middle entry: ranks recompute', () => {
  const e = [entry(1), entry(2), entry(3)];
  const { entries } = w.cancel(e, 2);
  assert.equal(w.position(entries, 1), 1);
  assert.equal(w.position(entries, 3), 2); // was 3, now 2
  assert.equal(w.position(entries, 2), null);
});

test('serve reorders: front served, next takes #1 with 0 ahead', () => {
  const e = [entry(1, { party_size: 2 }), entry(2, { party_size: 1 }), entry(3)];
  const { entries } = w.markServed(e, 1, 'now');
  assert.equal(w.position(entries, 2), 1);
  assert.equal(w.peopleAhead(entries, 2), 0);
  assert.equal(w.peopleAhead(entries, 3), 1);
});

test('pickNextWaiting: returns oldest waiting or null', () => {
  assert.equal(w.pickNextWaiting([]), null);
  const e = [entry(2, { t: 2 }), entry(1, { t: 1 })];
  assert.equal(w.pickNextWaiting(e).id, 1);
});

test('deterministic tie-break by id when joined_at equal', () => {
  const a = entry(5, { t: 1 });
  const b = entry(2, { t: 1 });
  const q = w.waitingQueue([a, b]);
  assert.equal(q[0].id, 2);
  assert.equal(q[1].id, 5);
});
