# Transfer evidence (RQ4) — the catalog isn't overfit

> Numbers in this document are a snapshot (measured 2026-06; re-measure via `node tools/measure/measure.mjs`).

> **RQ4: does a verifier mined from one project catch the same failure class in a
> different project?** This is the question that separates "a checklist for one
> app" from "a dictionary of acceptance invariants". The answer, with executed
> benchmarks: **yes.**

## The sample: four independent products, one framework

All four are real, independently-built products that happen to share one
convention bundle (a "Rails-in-.NET" kit — vertical slices + a static doctor + an
MVVM frontend harness). They do **not** share feature code, domain, or UI.

| project | domain | frontend stack | commits mined |
|---|---|---|---|
| marketplace (the source corpus) | two-persona tourism marketplace | React-Native + RN-web, expo-router | ~480 |
| project P | B2B media-planning suite | React 19 + TanStack Router + Vite | ~270 |
| project F | SaaS market-intelligence (Free/Pro/Premium tiers) | React 19 + TanStack Router + Vite | ~75 |
| the kit | the shared convention bundle + its static doctor | — (it *is* the doctor) | — |

The marketplace is RN; P and F are React-web. The Assay React adapter (RTL + jsdom)
runs against **both** — RTL drives RN-web and React-web alike. That alone is a
transfer result: one adapter, two render targets.

## The recurrence: the same archetypes, independently

The archetypes were mined from the marketplace. We then read the fix history of P
and F **without** looking for confirmation — and the same classes surfaced on their
own:

| archetype | marketplace | project P | project F |
|---|---|---|---|
| navigation-integrity | tab → unregistered route; server-minted route drift | orphaned route (404); nested route renders nothing (no `<Outlet>`) ×2 | — |
| action-effect (session storm) | anonymous `/me` refetch storm | identical `/me` refetch storm (`staleTime: Infinity` fix) | login race / stuck session |
| persona-scoped-visibility | role-switch leaks into a persona-fixed build | — | **Free tier renders Pro-only data + upsell** |
| data-honesty | fixture rows on empty API; stock/generated media | **flash-of-id** (raw GUID before the name resolves) ×2 | content silently truncated |
| lifecycle-gate | go-live gated only client-side | `/login` with a valid session sits on the form | login → home flow |

Two findings stand out:

1. **The session-storm escape is nearly identical across two unrelated codebases** —
   same root cause (an anonymous session query refetching on mount, composed by
   several guards, looping), same fix (pin the query static). A bug class, not a bug.

2. **persona-scoped-visibility generalizes from PERSONA to TIER.** In the
   marketplace it's "a traveler must not see host controls"; in the SaaS it's "a
   Free user must not see Pro data". *The same invariant* — an actor sees only what
   its scope permits — with the actor axis relabelled. This is exactly the
   universality the external reviews predicted, now observed in real fix history.

New sub-patterns the other projects contributed back to the catalog:

- **flash-of-id** (data-honesty): a detail view renders a raw entity id before the
  resolved name arrives (split queries). Rendered text must trace to *resolved*
  data, never a raw id placeholder.
- **tier-scoped-visibility** (persona): the persona invariant, applied to
  subscription tiers.
- **parent-without-Outlet** (navigation-integrity): a TanStack-Router-specific
  manifestation of "navigates but renders nothing" — the parent route forgets its
  `<Outlet>`, so the child never mounts.

## The executed result: one criterion, two projects

Evidence beats assertion. The benchmark (`bench/persona-visibility.test.ts`) runs
the **same** criterion — `no-cross-persona-affordance`, mined from the
marketplace's persona leak — against faithful repros of **two** projects' escapes:

```
[AVP] persona-visibility (cross-project) detection=2/2  false-alarm=0
```

- It fails the marketplace's BAD settings (role-switch visible in a fixed build).
- It fails the SaaS's BAD dashboard (Pro-only "market value" section rendered for a
  Free tier).
- It passes both GOOD variants.

`bench/navigation.test.ts` does the same for navigation-integrity across the
marketplace (wrong target) and project P (orphaned route):

```
[AVP] navigation-integrity (cross-project) detection=2/2  false-alarm=0
```

A criterion authored from one product's history detecting a different product's
real, historical escape — with no false alarm on the fix — is the transfer claim,
executed.

## What this licenses (and what it doesn't)

- **Licenses:** treating the catalog as a *portable dictionary* of acceptance
  invariants, not a per-app checklist. New projects start from the catalog, not from
  zero.
- **Doesn't license:** claiming completeness. Transfer ≠ totality. The catalog
  *converges* via escape accrual; it is never *proven* complete (see
  docs/catalog.md). Each new project both validates existing archetypes and
  contributes new sub-patterns (flash-of-id, tier-scoped, parent-without-Outlet
  came from P and F).

## Honesty ledger

- The repros are faithful to the real diffs (mined by reading each fix commit), not
  shaped to trip a criterion. The benchmark reproduces the bug, then runs the whole
  archetype — a false-green is the catastrophic error, so the GOOD variant must pass
  with no false alarm.
- `parent-without-Outlet` and `flash-of-id` are catalogued but **not yet executed**
  here — they need a router-mounted probe (the real TanStack/expo router) and a
  paint-timing probe respectively. Listed as the next runtime criteria, not claimed
  as covered.


## Reproducing a transfer run (one command per project)

Transfer is now an operational loop, not a bespoke experiment:

1. In the TARGET repo, install the verifier: `npm i -D @aerofortress/assay vitest` (+ the
   react peers if verifying DOM criteria).
2. Author the subjects — one `*.assay.test.*` file per feature, declaring the seams that
   already exist (see `docs/getting-started.md`).
3. Run **`npx assay verify`** — every criterion the archetypes can observe in that project
   executes; genuine domain non-applicability is reported separately, while missing
   proof is unresolved and cannot produce a green gate.

A criterion mined in project A catching an escape in project B **through that command,
unchanged**, is the transfer claim holding. For .NET targets the same loop is
`Runner.Run(Catalog.LoadDefault(), …)` inside the project's own xUnit suite.
