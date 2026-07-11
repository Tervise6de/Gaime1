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
