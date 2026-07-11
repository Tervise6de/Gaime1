# PROJECT_STATE

Canonical current state. Every session updates this file before ending.

## Current state

- **Current stage:** `CONCEPTS` (run 2, post-pivot D-5) — awaiting founder taste selection among the Run 2 shortlist before prototyping
- **Current product:** none — Run 1 finalists shelved by founder pivot (D-5). Run 2 shortlist (R2-1..R2-4) in CONCEPTS.md pending selection
- **Fallback product:** n/a during re-ideation; Run 1 prototypes preserved in `prototypes/` as prior exploration
- **Current implementation:** none active. Archived: `prototypes/chaselist/` and `prototypes/inkline/` (both green, from Run 1)
- **Target user:** TBD by selection — candidates are event/pop-up commerce vendors (permanent-jewelry/lash/tattoo pop-ups; wedding photographers; mobile food vendors) or service SMBs
- **Active hypothesis:** a customer-facing broadcast artifact for a tight vendor niche can grow hands-off via a peer loop (recipient = ICP). UNKNOWN until a concept is chosen and tested.
- **Last known good commit:** latest on main (pivot + Run 2 research/shortlist)
- **Current build status:** not started (re-ideation)
- **Highest-value next action:** founder picks a Run 2 direction → write its full finalist brief + prototype the peer-loop artifact (single-player value first) → test whether the shared link is compelling enough to switch from static PDFs/Canva
- **Blockers:** awaiting founder taste selection (question posed 2026-07-11)
- **Morning report ready:** false

## Stage definitions

### 1. `RESEARCH`
- **Entry:** setup complete; no concepts generated yet.
- **Required evidence:** opportunity notes in `USER_RESEARCH.md` with evidence
  classifications; ≤ ~20% of the first run spent here.
- **Exit:** enough signal to generate diverse concepts.

### 2. `CONCEPTS`
- **Entry:** research notes exist.
- **Required evidence:** ≥ 10 meaningfully different non-game concepts in
  `CONCEPTS.md`, each evaluated against the full checklist.
- **Exit:** concept portfolio is diverse (not 10 variations of one AI tool).

### 3. `TWO_FINALISTS`
- **Entry:** concept portfolio complete.
- **Required evidence:** two substantially different finalists, each with
  target user, problem, outcome, first-use journey, activation event,
  distribution and monetization mechanism, economical prototype path;
  selection rationale in `DECISION_LOG.md`.
- **Exit:** both finalists recorded; at least one unconventional
  high-conviction concept preserved.

### 4. `DUAL_PROTOTYPES`
- **Entry:** finalists selected.
- **Required evidence:** two small functional prototypes, each testing its
  concept's most important uncertain assumption; each lets a user experience
  the central value; both run locally.
- **Exit:** both prototypes runnable and exercised end to end.

### 5. `PROTOTYPE_COMPARISON`
- **Entry:** both prototypes runnable.
- **Required evidence:** comparison from implementation evidence (time to
  first value, result strength, distribution and monetization credibility,
  feasibility, risk); winner + fallback recorded in `DECISION_LOG.md` with
  what remains unknown and what could invalidate the decision.
- **Exit:** one winner chosen; fallback preserved in the repository.

### 6. `WINNER_DEVELOPMENT`
- **Entry:** winner chosen.
- **Required evidence:** repeated verified loops (implement → run → complete
  user journey → inspect result → record → commit); `EXPERIMENT_LOG.md`
  entries for tested assumptions; last known good commit maintained.
- **Exit:** core user journey works end to end and delivers the core value.

### 7. `FUNCTIONAL_PRODUCT`
- **Entry:** core journey works end to end.
- **Required evidence:** runnable app with exact setup instructions; core
  value inspectable; screenshots possible; known weaknesses recorded.
- **Exit:** product is demonstrable to the founder without live assistance.

### 8. `MORNING_ASSESSMENT`
- **Entry:** product demonstrable, or runtime nearly exhausted.
- **Required evidence:** completed `MORNING_REPORT.md` per Stage 7 of the
  protocol, honest evidence classifications, clear recommendation.
- **Exit:** morning report ready = true; state and handoff updated; work pushed.
