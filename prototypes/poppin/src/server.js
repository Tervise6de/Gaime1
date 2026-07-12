'use strict';

const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

const store = require('./db');
const waitlist = require('./waitlist');
const { formatPrice, parsePriceToCents, formatWait } = require('./format');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Helpers exposed to every template.
app.locals.formatPrice = formatPrice;
app.locals.formatWait = formatWait;
app.locals.initialOf = (name) => (String(name || '?').trim()[0] || '?').toUpperCase();
// Human date/time for an event. Accepts 'YYYY-MM-DDTHH:MM' (datetime-local) or
// free text; falls back gracefully. Returns '' when nothing is set.
app.locals.whenText = (startsAt, endsAt) => {
  if (!startsAt) return '';
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return String(startsAt); // free-typed value
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  let out = `${day} · ${time}`;
  if (endsAt) {
    const e = new Date(endsAt);
    if (!Number.isNaN(e.getTime())) out += `–${e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return out;
};

const PORT = process.env.PORT || 3000;

// Absolute URL for the current request (QR codes + share links need it).
function baseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

async function qrDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 320,
      color: { dark: '#2b2622', light: '#ffffff' },
    });
  } catch {
    return null;
  }
}

function notFound(res, message) {
  res.status(404).render('notfound', {
    title: 'Not found',
    message: message || "We couldn't find that page.",
  });
}

// Trim + cap a free-text field.
function clean(v, max = 500) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

// Build the view-model for one event's live queue (owner board + counts).
function queueView(event) {
  const entries = store.entriesForEvent(event.id);
  const waitingRows = waitlist.waitingQueue(entries).map((e) => ({
    ...e,
    position: waitlist.position(entries, e.id),
    ahead: waitlist.peopleAhead(entries, e.id),
    waitMin: waitlist.estimateWaitMinutes(waitlist.peopleAhead(entries, e.id)),
  }));
  const notified = entries
    .filter((e) => e.status === waitlist.STATUS.NOTIFIED)
    .sort((a, b) => (a.notified_at < b.notified_at ? 1 : -1));
  const recent = entries
    .filter((e) => e.status === waitlist.STATUS.SERVED || e.status === waitlist.STATUS.NO_SHOW)
    .sort((a, b) => b.id - a.id)
    .slice(0, 8);
  return {
    entries,
    waitingRows,
    notified,
    recent,
    peopleWaiting: waitlist.peopleWaiting(entries),
    groupsWaiting: waitingRows.length,
    headWaitMin: waitlist.estimateWaitMinutes(waitlist.peopleWaiting(entries)),
  };
}

// ---------------------------------------------------------------------------
// Home / marketing + fast path to value
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.render('home', { title: 'Poppin — your pop-up, live' });
});

// Spin up a demo artist and drop the founder straight into their dashboard.
app.post('/create', (req, res) => {
  const { artist } = store.createDemoArtist();
  res.redirect(`/dashboard/${artist.owner_token}`);
});

// ---------------------------------------------------------------------------
// Owner dashboard (token = auth for the prototype)
// ---------------------------------------------------------------------------
function requireOwner(req, res) {
  const artist = store.stmts.artistByOwnerToken.get(req.params.owner_token);
  if (!artist) {
    notFound(res, 'That dashboard link is invalid. Ask the artist for a fresh one.');
    return null;
  }
  return artist;
}

app.get('/dashboard/:owner_token', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  const events = store.stmts.eventsByArtist.all(artist.id);
  const catalog = store.stmts.catalogByArtist.all(artist.id);
  const counts = {};
  for (const ev of events) {
    counts[ev.id] = waitlist.peopleWaiting(store.entriesForEvent(ev.id));
  }
  res.render('dashboard', {
    title: `${artist.name} — dashboard`,
    artist,
    events,
    catalog,
    counts,
    saved: req.query.saved || null,
  });
});

app.post('/dashboard/:owner_token/profile', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  let handle = store.slugifyHandle(req.body.handle || artist.handle);
  // Keep the current handle if unchanged; otherwise ensure uniqueness.
  if (handle !== artist.handle) handle = store.uniqueHandle(handle);
  store.stmts.updateArtist.run({
    id: artist.id,
    name: clean(req.body.name, 80) || artist.name,
    handle,
    bio: clean(req.body.bio, 400),
    instagram: clean(req.body.instagram, 60).replace(/^@/, ''),
  });
  res.redirect(`/dashboard/${artist.owner_token}?saved=profile`);
});

app.post('/dashboard/:owner_token/catalog', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  const name = clean(req.body.name, 80);
  if (name) {
    store.addCatalogItem({
      artist_id: artist.id,
      name,
      description: clean(req.body.description, 200),
      price_cents: parsePriceToCents(req.body.price),
    });
  }
  res.redirect(`/dashboard/${artist.owner_token}?saved=catalog#catalog`);
});

