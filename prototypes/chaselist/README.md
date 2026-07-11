# ChaseList (prototype)

Document request lists for bookkeepers and accountants. The sender builds a
checklist (manually or from a template) and shares a tokenized link; the
client fulfills it item-by-item from their phone — no account, no login,
first file uploaded in 2 taps. Statuses tick over live, reminders are
scheduled into an outbox log (never actually sent), and the sender downloads
everything as one ZIP.

## Run

```sh
npm install
npm run dev        # or: npm start
# open http://localhost:3000
```

Config: `PORT` (see `.env.example`, default 3000). SQLite DB lives in
`data/`, uploads in `uploads/` — both auto-created and gitignored.

## Test

```sh
npm run test:unit  # node:test — reminder schedule + security helpers
npm run test:e2e   # Playwright — full two-sided loop on a throwaway DB
npm test           # both
```

Playwright uses the preinstalled Chromium at `/opt/pw-browsers`
(`PLAYWRIGHT_BROWSERS_PATH` is set by the npm script — do not run
`playwright install`).

## Notes

- Recipient links: `crypto.randomBytes(16)` base64url tokens, 30-day default
  expiry.
- Upload limits: 10 MB/file; jpg/jpeg/png/webp/pdf/csv/xlsx only (extension
  + mime checked); 30 uploads per 10 min per token.
- Stored filenames are randomized; files are served only through the sender
  detail route, never from a guessable static path.
- Reminders: 3 days after send, then every 4 days, max 4, stop on
  all-resolved or expiry. Materialized into the `outbox` table on startup,
  every 10 minutes, and via `POST /tick`. Nothing external is ever sent.
