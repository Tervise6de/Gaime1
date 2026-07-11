# Gaime1 — Autonomous Product Studio

This repository is an autonomous overnight product-development experiment. Fresh
Claude Code sessions continue one shared project through repository state. The
product is NOT a game. The goal: discover, prototype and develop a commercially
credible digital tool or web product with genuine organic-growth potential.

## Session startup (do this first, in order)

1. Read `PROJECT_STATE.md` — current stage, product, hypothesis, next action.
2. Read `HANDOFF.md` — the snapshot left by the previous session.
3. Read only the section of `AUTONOMOUS_PRODUCT_PROTOCOL.md` matching the
   current stage. Do not reload the whole protocol every session.
4. Inspect recent commits (`git log --oneline -15`) and the current
   implementation. Trust code and commits over stale documents.
5. Run the session-safety check below before writing anything.

## Session-safety check (concurrent sessions)

Remote sessions may overlap. Before modifying anything:

- `git fetch origin` and check the latest commit time on the working branch.
- If another session committed within the last **30 minutes** (a commit you did
  not make this session), assume it is active. Then do only read-only analysis,
  review, or planning notes kept out of shared files — or exit safely.
- Never force-push. Before risky changes, create a checkpoint commit.
- If the build is broken and cannot be repaired efficiently, return to the
  last known good commit recorded in `PROJECT_STATE.md`.

## Core working rules

- **Continue, don't restart.** Pick up from the latest state. Do not regenerate
  concepts after a product is selected unless evidence supports a formal pivot
  (record it in `DECISION_LOG.md`).
- **Work the hardest assumption.** Always work on the highest-value unresolved
  user, distribution, commercial or technical assumption — not the easiest task.
- **Build > document.** Build, run, test and improve real product functionality.
  Prefer direct evidence (running the app, inspecting output) over documents.
- **Verify, then commit.** Commit and push verified work before the session
  ends. Small, working commits beat large unverified ones.
- **One success is not done.** One feature, one prototype, one green build or a
  few passing tests never mean the session is complete. Continue while
  meaningful work and runtime remain.
- **Decide autonomously.** Do not ask the founder for routine product, design
  or technical decisions. Only founder-approval items (publishing, spending,
  contacting users, paid services) require asking — see the protocol.
- **Classify evidence.** Label important conclusions as VERIFIED FACT / STRONG
  PROXY / WEAK PROXY / ASSUMPTION / CREATIVE JUDGMENT / UNKNOWN.

## Session end (always, in order)

1. Commit and push verified work.
2. Update `PROJECT_STATE.md` (stage, status, last known good commit, next action).
3. **Overwrite** `HANDOFF.md` with a concise current snapshot (no history).
4. Update `BACKLOG.md`, and `DECISION_LOG.md` / `EXPERIMENT_LOG.md` if decisions
   or experiments happened.

## File map

| File | Purpose | Read when |
|---|---|---|
| `PROJECT_STATE.md` | Canonical current state + stage definitions | Every session |
| `HANDOFF.md` | Replaceable snapshot from last session | Every session |
| `AUTONOMOUS_PRODUCT_PROTOCOL.md` | Permanent rules + stage process | Relevant section only |
| `BACKLOG.md` | Now / Next / Later / Rejected | When choosing work |
| `DECISION_LOG.md` | Major decisions + rationale | Before reversing a decision |
| `CONCEPTS.md` | Concept portfolio + evaluations | Stages 2–5 |
| `EXPERIMENT_LOG.md` | Hypotheses, tests, results | When testing assumptions |
| `USER_RESEARCH.md` | User assumptions + validation plan | Stages 1–3, validation work |
| `RISKS.md` | Risk register with kill/pivot conditions | Before major decisions |
| `THIRD_PARTY_SERVICES.md` | Dependencies, licences, costs | When adding any dependency |
| `MORNING_REPORT.md` | Founder-facing assessment | Stage 7 |

## Build, run and test commands

No technology stack selected yet. Once selected, record exact commands here:

```
# Setup:   (to be added after stack selection)
# Run:     (to be added after stack selection)
# Test:    (to be added after stack selection)
```

Until then, `HANDOFF.md` carries any interim commands.

## Hard limits (never violate)

- No secrets in the repository — use `.env.example` for required variables.
- No publishing, spending money, contacting users, sending email, ads or paid
  services without explicit founder approval.
- No deceptive growth mechanics, spam, dark patterns or manipulative monetization.
- Never force-push.
