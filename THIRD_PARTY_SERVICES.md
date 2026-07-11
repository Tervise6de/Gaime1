# THIRD_PARTY_SERVICES

Every dependency, API and external service must be recorded here **when it is
added**. Rules (see protocol): no paid services without founder approval; no
unknown or unmaintained packages when a reliable alternative exists; no
copyrighted, scraped or proprietary data without a clear legal basis; no
secrets in the repository (use `.env.example`).

## Entry format

| Field | Description |
|---|---|
| Dependency / service | Name and version |
| Purpose | Why it is needed |
| Source | Registry / vendor URL |
| Licence / terms | Licence or ToS summary |
| Data sent | What user or product data it receives |
| Expected cost | Free / expected monthly cost |
| Free-tier limits | Relevant quotas |
| Lock-in risk | Low / medium / high + why |
| Replacement options | Realistic alternatives |

## Services and dependencies

Added 2026-07-11 (Stage 4 prototypes). All npm packages are established,
widely maintained, MIT-licensed (better-sqlite3: MIT; Playwright: Apache-2.0),
installed from the npm registry, versions pinned in each prototype's
package-lock.json. No user data leaves the machine in prototype mode.

| Dependency | Purpose | Cost | Notes |
|---|---|---|---|
| express | HTTP server (both prototypes) | free | official, ubiquitous |
| better-sqlite3 | embedded DB | free | no server, file in gitignored data/ |
| ejs | server templates | free | — |
| multer | multipart uploads | free | size/mime limits enforced in app |
| archiver (chaselist) | ZIP bundle download | free | — |
| @playwright/test (dev) | e2e tests | free | pinned to preinstalled chromium-1194 |
| @anthropic-ai/sdk (inkline) | vision transcription provider | **paid usage — DORMANT** | loads lazily only when `ANTHROPIC_API_KEY` present; **no key configured; founder approval + key required before any real API usage**; data sent: uploaded document images; use zero-retention terms before real user content |

Lock-in risk: low everywhere — the transcription module is
provider-agnostic (`src/transcribe/index.js`), so the AI vendor is
swappable. Replacement options: any vision-capable LLM API.
