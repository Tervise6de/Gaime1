'use strict';

// ---------------------------------------------------------------------------
// Poppin walk-in waitlist — PURE logic, no I/O.
//
// An "entry" is a plain object shaped like a waitlist_entry row:
//   { id, event_id, name, phone, party_size, status, joined_at, notified_at,
//     served_at }
//
// `status` is one of: waiting | notified | served | no_show | cancelled.
//
// These functions never mutate their inputs. Transition helpers return a
// brand-new array (a "fresh queue") so callers can persist the delta. The
// server loads the event's entries, applies one of these, and writes back —
// so this file is the single source of truth for queue rules and is what the
// node:test suite exercises directly.
// ---------------------------------------------------------------------------

const STATUS = Object.freeze({
  WAITING: 'waiting',
  NOTIFIED: 'notified',
  SERVED: 'served',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled',
});

const DEFAULT_AVG_SERVICE_MINUTES = 8;

// joined_at is an ISO-ish string ('YYYY-MM-DD HH:MM:SS'); ties break by id so
// ordering is always deterministic even within the same clock second.
function byJoinOrder(a, b) {
  if (a.joined_at < b.joined_at) return -1;
  if (a.joined_at > b.joined_at) return 1;
  return a.id - b.id;
}

// All still-in-line entries, oldest first. Only status='waiting' counts as
// "in line"; notified/served/no_show/cancelled have left the waiting queue.
function waitingQueue(entries) {
  return entries.filter((e) => e.status === STATUS.WAITING).sort(byJoinOrder);
}

// 1-based rank of a group among waiting entries, ordered by joined_at.
// Returns null if the entry is unknown or no longer waiting.
// This is the "you are the Nth group in line" number.
function position(entries, entryId) {
  const q = waitingQueue(entries);
  const idx = q.findIndex((e) => e.id === entryId);
  return idx === -1 ? null : idx + 1;
}

// Number of PEOPLE (not groups) ahead of this entry: the sum of party_size of
// every waiting entry that joined earlier. Party size counts fully — a party
// of 3 ahead of you is 3 people ahead. Only status='waiting' entries count;
// notified/served/no_show/cancelled are excluded from the "ahead of you" tally
// (a notified guest is being handed off and no longer occupies a queue slot).
// Returns 0 for the front of the line, null if the entry is not waiting.
function peopleAhead(entries, entryId) {
  const q = waitingQueue(entries);
  const idx = q.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  let ahead = 0;
  for (let i = 0; i < idx; i++) ahead += q[i].party_size || 1;
  return ahead;
}

// Total people currently waiting across all groups (for the owner's headline).
function peopleWaiting(entries) {
  return waitingQueue(entries).reduce((sum, e) => sum + (e.party_size || 1), 0);
}

// Estimated wait in whole minutes until this many people ahead are served.
// Model (deliberately simple + transparent): one artist, strictly serial,
// avgServiceMinutes per person. wait = peopleAhead * avgServiceMinutes.
// Front of line (0 ahead) => 0 min ("you're up next"). Never negative.
function estimateWaitMinutes(peopleAheadCount, avgServiceMinutes = DEFAULT_AVG_SERVICE_MINUTES) {
  const ahead = Math.max(0, Number(peopleAheadCount) || 0);
  return ahead * avgServiceMinutes;
}

// The next entry that would be notified: oldest waiting group, or null.
// Shared by the transition below and by the server so "who's next" is defined
// in exactly one place.
function pickNextWaiting(entries) {
  return waitingQueue(entries)[0] || null;
}

// ---- Transitions: each returns a fresh queue; none mutate inputs. ----------

// Append a new waiting entry. Caller supplies id/joined_at so the result is
// deterministic and testable.
function join(entries, { id, event_id, name, phone = null, party_size = 1, joined_at }) {
  const entry = {
    id,
    event_id,
    name,
    phone,
    party_size: Math.max(1, Number(party_size) || 1),
    status: STATUS.WAITING,
    joined_at,
    notified_at: null,
    served_at: null,
  };
  return { entries: [...entries, entry], entry };
}

// Move the oldest waiting group to 'notified' (the "you're up, come to the
// table" hand-off). Returns { entries, notified }. notified is null (and the
// queue is unchanged) when nobody is waiting.
function notifyNext(entries, now) {
  const next = pickNextWaiting(entries);
  if (!next) return { entries: [...entries], notified: null };
  const updated = entries.map((e) =>
    e.id === next.id ? { ...e, status: STATUS.NOTIFIED, notified_at: now } : e
  );
  const notified = updated.find((e) => e.id === next.id);
  return { entries: updated, notified };
}

// Generic status setter used by the served/no-show/cancel transitions.
function setStatus(entries, entryId, status, stamp = {}) {
  let entry = null;
  const updated = entries.map((e) => {
    if (e.id !== entryId) return e;
    entry = { ...e, status, ...stamp };
    return entry;
  });
  return { entries: updated, entry };
}

function markServed(entries, entryId, now) {
  return setStatus(entries, entryId, STATUS.SERVED, { served_at: now });
}

function markNoShow(entries, entryId) {
  return setStatus(entries, entryId, STATUS.NO_SHOW);
}

function cancel(entries, entryId) {
  return setStatus(entries, entryId, STATUS.CANCELLED);
}

module.exports = {
  STATUS,
  DEFAULT_AVG_SERVICE_MINUTES,
  byJoinOrder,
  waitingQueue,
  position,
  peopleAhead,
  peopleWaiting,
  estimateWaitMinutes,
  pickNextWaiting,
  join,
  notifyNext,
  markServed,
  markNoShow,
  cancel,
};
