# DECISION_LOG

Append-only log of major decisions. Record a decision when it selects,
rejects, pivots or reverses something significant (concepts, finalists,
winner, stack, monetization, distribution approach). Check this log before
reversing any earlier decision.

## Entry format

```
## D-<number>: <short title>
- Date / session:
- Decision:
- Alternatives considered:
- Evidence (with classification: VERIFIED FACT / STRONG PROXY / WEAK PROXY /
  ASSUMPTION / CREATIVE JUDGMENT / UNKNOWN):
- What could invalidate this decision:
- Status: ACTIVE | SUPERSEDED by D-<n>
```

---

## D-1: Repository operating system established

- Date / session: 2026-07-11, setup session
- Decision: Initialized the repository-based operating system (protocol,
  state, handoff, backlog, logs, risk register, templates). No product
  concept was selected or developed.
- Alternatives considered: none — setup was the mandated task.
- Evidence: VERIFIED FACT — files exist in the setup commit.
- What could invalidate this decision: founder replaces the protocol.
- Status: ACTIVE

## D-2: Two finalists selected — C-1 ChaseList and C-4 InkLine

- Date / session: 2026-07-11, run 1
- Decision: Finalist A = C-1 ChaseList (client document collection for
  bookkeepers); Finalist B = C-4 InkLine (handwriting transcription +
  shareable family artifacts). Substantially different: B2B recurring
  workflow subscription with private outputs vs consumer emotional
  AI-transformation with credit packs and public artifacts. C-4 fills the
  protocol's protected unconventional slot on evidence strength (verified
  capability inflection + best-graded loop), chosen over C-11 which the
  red team rated "most self-deceiving".
- Alternatives considered: C-2 DrawDesk was the strongest rejected concept
  (product STRONG, monetization A, machine-verifiable prototype) — rejected
  because its kill risk is external and unresolvable by building: GCs can
  contractually dictate the copyrighted AIA form or their own portals,
  making a legally-safe equivalent rejectable by the exact gatekeeper the
  product serves. Full rejection reasons for all ten in CONCEPTS.md.
