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

*(empty — first entries expected in Stages 4–6)*
