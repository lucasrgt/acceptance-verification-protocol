# Genesis — why `action-effect` is the first archetype

AVP's first archetype was **not** chosen by taste. It came from *error analysis* over a real
corpus: the git history of a real-world tourism marketplace — a production web app,
~2 weeks old, built mostly by an LLM.

## The data

481 commits in 15 days; **237 (~49%) are fixes** — half the work was repairing what escaped.
Classifying ~150 behavioral fix commits:

| Archetype / surface | % | spec-gap / verification-gap |
|---|---|---|
| routing-app-shell | 23% | (half is stack artifact: expo-router/TanStack) |
| auth-persona-visibility | 15% | mostly spec-gap |
| **effect-wiring (action-effect)** | **14%** | + root of much of payments/notifications |
| lifecycle-gating | 12% | |
| form-wizard-state | 11% | |
| list-filter-visibility | 8% | |
| data-binding / money / ui / i18n | ~17% | more verification-gap |

**Failure class:** specification-gap 56% vs verification-gap 44%.

## The three findings that shaped the project

1. **The spec-gap/verification-gap boundary dissolves.** Much of "nobody specified it" is really
   "verified at the wrong level": backend tests calling `Handle()` with an already-parsed type
   (blind to wire format); e2e asserting only *"the CTA renders"* (blind to the click that does
   nothing). → AVP's commitment is **observable verification** (network/DOM/state), exactly where
   unit/mock is blind.
2. **"Fixture/mock data leaking into production"** is a failure archetype **specific to
   LLM-built software** (`8ec5dae5`, `74f546d1`): the model fills the empty state with mock data
   and forgets to remove it. A possibly citable category.
3. **The git history is a free labeled dataset:** every fix commit is a `(pre-fix = bad,
   post-fix = good)` pair. It's the basis of the verifier-accuracy benchmark.

## Why `action-effect` won as the first brick

- **Ubiquitous** to any stateful app (action → second-order effect), not just this one.
- **Most observable** (network + DOM + state) → clean mechanical pass/fail.
- **Anti-Goodhart** by nature: a second-order effect is hard to fake.
- It is **exactly where the mock lies** → the best proof-of-concept for the thesis.

## The full constellation (roadmap)

Slice 1 runs 2 mechanical criteria. The documented constellation has 10 (the others land as their
oracle is implemented): second-order effects (notify both parties), projection convergence after
a mutation, the role-correct endpoint, retry idempotency, the real precondition reason, no fixture
phantom data, integration carrying the params that resolve the effect. Per-criterion evidence is
in `seenIn` (commit hashes from the source project).