app.post('/dashboard/:owner_token/catalog/:itemId/edit', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  const item = store.stmts.catalogById.get(Number(req.params.itemId));
  if (item && item.artist_id === artist.id) {
    store.stmts.updateCatalog.run({
      id: item.id,
      name: clean(req.body.name, 80) || item.name,
      description: clean(req.body.description, 200),
      price_cents: parsePriceToCents(req.body.price),
    });
  }
  res.redirect(`/dashboard/${artist.owner_token}?saved=catalog#catalog`);
});

app.post('/dashboard/:owner_token/catalog/:itemId/move', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  store.moveCatalogItem(artist.id, Number(req.params.itemId), req.body.direction === 'up' ? 'up' : 'down');
  res.redirect(`/dashboard/${artist.owner_token}#catalog`);
});

app.post('/dashboard/:owner_token/catalog/:itemId/delete', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  store.stmts.deleteCatalog.run(Number(req.params.itemId), artist.id);
  res.redirect(`/dashboard/${artist.owner_token}#catalog`);
});

app.post('/dashboard/:owner_token/event', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  const title = clean(req.body.title, 80) || 'Pop-Up';
  store.createEvent({
    artist_id: artist.id,
    title,
    venue_name: clean(req.body.venue_name, 80),
    address: clean(req.body.address, 120),
    starts_at: clean(req.body.starts_at, 40) || null,
    ends_at: clean(req.body.ends_at, 40) || null,
    status: 'upcoming',
  });
  res.redirect(`/dashboard/${artist.owner_token}?saved=event#events`);
});

// Live waitlist board for one event.
app.get('/dashboard/:owner_token/event/:eventId', async (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  const event = store.stmts.eventById.get(Number(req.params.eventId));
  if (!event || event.artist_id !== artist.id) return notFound(res, 'Event not found.');
  const publicEventUrl = `${baseUrl(req)}/e/${event.public_token}`;
  const qr = await qrDataUrl(publicEventUrl);
  res.render('event-board', {
    title: `${event.title} — live board`,
    artist,
    event,
    q: queueView(event),
    publicEventUrl,
    qr,
    outbox: store.stmts.outboxByEvent.all(event.id),
  });
});

// JSON snapshot for the board's 5s poll (no full re-render).
app.get('/dashboard/:owner_token/event/:eventId/state', (req, res) => {
  const artist = store.stmts.artistByOwnerToken.get(req.params.owner_token);
  if (!artist) return res.status(404).json({ error: 'not_found' });
  const event = store.stmts.eventById.get(Number(req.params.eventId));
  if (!event || event.artist_id !== artist.id) return res.status(404).json({ error: 'not_found' });
  const q = queueView(event);
  res.json({
    status: event.status,
    peopleWaiting: q.peopleWaiting,
    groupsWaiting: q.groupsWaiting,
    headWaitMin: q.headWaitMin,
    waiting: q.waitingRows.map((e) => ({
      id: e.id, name: e.name, party_size: e.party_size,
      position: e.position, ahead: e.ahead, waitMin: e.waitMin,
    })),
    notified: q.notified.map((e) => ({ id: e.id, name: e.name, party_size: e.party_size })),
  });
});

// Event status + queue actions (owner).
app.post('/dashboard/:owner_token/event/:eventId/status', (req, res) => {
  const artist = requireOwner(req, res);
  if (!artist) return;
  const event = store.stmts.eventById.get(Number(req.params.eventId));
  if (!event || event.artist_id !== artist.id) return notFound(res, 'Event not found.');
  const status = ['upcoming', 'live', 'ended'].includes(req.body.status) ? req.body.status : event.status;
  store.stmts.updateEventStatus.run(status, event.id);
  res.redirect(`/dashboard/${artist.owner_token}/event/${event.id}`);
});

function ownerEventAction(handler) {
  return (req, res) => {
    const artist = requireOwner(req, res);
    if (!artist) return;
    const event = store.stmts.eventById.get(Number(req.params.eventId));
    if (!event || event.artist_id !== artist.id) return notFound(res, 'Event not found.');
    handler(event, req);
    res.redirect(`/dashboard/${artist.owner_token}/event/${event.id}`);
  };
}

app.post('/dashboard/:owner_token/event/:eventId/notify', ownerEventAction((event) => {
  store.notifyNext(event.id);
}));
app.post('/dashboard/:owner_token/event/:eventId/entry/:entryId/served', ownerEventAction((event, req) => {
  store.markServed(event.id, Number(req.params.entryId));
}));
app.post('/dashboard/:owner_token/event/:eventId/entry/:entryId/noshow', ownerEventAction((event, req) => {
  store.markNoShow(event.id, Number(req.params.entryId));
}));
app.post('/dashboard/:owner_token/event/:eventId/entry/:entryId/remove', ownerEventAction((event, req) => {
  store.cancelEntry(event.id, Number(req.params.entryId));
}));

