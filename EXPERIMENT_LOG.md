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
