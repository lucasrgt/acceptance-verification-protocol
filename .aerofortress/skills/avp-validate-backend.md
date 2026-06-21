---
description: Validate a backend AVP criterion implemented in avp/assay.net — confirm the caos→verde calibration (the verifier PASSES the correct server and FAILS the vulnerable one) and that the whole suite is green. Use after implementing or changing a backend criterion.
---

# Validate a backend AVP criterion

A criterion is only done when its RULER is calibrated: it must fail the bad server, not just
pass the good one. A verifier that can't catch the escape is worse than none (false green).

## Steps
1. `cd avp/assay.net && dotnet test`. The whole suite must be green.
2. Confirm the criterion has BOTH facts and both pass:
   - good repro server → criterion `Pass` (and `AcceptanceScore` reflects it);
   - bad/vulnerable repro server → criterion `Fail`.
   If the bad-server test passes only because the assertion is weak, that is a FALSE GREEN — fix the
   oracle, never the expectation.
3. Robustness check (mutation-style): tweak the bad server to a DIFFERENT plausible escape of the same
   class; the criterion should still fail it. If it slips through, the oracle is too narrow.
4. If the criterion is new to the catalog, ensure `avp/protocol/catalog.json` was regenerated and the JS
   drift-guard is green: `cd avp/assay && npx vitest run protocol-sync` (this is a SHARED-file step —
   serialize it, never run two at once).
5. Report: criterion id, pass/fail of good & bad, suite count, and any skips (with the honest reason).
