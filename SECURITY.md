# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub Security Advisories](https://github.com/lucasrgt/acceptance-verification-protocol/security/advisories/new)
— not in a public issue. You should receive a response within a week.

## Scope notes

- Assay's HTTP adapter and Assay.Net drive REAL requests against the base URL a subject
  declares. Point them only at environments you own (local/staging with seeded data) —
  verification traffic against third parties or production is misuse, not a vulnerability.
- The `model` oracle sends the gathered evidence to the configured LLM provider. Don't put
  secrets in subjects/evidence you wouldn't send to that provider.

## Supported versions

Only the latest published minor of `@aerofortress/assay` / `Assay.Net` receives fixes.
