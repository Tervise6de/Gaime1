# BACKLOG

Every item must relate to: user value, distribution, monetization, risk
reduction, product quality, or technical reliability. Do not fill this with
low-value polish. `Now` may contain **at most five items**.

## Now

1. Build ChaseList prototype (Finalist A): two-sided request→upload→track
   loop per the backlog in CONCEPTS.md, with Playwright e2e. *(user value)*
2. Build InkLine prototype (Finalist B): upload→transcribe(stub)→artifact
   page + CER harness ready for a real key. *(user value / risk reduction)*
3. ChaseList security basics: expiring tokens, type/size limits, rate
   limiting — in the prototype, not deferred. *(risk reduction)*
4. InkLine: assemble public-domain handwritten test corpus with ground-truth
   transcriptions for the CER harness. *(risk reduction)*
5. Stage 5 comparison: run both prototypes end to end, audit ChaseList vs
   Content Snare/Keeper feature reality, record winner rationale.
   *(risk reduction)*

## Next

- Founder ask (non-routine): supply an AI API key via `.env` to unblock
  InkLine real-model verification (R-7).
- Engineered conversion moments: ChaseList upload-confirmation CTA; InkLine
  free-first-transcription on artifact page.
- Stage 6 winner loops: highest-value assumption first.
- Record Anthropic API in THIRD_PARTY_SERVICES.md when key activated.

## Later

- External validation materials (landing copy, interview script, activation
  funnel) — nothing published without founder approval.
- Deployed preview behind auth (needs founder approval for any service).
- Morning report (Stage 7) with screenshots.

## Rejected

- C-2, C-3, C-5, C-6, C-7, C-8, C-9, C-10, C-11, C-12 — Stage 3 rejections
  with reasons in CONCEPTS.md; do not re-propose without new evidence.
- Email sending from prototypes — external contact requires founder
  approval; reminder engine logs instead.
