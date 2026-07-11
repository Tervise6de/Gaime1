# PROJECT_STATE

Canonical current state. Every session updates this file before ending.

## Current state

- **Current stage:** `DUAL_PROTOTYPES` — both prototypes built and verified (run 1, 2026-07-11). Stage 5 comparison is partially blocked: InkLine's central quality experiment (E-2) needs a founder-supplied API key.
- **Current product:** none selected — finalists C-1 ChaseList and C-4 InkLine, both prototyped; briefs + success/failure criteria in CONCEPTS.md
- **Fallback product:** decided at Stage 5 (loser becomes fallback); strongest rejected concept: C-2 DrawDesk
- **Current implementation:** `prototypes/chaselist/` (22/22 tests green, screenshots in docs/screenshots/) and `prototypes/inkline/` (18/18 tests green in stub mode, accuracy harness ready)
- **Target user:** A: solo bookkeepers/small accounting firms; B: family historians/genealogists
- **Active hypothesis:** A: recipient friction is the fixable half of the document-chase problem (E-1: technical half VERIFIED; behavioral half untestable internally); B: real-scan transcription quality clears the trust bar (E-2: UNKNOWN, blocked on key)
- **Last known good commit:** the Stage 4 dual-prototypes commit (this one)
- **Current build status:** both prototypes green (`npm test` in each directory)
- **Highest-value next action:** Stage 5 comparison — ChaseList differentiation audit vs Content Snare/Keeper (its pre-registered failure criterion) + run InkLine real harness the moment a key exists; then pick winner
- **Blockers:** InkLine real-model verification needs `ANTHROPIC_API_KEY` (R-7); corpus image hosts blocked by network policy (fetch script ready)
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
