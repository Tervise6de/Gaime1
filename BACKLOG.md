# BACKLOG

Every item must relate to: user value, distribution, monetization, risk
reduction, product quality, or technical reliability. Do not fill this with
low-value polish. `Now` may contain **at most five items**.

## Now

1. **Gate:** run InkLine real quality harness once `ANTHROPIC_API_KEY`
   exists (fetch corpus → verify ground truths → `npm run harness` → judge
   E-2 criteria → confirm/reverse D-4). *(risk reduction — the single
   deciding experiment)*
2. If gate passes: begin Stage 6 on InkLine — first loop: real-scan quality
   on deliberately degraded documents + confidence-threshold tuning.
   *(user value)*
3. If gate passes: InkLine collections UX (box-of-letters flow: multi-page
   upload, collection artifact page). *(user value / retention)*
4. Prepare Stage 7 morning-report skeleton from run-1 evidence (both
   prototypes, honest proven-vs-assumed). *(risk reduction)*

## Next

- Founder ask (non-routine, blocking): supply `ANTHROPIC_API_KEY` via
  `prototypes/inkline/.env` (R-7); also confirm modest API spend for the
  harness (~15 vision calls per run).
- InkLine conversion moment: recipient-side "transcribe one of your own —
  first page free" flow actually functional end to end.
- Stage 6 loops: per-word confidence calibration audit; PDF-page ingestion;
  GEDCOM/PDF export.
- If D-4 reverses (harness fails): formal reconsideration — C-2 DrawDesk
  format-risk research or return to Stage 3 with the evaluation record.

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
