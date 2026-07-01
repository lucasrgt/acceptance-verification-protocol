# Measurements — the convergence table

Each row is one full run of the verifier-accuracy bench (`node tools/measure/measure.mjs`
from `assay/`): the catalog size at that commit and the ruler's calibration over the
executed (good, bad) pairs. The claim this table carries: criteria accrue from escapes,
and detection holds at zero false alarms as the dictionary grows.

| date | commit | archetypes | criteria | pairs | detected | false alarms |
|---|---|---|---|---|---|---|
| 2026-07-01 | 270d557 | 39 | 66 | 6 | 6 | 0 |
