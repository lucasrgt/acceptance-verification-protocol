# Benchmarks

AVP publishes two complementary forms of evidence.

| Evidence | Question |
| --- | --- |
| Catalog calibration | Does each public verifier reject its vulnerable reproduction and accept its corrected control? |
| Executor stress | Does the core preserve exact verdicts and fail-closed behavior under sustained deterministic load? |

The catalog calibration is the scientific evidence described in
[`docs/measurements.md`](../docs/measurements.md). It covers real escaped
defects and their corrected controls.

The executor stress is an off-catalog synthetic fixture. It runs an equal mix
of corrected and known-vulnerable subjects through 16 mechanical criteria. It
also verifies that missing model or human oracles remain inconclusive and that
unexpected verifier errors become failures. It measures engine integrity, not
the semantic accuracy of public criteria.

## Run

```bash
cd assay
npm ci
npm run benchmark:stress
```

The default command runs 1,024 and 10,000 subjects. Machine-readable summaries
and human-readable reports are committed under `benchmarks/results/`.
