# RISKS

Risk register. For every major risk record: likelihood (low/med/high), impact
(low/med/high), current evidence (with classification), mitigation, and a
kill-or-pivot condition. Review before major decisions (finalist selection,
winner selection, launch-scope decisions).

## Entry format

```
### R-<number>: <short title>  [category]
- Likelihood:
- Impact:
- Current evidence:
- Mitigation:
- Kill / pivot condition:
```

## Categories

### User-value risk
*(the product does not solve a real or painful enough problem)*

### Market risk
*(too few users, shrinking category, dominant incumbents)*

### Distribution risk
*(no credible organic acquisition or sharing loop)*

### Monetization risk
*(no credible willingness to pay; freemium ≠ monetization)*

### Technical risk
*(core capability infeasible, unreliable or too slow)*

### Legal risk
*(licensing, regulated category, content ownership)*

### Privacy risk
*(sensitive data, external APIs receiving user data, deletion)*

### Security risk
*(secrets, supply chain, abuse of deployed endpoints)*

### Operational risk
*(hidden manual operations, support burden, infrastructure cost)*

### Dependency risk
*(third-party services, lock-in, free-tier limits, unmaintained packages)*

---

## Standing risks (apply regardless of concept)

### R-1: Autonomous self-validation bias  [user-value risk]
- Likelihood: high
- Impact: high
- Current evidence: VERIFIED FACT — the system cannot talk to real users, so
  it cannot prove demand, retention, willingness to pay or virality.
- Mitigation: strict evidence classification; morning report separates proven
  from assumed; external validation plan prepared for founder approval.
- Kill / pivot condition: n/a — permanent constraint to be honest about.

### R-2: Overlapping autonomous sessions corrupting state  [operational risk]
- Likelihood: medium
- Impact: medium
- Current evidence: ASSUMPTION — remote sessions may overlap.
- Mitigation: session-safety check in `CLAUDE.md` (fetch + recent-commit
  heartbeat); never force-push; checkpoint before risky changes.
- Kill / pivot condition: n/a — process risk, mitigated per session.

## Finalist risks (added 2026-07-11 at Stage 3)

### R-3: ChaseList — pain is client behavior, not tracking  [user-value risk]
- Likelihood: medium-high
- Impact: high (kills the concept)
- Current evidence: red-team steelman — reminders land in the same ignored
  inbox; Content Snare churn may be for the unfixable reason. ASSUMPTION
  either way; cannot be falsified without real users.
- Mitigation: design center = recipient friction (≤3 taps, no login, mobile
  photo upload); prototype measures the recipient journey, not just the
  sender dashboard.
- Kill / pivot condition: at Stage 5, if we cannot honestly argue the
  recipient experience is materially better than Content Snare's, C-1 loses.
- **UPDATE 2026-07-11 (E-3):** condition substantially met — Content Snare's
  documented recipient flow already is no-login + mobile camera + auto
  reminders at the same price floor. C-1 demoted to presumptive fallback
  (D-4).

### R-4: ChaseList — sensitive client documents  [privacy/security risk]
- Likelihood: certain (inherent to the product)
- Impact: high (single breach kills bookkeeper trust)
- Current evidence: VERIFIED FACT (nature of the data).
- Mitigation: prototype uses synthetic files only; expiring unguessable
  tokens, file type/size limits, rate limiting from day one; auto-delete
  retention; encryption at rest before any real deployment; no public
  deployment without auth.
- Kill / pivot condition: none — a cost of doing business in this category.

### R-5: InkLine — real-scan quality below benchmark claims  [user-value/technical risk]
- Likelihood: medium
- Impact: high (trust is the product; one hallucinated ancestor name = churn)
- Current evidence: VERIFIED FACT that LLMs hit <2% CER on benchmark corpora;
  UNKNOWN on faded/damaged real scans — exactly what the prototype measures.
- Mitigation: CER harness with deliberately degraded public-domain documents;
  uncertainty highlighting as a core feature, not decoration; honest failure
  criteria pre-registered (>~10% CER or untrustworthy confidence = fail).
- Kill / pivot condition: failure criteria met at Stage 5 → C-4 loses.

### R-6: InkLine — incumbent fast-follow  [market risk]
- Likelihood: high (MyHeritage/Ancestry already shipped betas)
- Impact: medium (shrinks to a wedge, doesn't zero it)
- Current evidence: STRONG PROXY (both incumbents ship transcription inside
  their subscription ecosystems).
- Mitigation: differentiate on what ecosystems won't do: standalone,
  no-lock-in, shareable public artifact pages, provenance-honest output.
- Kill / pivot condition: if incumbents' free tools are already good AND
  shareable (verify during Stage 5), the wedge is a feature, not a company.

### R-7: InkLine — no AI API key in build environment  [dependency risk]
- Likelihood: certain (current state)
- Impact: medium (blocks real-model verification, not the build)
- Current evidence: VERIFIED FACT (environment check 2026-07-11).
- Mitigation: provider-agnostic module + stub mode + ready CER harness;
  founder supplies key via `.env` (never committed) to unblock.
- Kill / pivot condition: none — operational blocker only.

### R-8: Both finalists — recipient→creator conversion unprovable overnight  [distribution risk]
- Likelihood: certain (methodological limit)
- Impact: high on decision quality
- Current evidence: red-team portfolio-wide warning — internal builds cannot
  falsify conversion; all loop claims remain ASSUMPTION.
- Mitigation: engineer the conversion moment into both prototypes so the
  external validation (founder-approved) tests a real mechanism, not a hope;
  morning report must not claim distribution validation.
- Kill / pivot condition: n/a — honesty constraint on all conclusions.
