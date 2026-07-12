# HANDOFF

Compact snapshot for the next session. **Overwrite this file entirely at the
end of every session — do not append history.**

## Current stage
`WINNER_DEVELOPMENT` (run 2, after founder pivot D-5). Poppin (R2-1) is
chosen and prototyped; its core artifact + waitlist are verified (E-4).

## Current product
**Poppin** — a public pop-up page + live walk-in waitlist for pop-up service
artists (lead persona: permanent-jewelry welders; adjacent: lash / brow /
piercing / tattoo-flash). Distribution bet: the artist makes a page they're
proud to share → the host venue and walk-ins see it → a "Made with Poppin"
footer converts peer artists (recipient = ICP peer loop).

## Why this product (pivot context)
Founder rejected the Run-1 finalists (ChaseList/InkLine) as uninteresting and
off-target, and set a sharp new goal: interesting, grows HANDS-OFF, standalone
web app, commerce/small-biz, ~$1–2k/mo in ~3 months (D-5). Run-2 research
favored *peer loops where the recipient is the ICP*; Poppin (D-6) is the pick.

## Target user
Pop-up service artists — permanent jewelry (lead), lash/brow/piercing/
tattoo-flash (adjacent).

## Active hypothesis
Artists will actually create and share these pages, igniting a peer loop.
**ASSUMPTION — not tested.** E-4 only verified the *precondition* (a
proud-to-share page + a working live waitlist are buildable and polished).
Whether artists share it, and whether they pay, are external questions.

## What changed this session
Formal pivot (D-5) → Run-2 hands-off-commerce research (USER_RESEARCH.md) →
filtered shortlist R2-1..R2-4 (CONCEPTS.md) → picked R2-1 (D-6) → built &
independently verified the Poppin prototype (E-4) with mobile screenshots.

## Current implementation status
`prototypes/poppin/` — GREEN: 30 unit + 10 Playwright e2e. Full flow: create
page → catalog + event → polished public event page (QR, join form, footer)
→ 2-tap walk-in join → live "you're #N" confirmation → owner waitlist board
(notify/served/no-show, party-size math, outbox log — nothing actually sent).
Zero API keys. Screenshots in `prototypes/poppin/docs/screenshots/`.
Honest gaps: no photo/logo upload (biggest realism gap); owner-board rows
refresh on action not live-poll; naive wait estimate; token-only auth
(prototype).

## Last known good commit
Latest commit on `main` (Poppin prototype + E-4).

## Known blockers
The decisive questions — do artists share it, will they pay — need REAL
users. Any outreach requires founder approval (protocol hard limit). No
blocker on further build/design work.

## Next three actions
1. Get founder reaction to the Poppin screenshots (proud-to-share bar).
2. If positive: add artist photo/logo + item photos upload (the #1 realism
   gap for this aesthetic-driven niche) and a lightweight onboarding.
3. Prepare (do NOT execute without founder approval) an external-validation
   plan: put Poppin in front of ~5 real pop-up artists; success = at least
   some create AND share a page (the real loop test), plus a WTP probe on
   removing the footer / SMS notifications.

## Exact build, run and test commands
`cd prototypes/poppin && npm install && npm run dev` (PORT env, default 3000);
`npm test` (30 unit + 10 e2e). Playwright uses the preinstalled Chromium via
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` in the npm scripts — never run
`playwright install`; keep `@playwright/test` pinned (chromium-1194).
(Run-1 prototypes `chaselist/` and `inkline/` remain, archived.)
