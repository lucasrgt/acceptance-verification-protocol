# AVP executor stress: 10,000 subjects

This is a deterministic, off-catalog stress fixture for the AVP execution engine. It is not evidence that AVP detects every real product failure.

| Measurement | Result |
| --- | ---: |
| Subjects | 10,000 |
| Criteria per subject | 16 |
| Criterion verdicts | 160,000 |
| Corrected subjects | 5,000 |
| Vulnerable subjects | 5,000 |
| Expected failures detected | 5000/5000 |
| Missed failures | 0 |
| False alarms | 0 |
| Unexpected result shapes | 0 |
| Missing oracles fail closed | yes |
| Infrastructure errors fail closed | yes |
| Wall time | 79 ms |
| Criterion verdicts per second | 2,025,316.46 |
| Overall result | PASS |

## What this proves

The engine preserved the expected verdict for every fixture, distinguished corrected subjects from known vulnerable subjects, and refused green outcomes when an oracle or verifier infrastructure was unavailable.

## What this does not prove

- The corpus is deterministic and synthetic.
- This benchmark measures executor integrity and fail-closed behavior, not the semantic accuracy of public AVP criteria.
- The fixture uses in-process mechanical probes and does not include browser, network, model, or human latency.
