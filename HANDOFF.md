# HANDOFF

Compact snapshot for the next session. **Overwrite this file entirely at the
end of every session — do not append history.**

## Current stage
`DUAL_PROTOTYPES` — Stages 1–4 complete in run 1 (2026-07-11). Both finalist
prototypes are built, tested and pushed. Stage 5 (comparison) is next and is
partially blocked (see blockers).

## Current product
None selected yet. Finalists: **C-1 ChaseList** (bookkeeper document
collection, B2B) and **C-4 InkLine** (handwriting transcription + shareable
family artifacts, consumer). Full briefs, success/failure criteria and the
six-specialist evaluation are in `CONCEPTS.md`. Selection rationale in
`DECISION_LOG.md` D-2; stack decision D-3.

## Target user
A: solo bookkeepers / small accounting firms. B: family historians.

## Active hypothesis
- E-1 (ChaseList): frictionless recipient flow — technical half VERIFIED
  (2 taps, 22/22 tests); behavioral half untestable internally (R-3, R-8).
- E-2 (InkLine): real-scan transcription quality — UNKNOWN, blocked on API
  key; measurement harness is ready and pre-registered.

## What changed
Run 1 did: opportunity research (4 classified research passes →
`USER_RESEARCH.md`), 12-concept portfolio + 6 independent specialist
evaluations (`CONCEPTS.md`), finalist selection (D-2), risks R-3..R-8, and
built+verified both prototypes with screenshots in each
`prototypes/*/docs/screenshots/`.

## Current implementation status
- `prototypes/chaselist/` — GREEN: 17 unit + 5 e2e; full two-sided loop
  (template request → tokenized no-login mobile upload → status board →
  reminder outbox (logs only, never sends) → ZIP download); security basics
  in (expiring tokens, mime/size limits, rate limit). Known gaps: no sender
  auth, no magic-byte sniffing, camera capture untested on real devices.
- `prototypes/inkline/` — GREEN in stub mode: 15 unit + 3 e2e; upload →
  side-by-side artifact page with uncertainty highlighting → public share
  URL → collection; CER/WER/hallucination harness runs (STUB-labeled);
  Anthropic provider code exists but is UNEXERCISED against the live API.

## Last known good commit
The Stage 4 commit on `main` titled "Stage 4: build and verify both
prototypes" (latest on main at handoff time).

## Known blockers
1. InkLine real-model runs need `ANTHROPIC_API_KEY` in
   `prototypes/inkline/.env` (founder must supply — R-7).
2. Corpus manuscript-image hosts (wikimedia/loc.gov/archive.org) are 403'd
   by the network policy; `harness/fetch-corpus.sh` is ready, URLs may need
   verification when run with open internet.

## Next three actions
1. **Stage 5, ChaseList side:** differentiation audit vs Content Snare /
   Keeper (its pre-registered failure criterion in CONCEPTS.md) — research
   their actual recipient flows and pricing; record honestly whether C-1
   has an articulable edge.
2. **Stage 5, InkLine side:** if a key is present, fetch corpus → verify
   ground truths → `npm run harness` → judge against pre-registered failure
   criteria (mean CER >~10% or untrustworthy confidences = fail).
3. **Stage 5 decision:** run both prototypes side by side against the
   comparison checklist in the protocol; pick winner + fallback; record in
   DECISION_LOG (D-4); then start Stage 6 loops on the winner.

## Exact build, run and test commands
Per prototype directory (`prototypes/chaselist/`, `prototypes/inkline/`):
`npm install`, `npm run dev` (PORT env, default 3000), `npm test`.
InkLine: `npm run harness`; real mode needs `.env` with
`ANTHROPIC_API_KEY=...` and `TRANSCRIBE_PROVIDER=anthropic`.
Playwright: scripts already set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`;
never run `playwright install`.
