# HANDOFF

Compact snapshot for the next session. **Overwrite this file entirely at the
end of every session — do not append history.**

## Current stage
`PROTOTYPE_COMPARISON` with a provisional outcome (D-4). Run 1 (2026-07-11)
completed Stages 1–4 and most of Stage 5.

## Current product
**InkLine (C-4) — presumptive winner, NOT confirmed.** Confirmation gate:
InkLine must pass its pre-registered quality harness (E-2: mean CER ≲10%,
near-zero hallucination proxy on a real mixed-difficulty corpus). Do not
start Stage 6 feature work before running that gate.
**ChaseList (C-1) — presumptive fallback:** technically excellent (22/22
tests) but E-3 audit showed its differentiators are Content Snare's exact
documented features at the same $29 floor — pre-registered failure
criterion substantially triggered.

## Target user
InkLine: family historians/genealogists. Fallback: solo bookkeepers.

## Active hypothesis
E-2 — real-scan transcription quality clears the trust bar. UNKNOWN,
blocked on a founder-supplied `ANTHROPIC_API_KEY`. This is the single
question that decides everything downstream.

## What changed
Run 1: research (USER_RESEARCH.md) → 12 concepts + six-specialist
evaluation (CONCEPTS.md) → finalists (D-2, D-3) → both prototypes built,
independently verified, screenshots captured → incumbent audit (E-3)
demoted ChaseList → provisional winner decision (D-4).

## Current implementation status
- `prototypes/inkline/` — GREEN stub mode (15 unit + 3 e2e): upload →
  side-by-side artifact page (uncertainty highlighting, [?] placeholders,
  prominent STUB banner) → public share URL → collection. CER/WER/
  hallucination harness ready (`npm run harness`); Anthropic provider code
  present but NEVER exercised against the live API. Corpus: manifest of 11
  public-domain docs + fetch script; image hosts 403'd here; 4 ground-truth
  excerpts shipped (must be trimmed to page scope before trusting CER).
- `prototypes/chaselist/` — GREEN (17 unit + 5 e2e): full two-sided loop,
  2-tap recipient upload, reminder outbox (log only), ZIP download,
  expiring tokens/limits/rate-limit. Preserved as fallback; no further
  work planned unless D-4 reverses.

## Last known good commit
Latest commit on `main` (run-1 close, includes both prototypes green).

## Known blockers
1. `ANTHROPIC_API_KEY` needed in `prototypes/inkline/.env` (+ founder OK
   for ~15 vision calls/run of harness spend) — R-7.
2. Corpus downloads blocked by network policy here; verify manifest URLs
   when internet is open (`harness/fetch-corpus.sh`).

## Next three actions
1. Run the E-2 gate: fetch/verify corpus → `npm run harness` with the real
   provider → judge against pre-registered criteria → record in
   EXPERIMENT_LOG and confirm or reverse D-4 in DECISION_LOG.
2. If confirmed: Stage 6 loop 1 on InkLine — degraded-scan quality +
   confidence calibration (is a 0.9-confidence word actually right ~90% of
   the time?); then box-of-letters collections UX.
3. If reversed: formal reconsideration per D-4 (C-2 DrawDesk format-risk
   research first, then Stage 3 record).

## Exact build, run and test commands
Per prototype dir: `npm install`, `npm run dev` (PORT env), `npm test`.
InkLine: `npm run harness`; real mode: `.env` with `ANTHROPIC_API_KEY=...`,
`TRANSCRIBE_PROVIDER=anthropic` (optionally `MODEL=`). Playwright scripts
already set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; never run
`playwright install`; keep `@playwright/test` pinned (chromium-1194).
