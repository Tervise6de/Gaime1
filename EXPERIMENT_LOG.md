# EXPERIMENT_LOG

Append-only log of experiments against product assumptions. A hypothesis is
**not** validated merely because the feature works technically — "the code
runs" proves implementation, not user value.

## Entry format

```
## E-<number>: <short title>
- Hypothesis:
- Evidence classification (before test): ASSUMPTION | WEAK PROXY | ...
- Test (what was actually done):
- Success criterion (defined BEFORE running the test):
- Result (what actually happened):
- Interpretation (with resulting evidence classification):
- Decision: PROCEED | ADJUST | REJECT | NEEDS EXTERNAL VALIDATION
- Next action:
```

---

## Experiments

## E-1: ChaseList — recipient flow can be near-frictionless
- Hypothesis: the client-side (recipient) document upload flow can run with
  no account and ≤3 taps to first upload, on mobile, with security basics
  intact — removing the tool-side half of the "clients don't respond" problem.
- Evidence classification (before test): ASSUMPTION
- Test: built the full two-sided prototype (`prototypes/chaselist/`);
  22 automated tests (17 unit node:test + 5 Playwright e2e incl. iPhone-13
  viewport full loop, expired/invalid tokens, oversize + spoofed-mime
  rejection); independent manual walkthrough with screenshots
  (`docs/screenshots/`).
- Success criterion (pre-registered): ≤3 taps, no login, full
  create→upload→track→zip loop passes e2e, expiring tokens + limits + rate
  limiting present.
- Result: 2 taps from link-open to first uploaded file; 22/22 tests pass;
  loop verified end to end; reminder scheduler unit-tested (never sends).
- Interpretation: VERIFIED FACT that the frictionless recipient flow is
  buildable and works in-browser. Client *willingness* to respond (R-3) and
  recipient→creator conversion (R-8) remain ASSUMPTION — this experiment
  cannot and does not validate them.
- Decision: PROCEED to Stage 5 comparison.
- Next action: differentiation audit vs Content Snare/Keeper (C-1 failure
  criterion), real-device camera capture check.

## E-2: InkLine — transcription quality on realistic scans clears the trust bar
- Hypothesis: vision-LLM transcription of real (degraded) handwritten
  documents achieves CER ≲10% with trustworthy confidence marking
  (hallucination proxy ≈ 0 among high-confidence words).
- Evidence classification (before test): ASSUMPTION (benchmark results are
  VERIFIED FACT but on curated corpora).
- Test: built full journey (`prototypes/inkline/`) + CER/WER/hallucination
  harness with pre-registered metrics; 18 automated tests pass (15 unit + 3
  e2e) in stub mode.
- Success criterion: harness mean CER ≤10% on a mixed-difficulty
  public-domain corpus with hallucination proxy near zero.
- Result: **central hypothesis NOT tested** — no AI API key exists in this
  environment (R-7) and the network policy 403s manuscript-image hosts, so
  the corpus ships as manifest + fetch script + 4 ground-truth excerpts.
  Stub-mode harness proves the measurement pipeline only (its numbers are
  labeled meaningless).
- Interpretation: UNKNOWN — unchanged. The journey UX and the measurement
  instrument are VERIFIED FACT; the quality claim is not.
- Decision: NEEDS EXTERNAL INPUT — founder-supplied `ANTHROPIC_API_KEY`
  (and unblocked corpus fetch) to run the real harness.
- Next action: with key present: `harness/fetch-corpus.sh` (verify URLs),
  trim ground truths to page scope, `npm run harness`, judge against the
  pre-registered failure criteria in CONCEPTS.md.

## E-3: ChaseList — differentiation audit vs incumbents (pre-registered failure criterion)
- Hypothesis: ChaseList's recipient-side differentiators (no-login link,
  mobile camera capture, auto-reminders, $29–79 pricing) are meaningfully
  better than Content Snare / Keeper's actual current offering.
- Evidence classification (before test): ASSUMPTION (flagged as C-1's
  hardest monetization/differentiation question at Stage 3).
- Test: web audit of Content Snare, Keeper, Liscio, Financial Cents,
  TaxDome, Pixie — pricing pages, recipient-flow documentation, reviews
  (sources in the audit record, retrieved 2026-07-11).
- Success criterion: at least one articulable feature or price
  differentiator survives contact with incumbents' documented features.
- Result: FAILED on features and price — VERIFIED FACT that Content Snare's
  headline recipient experience is no-login unguessable links with mobile
  photo capture and configurable auto-reminders, from $29/mo (identical
  floor). Magic-link/no-login recipient flows are table stakes across
  Financial Cents and Pixie too. Survivors are only: unpublished tap-count
  polish (UNKNOWN), bookkeeper-close positioning (wedge, not moat), and
  simplicity-vs-suites (already occupied by Content Snare).
- Interpretation: C-1's pre-registered failure criterion is substantially
  triggered (STRONG PROXY — public feature/pricing evidence; not a
  head-to-head UX measurement). The recipient-friction bet was correct
  about the market but the incumbent already made it.
- Decision: ADJUST — ChaseList demoted to presumptive fallback (D-4);
  not killed outright because head-to-head UX speed and incumbent-churn
  reasons remain unmeasured.
- Next action: none autonomous — reviving C-1 would require founder-level
  evidence (incumbent churn interviews or head-to-head recipient testing).
