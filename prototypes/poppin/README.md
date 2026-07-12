# Poppin

A beautiful public **pop-up page** + a live **walk-in waitlist** for pop-up
service artists — built for permanent-jewelry welders first (set up at a
boutique/market, weld chain bracelets on walk-ins), and for adjacent pop-ups
(lash/brow, piercing, tattoo flash).

## The loop (distribution-by-artifact)

1. An artist makes a page they're **proud to share** — warm, boutique, mobile.
2. They drop the link/QR on their table and IG. Every walk-in and the host
   venue sees it.
3. Walk-ins scan → join the walk-in list → watch their place in line while they
   browse the menu.
4. Every public page carries a subtle **"Made with Poppin"** footer — the next
   pop-up artist who sees it becomes the next signup.

Two surfaces have to be excellent: the **public page** (proud-to-share) and the
**live waitlist** (works for the artist and for a customer at a crowded table).

## Run

```bash
npm install          # once
npm run dev          # http://localhost:3000 (PORT overridable)
npm start            # production-ish start
```

Open `/`, click **Create my pop-up page** — it spins up a demo artist (Aria
Gold, permanent jewelry) with a seeded menu + a live event and drops you into
the dashboard. From there: preview the public page, open the live board, and
join the walk-in list from a second (phone) window.

## Test

```bash
npm run test:unit    # node:test — waitlist logic, tokens/handles, price format
npm run test:e2e     # Playwright (iPhone 13 context) — full journey + 404s
npm test             # both
```

Playwright uses the preinstalled Chromium (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`
is set in the npm script). Never run `playwright install`.

## Routes

| Path | Who | What |
|---|---|---|
| `/` | anyone | marketing + "create your page" (bootstraps a demo artist) |
| `/dashboard/:owner_token` | artist | profile, menu, events (token = auth) |
| `/dashboard/:owner_token/event/:id` | artist | **live walk-in board** |
| `/@:handle` | public | artist page (events + menu + footer) |
| `/e/:public_token` | public | **event page** — join form, QR, footer |
| `/e/:public_token/spot/:entry_token` | customer | live "you're #X" confirmation |

## Data & privacy

better-sqlite3 (WAL) in `data/` (auto-created). Phone is **optional** and stored
minimally — only to power a "you're up" text, never shown publicly. **Nothing is
ever actually sent**: notifications are logged to an `outbox` table (a stub). No
external services, no API keys.

Tokens (`owner_token`, `public_token`, `entry_token`) are
`crypto.randomBytes(16).base64url` — unguessable; the token *is* the auth for
this prototype.

## Where it would pay (the paid boundary)

Free tier = everything above, with the Poppin footer. **Pro** would: remove the
footer, let the artist claim a custom handle, send **real SMS** "you're up"
texts (a provider, not the stub), and take **deposits/pre-pays** to cut
no-shows. Those are exactly the lines this prototype deliberately stops at.