- Evidence: six independent specialist evaluations (product, growth,
  monetization, tech/UX, privacy, red team) recorded in CONCEPTS.md —
  STRONG PROXY (internal judgment, not market data). Category WTP for both
  finalists — STRONG PROXY (paid comparables exist). Distribution
  conversion for both — ASSUMPTION (cannot be falsified without users; red
  team's portfolio-wide warning recorded in CONCEPTS.md).
- What could invalidate this decision: C-1 — post-build feature audit shows
  no articulable differentiation vs Content Snare/Keeper; C-4 — measured
  CER/hallucination rate on realistic scans breaks the trust bar or
  per-page cost breaks credit economics. Either triggers promotion of the
  other finalist and/or reconsideration of C-2 after format-risk research.
- Status: ACTIVE

## D-3: Prototype technology stack

- Date / session: 2026-07-11, run 1
- Decision: One shared boring stack for both prototypes: Node 22 + Express +
  better-sqlite3 + EJS + vanilla JS, Playwright for e2e; InkLine adds
  @anthropic-ai/sdk behind a provider-agnostic module with a stub mode.
  Monorepo layout: `prototypes/chaselist/`, `prototypes/inkline/`.
- Alternatives considered: FastAPI/Python for InkLine (tech evaluator's
  suggestion) — rejected to keep one runtime, one test harness, one set of
  build commands for autonomous continuity.
- Evidence: CREATIVE JUDGMENT constrained by protocol (boring, established,
  locally runnable, zero required paid services for the first prototype).
  VERIFIED FACT: no AI API key exists in this environment, so ChaseList
  (zero-key) is built first and InkLine ships stub-mode + CER harness ready
  for a founder-supplied key.
- What could invalidate this decision: a selected winner needing
  capabilities this stack serves poorly (then re-decide at Stage 6 entry).
- Status: ACTIVE

## D-4: Provisional Stage 5 outcome — InkLine presumptive winner, ChaseList presumptive fallback

- Date / session: 2026-07-11, run 1 (end)
- Decision: PROVISIONAL — not final. ChaseList's pre-registered failure
  criterion is substantially triggered (E-3: every claimed differentiator —
  no-login link, mobile camera upload, auto-reminders, $29 floor — is
  already Content Snare's documented, headline offering). InkLine's
  differentiation (standalone, no ecosystem lock-in, provenance-honest
  uncertainty marking, shareable artifact pages) remains unrebutted, and
  its journey prototype is verified. Therefore InkLine is the presumptive
  winner and ChaseList the presumptive fallback.
- CONFIRMATION CONDITION (must happen before Stage 6 development): InkLine
  must PASS its own pre-registered quality harness (E-2: mean CER ≲10% on a
  real mixed-difficulty corpus with near-zero hallucination proxy) once a
  founder-supplied API key exists. If it fails, BOTH finalists have
  triggered failure criteria → formal reconsideration (C-2 DrawDesk after
  format-risk research, or a return to Stage 3 with the evaluation record).
- Alternatives considered: declaring ChaseList winner (rejected — building
  a feature-parity clone of Content Snare at the same price contradicts
  the protocol's differentiation principles); declaring nothing (rejected —
  the asymmetry in evidence is real and the next session needs a default).
- Evidence: E-1 VERIFIED (ChaseList technically excellent — irrelevant if
  undifferentiated); E-3 STRONG PROXY (public feature/pricing audit);
  E-2 UNKNOWN (blocked on key). This decision deliberately rests on
  differentiation evidence, not on unproven InkLine quality — hence
  provisional with a hard confirmation gate.
- What could invalidate this decision: InkLine failing its harness;
  founder-level evidence that Content Snare churners leave for reasons
  ChaseList fixes; head-to-head recipient-flow measurements favoring
  ChaseList decisively.
- Status: SUPERSEDED by D-5 (founder-directed pivot)

## D-5: Founder-directed pivot — restart ideation under a sharp new objective function

- Date / session: 2026-07-11, run 2 (founder message)
- Decision: FORMAL PIVOT at founder direction. The run-1 finalists
  (ChaseList, InkLine) and the whole run-1 portfolio are shelved — not as
  failures of execution but because they miss the founder's real objective:
  products that are *interesting*, grow with **zero founder marketing**, and
  can plausibly reach **$1–2k/mo within 3 months**. Run-1 concepts were B2B
  vitamins with hand-waved distribution — wrong shape.
- New objective function (founder answers, this session):
  1. Distribution = **hands-off** — the product must spread through its own
     outputs; founder will not promote it.
  2. Form factor = **standalone web app** (not marketplace-native).
  3. Domain edge = **commerce / small business / marketing**.
- Binding design rule derived from the above: *the core value delivery must
  itself be a customer-facing broadcast* — using the tool for a selfish
  reason automatically exposes it to the user's customers (Calendly /
  Typeform / Linktree / Carrd / Beacons badge-and-embed loop). This kills
  all private-utility / dashboard / back-office concepts.
- Filters for the new portfolio: customer-facing or public output;
  intrinsic "made-with"/embed/recipient loop; paid boundary AT the value
  moment (remove badge / volume / pro — not freemium hope); impulse price
  ($9–49/mo or one-time); fast time-to-first-value AND time-to-first-
  broadcast; genuinely interesting.
- Alternatives considered: proceeding with InkLine (rejected — founder finds
  it uncompelling and it fails the hands-off/3-month bar); marketplace-native
  (rejected — founder prefers standalone).
- Evidence / honesty note: hands-off + standalone + 3-month + no-ad is the
  hardest distribution profile; base rate ~70% of micro-SaaS never reach
  $1k MRR (WEAK PROXY, aggregators, run-1 research). This pivot targets a
  rare shape and will likely need iteration. Old prototypes remain in
  `prototypes/` as prior exploration; DrawDesk (C-2) remains a separate
  reserve path but does NOT fit the hands-off rule and is deprioritized.
- What could invalidate this decision: founder reverses direction.
- Status: ACTIVE