// ---------------------------------------------------------------------------
// Public artist page  /@handle
// ---------------------------------------------------------------------------
app.get('/@:handle', (req, res) => {
  const artist = store.stmts.artistByHandle.get(req.params.handle);
  if (!artist) return notFound(res, `No artist found at @${req.params.handle}.`);
  const events = store.stmts.eventsByArtist.all(artist.id)
    .filter((e) => e.status !== 'ended');
  const catalog = store.stmts.catalogByArtist.all(artist.id);
  res.render('public-artist', {
    title: `${artist.name} (@${artist.handle}) — Poppin`,
    artist,
    events,
    catalog,
  });
});

// ---------------------------------------------------------------------------
// Public event page  /e/:public_token
// ---------------------------------------------------------------------------
app.get('/e/:public_token', async (req, res) => {
  const event = store.stmts.eventByToken.get(req.params.public_token);
  if (!event) return notFound(res, 'This pop-up link is invalid or has expired.');
  const artist = store.stmts.artistById.get(event.artist_id);
  const catalog = store.stmts.catalogByArtist.all(artist.id);
  const url = `${baseUrl(req)}/e/${event.public_token}`;
  const qr = await qrDataUrl(url);
  const q = queueView(event);
  res.render('public-event', {
    title: `${event.title} — ${artist.name}`,
    artist,
    event,
    catalog,
    qr,
    url,
    peopleWaiting: q.peopleWaiting,
    groupsWaiting: q.groupsWaiting,
    joined: req.query.joined || null,
  });
});

// Customer joins the walk-in list.
app.post('/e/:public_token/join', (req, res) => {
  const event = store.stmts.eventByToken.get(req.params.public_token);
  if (!event) return notFound(res, 'This pop-up link is invalid or has expired.');
  const name = clean(req.body.name, 60);
  if (!name) return res.redirect(`/e/${event.public_token}?joined=missing`);
  const entry = store.joinWaitlist({
    event_id: event.id,
    name,
    phone: clean(req.body.phone, 30) || null,
    party_size: Number(req.body.party_size) || 1,
  });
  res.redirect(`/e/${event.public_token}/spot/${entry.entry_token}`);
});

// ---------------------------------------------------------------------------
// Customer confirmation / live spot  /e/:public_token/spot/:entry_token
// ---------------------------------------------------------------------------
function spotState(event, entry) {
  const entries = store.entriesForEvent(event.id);
  const fresh = entries.find((e) => e.id === entry.id) || entry;
  const ahead = waitlist.peopleAhead(entries, entry.id);
  const pos = waitlist.position(entries, entry.id);
  return {
    status: fresh.status,
    position: pos,
    ahead: ahead == null ? null : ahead,
    waitMin: ahead == null ? null : waitlist.estimateWaitMinutes(ahead),
    groupsWaiting: waitlist.waitingQueue(entries).length,
  };
}

app.get('/e/:public_token/spot/:entry_token', (req, res) => {
  const event = store.stmts.eventByToken.get(req.params.public_token);
  if (!event) return notFound(res, 'This pop-up link is invalid or has expired.');
  const entry = store.stmts.entryByToken.get(req.params.entry_token);
  if (!entry || entry.event_id !== event.id) return notFound(res, "We couldn't find your spot.");
  const artist = store.stmts.artistById.get(event.artist_id);
  res.render('spot', {
    title: `Your spot — ${event.title}`,
    artist,
    event,
    entry,
    state: spotState(event, entry),
  });
});

// JSON for the customer's live poll.
app.get('/e/:public_token/spot/:entry_token/state', (req, res) => {
  const event = store.stmts.eventByToken.get(req.params.public_token);
  if (!event) return res.status(404).json({ error: 'not_found' });
  const entry = store.stmts.entryByToken.get(req.params.entry_token);
  if (!entry || entry.event_id !== event.id) return res.status(404).json({ error: 'not_found' });
  res.json({ eventStatus: event.status, ...spotState(event, entry) });
});

// Customer cancels their own spot.
app.post('/e/:public_token/spot/:entry_token/cancel', (req, res) => {
  const event = store.stmts.eventByToken.get(req.params.public_token);
  if (!event) return notFound(res, 'This pop-up link is invalid or has expired.');
  const entry = store.stmts.entryByToken.get(req.params.entry_token);
  if (!entry || entry.event_id !== event.id) return notFound(res, "We couldn't find your spot.");
  store.cancelEntry(event.id, entry.id);
  res.redirect(`/e/${event.public_token}/spot/${entry.entry_token}`);
});

// Friendly catch-all 404.
app.use((req, res) => notFound(res, "That page doesn't exist."));

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Poppin running on http://localhost:${PORT}`);
  });
}

module.exports = app;
