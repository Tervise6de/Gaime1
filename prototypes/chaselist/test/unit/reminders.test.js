'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeSchedule,
  renderReminderBody,
  allResolved,
  runTick,
  DAY_MS,
  MAX_REMINDERS,
} = require('../../src/reminders');

const T0 = new Date('2026-07-01T12:00:00Z');
const iso = (d) => new Date(d).toISOString();
const days = (n) => new Date(T0.getTime() + n * DAY_MS);

function makeRequest(overrides = {}) {
  return {
    id: 1,
    title: 'March close',
    token: 'tok123',
    created_at: iso(T0),
    expires_at: iso(days(30)),
    status: 'open',
    ...overrides,
  };
}
const pendingItems = (n) =>
  Array.from({ length: n }, (_, i) => ({ label: `Item ${i + 1}`, status: 'pending' }));

test('full cadence: 3 days after send, then every 4 days, max 4', () => {
  const sched = computeSchedule(makeRequest(), pendingItems(3), days(1));
  assert.equal(sched.length, MAX_REMINDERS);
  assert.deepEqual(
    sched.map((s) => s.at.toISOString()),
    [days(3), days(7), days(11), days(15)].map(iso)
  );
  assert.deepEqual(sched.map((s) => s.kind), [
    'reminder-1',
    'reminder-2',
    'reminder-3',
    'reminder-4',
  ]);
});

test('due flag reflects "now"', () => {
  const sched = computeSchedule(makeRequest(), pendingItems(2), days(8));
  assert.deepEqual(sched.map((s) => s.due), [true, true, false, false]);
});

test('all items resolved -> empty schedule', () => {
  const items = [
    { label: 'a', status: 'received' },
    { label: 'b', status: 'not_available' },
  ];
  assert.deepEqual(computeSchedule(makeRequest(), items, days(1)), []);
});

test('partially resolved -> still scheduled', () => {
  const items = [
    { label: 'a', status: 'received' },
    { label: 'b', status: 'pending' },
  ];
  assert.equal(computeSchedule(makeRequest(), items, days(1)).length, 4);
});

test('no items -> nothing to chase', () => {
  assert.deepEqual(computeSchedule(makeRequest(), [], days(1)), []);
});

test('expiry truncates the schedule', () => {
  // expires day 10: reminders at day 3 and 7 survive; day 11 and 15 dropped
  const req = makeRequest({ expires_at: iso(days(10)) });
  const sched = computeSchedule(req, pendingItems(1), days(1));
  assert.deepEqual(sched.map((s) => s.at.toISOString()), [days(3), days(7)].map(iso));
});

test('reminder exactly at expiry moment is dropped', () => {
  const req = makeRequest({ expires_at: iso(days(3)) });
  assert.deepEqual(computeSchedule(req, pendingItems(1), days(1)), []);
});

test('already-expired request -> empty schedule', () => {
  const req = makeRequest({ expires_at: iso(days(-1)) });
  assert.deepEqual(computeSchedule(req, pendingItems(2), days(1)), []);
});

test('never more than MAX_REMINDERS even for long expiry', () => {
  const req = makeRequest({ expires_at: iso(days(365)) });
  assert.equal(computeSchedule(req, pendingItems(1), days(300)).length, 4);
});

test('allResolved edge cases', () => {
  assert.equal(allResolved([]), false);
  assert.equal(allResolved([{ status: 'pending' }]), false);
  assert.equal(allResolved([{ status: 'received' }, { status: 'not_available' }]), true);
});

test('renderReminderBody lists only pending items and the link', () => {
  const req = makeRequest();
  const items = [
    { label: 'Bank statement', status: 'pending' },
    { label: 'Payroll report', status: 'received' },
  ];
  const body = renderReminderBody(req, items, { name: 'Dana' }, 2);
  assert.match(body, /Hi Dana/);
  assert.match(body, /Reminder 2/);
  assert.match(body, /1 of 2 item/);
  assert.match(body, /- Bank statement/);
  assert.doesNotMatch(body, /- Payroll report/);
  assert.match(body, /\/r\/tok123/);
});

test('runTick materializes due reminders once (idempotent)', () => {
  const { createDb } = require('../../src/db');
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chaselist-tick-'));
  const db = createDb(path.join(dir, 't.db'));
  const cid = db.prepare("INSERT INTO clients (name, email) VALUES ('Dana', '')").run()
    .lastInsertRowid;
  const rid = db
    .prepare(
      `INSERT INTO requests (client_id, title, note, token, expires_at, created_at, status)
       VALUES (?, 'Close', '', 'tok', ?, ?, 'open')`
    )
    .run(cid, iso(days(30)), iso(T0)).lastInsertRowid;
  db.prepare(
    "INSERT INTO request_items (request_id, label) VALUES (?, 'Bank statement')"
  ).run(rid);

  assert.equal(runTick(db, days(8)), 2); // reminders 1 and 2 due
  assert.equal(runTick(db, days(8)), 0); // idempotent
  assert.equal(runTick(db, days(12)), 1); // reminder 3 now due
  const rows = db.prepare('SELECT kind FROM outbox ORDER BY id').all();
  assert.deepEqual(rows.map((r) => r.kind), ['reminder-1', 'reminder-2', 'reminder-3']);

  // resolve everything -> no more reminders materialize
  db.prepare("UPDATE request_items SET status = 'received'").run();
  assert.equal(runTick(db, days(20)), 0);
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
