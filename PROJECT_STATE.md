# PROJECT_STATE

Canonical current state. Every session updates this file before ending.

## Current state

- **Current stage:** `WINNER_DEVELOPMENT` (run 2, post-pivot) — Poppin (R2-1) chosen (D-6) and prototyped; core artifact + waitlist verified (E-4). Next real test is EXTERNAL (would artists share it) → needs founder approval.
- **Current product:** Poppin — public pop-up page + live walk-in waitlist for pop-up service artists (lead: permanent jewelry). Prototype built & verified.
- **Fallback product:** other Run 2 concepts (R2-2 wedding timeline, R2-3 mobile menu) unbuilt; Run 1 prototypes archived in `prototypes/`
- **Current implementation:** `prototypes/poppin/` — 30 unit + 10 e2e green; mobile screenshots in `docs/screenshots/`; zero API keys
- **Target user:** pop-up service artists — permanent-jewelry welders (lead), lash/brow/piercing/tattoo-flash (adjacent)
- **Active hypothesis:** artists will actually create + share these pages, igniting a peer loop (recipient = ICP). ASSUMPTION — untestable internally; E-4 only verified the precondition (proud-to-share artifact + working waitlist).
- **Last known good commit:** latest on main (Poppin prototype, E-4)
- **Current build status:** Poppin green (`npm test` in prototypes/poppin)
- **Highest-value next action:** founder reaction to screenshots; if positive → (1) add photo/logo upload (biggest realism gap), (2) prepare founder-approved external validation with ~5 real pop-up artists (the real loop/WTP test)
- **Blockers:** the decisive questions (do artists share it, will they pay) require real users → founder approval to reach out; nothing else blocks build work
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
