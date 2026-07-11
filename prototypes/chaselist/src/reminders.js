'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_AFTER_DAYS = 3;   // first reminder 3 days after send
const CADENCE_DAYS = 4;       // then every 4 days
const MAX_REMINDERS = 4;

/** True when every item is resolved (received or not_available). */
function allResolved(items) {
  return items.length > 0 && items.every((i) => i.status !== 'pending');
}

/**
 * PURE. Compute the reminder schedule for a request.
 *
 * Cadence: created_at + 3d, then every 4d, max 4 reminders.
 * Stops entirely when all items are resolved (returns []) and never
 * schedules a reminder at or after expiry.
 *
 * @param {{created_at:string|Date, expires_at:string|Date}} request
 * @param {{status:string}[]} items
 * @param {Date} [now] reference time (used to flag which entries are due)
 * @returns {{n:number, kind:string, at:Date, due:boolean}[]}
 */
function computeSchedule(request, items, now = new Date()) {
  if (allResolved(items)) return [];
  if (items.length === 0) return []; // nothing to chase

  const created = new Date(request.created_at);
  const expires = new Date(request.expires_at);
  const out = [];
  for (let n = 1; n <= MAX_REMINDERS; n++) {
    const at = new Date(
      created.getTime() + (FIRST_AFTER_DAYS + (n - 1) * CADENCE_DAYS) * DAY_MS
    );
    if (at.getTime() >= expires.getTime()) break; // expired before this one
    out.push({ n, kind: `reminder-${n}`, at, due: at.getTime() <= now.getTime() });
  }
  return out;
}

/**
 * PURE. Render the reminder message body that would be emailed.
 * Never sent anywhere - materialized into the outbox log only.
 */
function renderReminderBody(request, items, client, n) {
  const pending = items.filter((i) => i.status === 'pending');
  const done = items.length - pending.length;
  const lines = [
    `Hi ${client && client.name ? client.name : 'there'},`,
    '',
    `Reminder ${n}: we're still waiting on ${pending.length} of ${items.length} ` +
      `item(s) for "${request.title}" (${done} already done - thank you!).`,
    '',
    'Still needed:',
    ...pending.map((i) => `  - ${i.label}`),
    '',
    'Upload here (no account needed):',
    `  {APP_URL}/r/${request.token}`,
    '',
    `This link expires on ${new Date(request.expires_at).toISOString().slice(0, 10)}.`,
  ];
  return lines.join('\n');
}

/**
 * Materialize all due, not-yet-logged reminders into the outbox table.
 * This is the only side-effectful function here; it never sends anything.
 * Returns the number of outbox rows created.
 */
function runTick(db, now = new Date()) {
  const requests = db
    .prepare("SELECT * FROM requests WHERE status != 'complete'")
    .all();
  const itemsStmt = db.prepare('SELECT * FROM request_items WHERE request_id = ?');
  const clientStmt = db.prepare('SELECT * FROM clients WHERE id = ?');
  const existsStmt = db.prepare(
    'SELECT 1 FROM outbox WHERE request_id = ? AND kind = ?'
  );
  const insertStmt = db.prepare(
    `INSERT INTO outbox (request_id, kind, scheduled_for, body, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  let created = 0;
  for (const request of requests) {
    const items = itemsStmt.all(request.id);
    const client = clientStmt.get(request.client_id);
    for (const entry of computeSchedule(request, items, now)) {
      if (!entry.due) continue;
      if (existsStmt.get(request.id, entry.kind)) continue;
      insertStmt.run(
        request.id,
        entry.kind,
        entry.at.toISOString(),
        renderReminderBody(request, items, client, entry.n),
        now.toISOString()
      );
      created++;
    }
  }
  return created;
}

module.exports = {
  computeSchedule,
  renderReminderBody,
  allResolved,
  runTick,
  DAY_MS,
  FIRST_AFTER_DAYS,
  CADENCE_DAYS,
  MAX_REMINDERS,
};
