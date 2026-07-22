# CONTEXT — AVP glossary

Opinionated domain glossary. Formal terms, anchored in testing theory (the root concept is the
**oracle problem**, Weyuker 1982). One definition per term + rejected synonyms.

---

**subject** — the feature or **flow** under verification (a *system-under-test* at the feature
level). The target is the flow, not the static screen: bugs live in the transition and the state.
_Avoid:_ "screen", "sun", "star".

**criterion** — a checkable acceptance statement about the subject. The unit of "done".
_Avoid:_ "planet", "rule", "check" (a check is the oracle's implementation, not the criterion).

**specification (spec)** — a named, versioned set of criteria for a class of subject.
_Avoid:_ "constellation", "suite" (a suite is the run, not the definition).

**archetype** — a reusable feature class (`action-effect`, `auth-visibility`, …) with its
spec template. The durable asset that transfers across projects.
_Avoid:_ "individual feature", "preset".

**oracle** — what decides a criterion's verdict. Three kinds: **mechanical** (deterministic
script), **model** (LLM-as-judge, probabilistic), **human** (manual).
_Avoid:_ "hard/soft/human" (informal), "validator".

**condition** — an abstract precondition forced before observing (`success`, `api-error`, `slow`,
`offline`, …). The *condition vocabulary* is the hard core: abstract enough to be universal,
concrete enough for each adapter to force.
_Avoid:_ "injection", "mock", "scenario".

**observation** — the signal measured to decide (a network request, DOM state, timing, screenshot).
_Avoid:_ "result".

**verdict** — the per-criterion output: `pass` / `fail` / `not-applicable` /
`unresolved` + an **actionable** reason (written for the agent to fix) + evidence.
`not-applicable` is a proved domain mismatch; `unresolved` is missing required proof and
makes the aggregate inconclusive.
_Avoid:_ "test result", "report" (a report is the presentation of the verdict).

**acceptanceScore** — passed / decided verdicts, in [0,1], or null when nothing was
decided. It is diagnostic; hosts accept only the aggregate all-pass outcome, never a
lowered score threshold.
_Avoid:_ "coverage" (coverage is about code — a different concept).

**adapter** — the per-ecosystem implementation of the *mount / inject condition / observe*
contract (the equivalent of a language server in LSP). React/Vitest/MSW is the first.
_Avoid:_ "plugin", "driver".

**escape** — a defect that slipped past the verifiers and was found later (in prod, by a human).
**escape accrual** = every escape becomes a new criterion → the ruler converges empirically.
_Avoid:_ generic "bug".

**substrate** — the ENGINE a criterion needs to be decided (`static`, `dom`, `http`, `style`,
`geometry`, `model`) — the layered-determinism axis: the cheapest engine that can decide it.
_Avoid:_ "platform", "environment".

**seam** — a hook the subject already has that the adapter drives or observes (how to mount,
which endpoint, which control). A criterion's **`requires`** names the seam that must be
declared for it to apply. Genuine subject-shape mismatch is `not-applicable`; a seam
required by the declared obligation but unavailable at execution is `unresolved`.
_Avoid:_ "config", "option".

**probe** — the adapter-built observation surface a mechanical oracle speaks through:
`act()` (drive the subject under the condition) + `expect` (the archetype's assertion
vocabulary). The probe hides the substrate plumbing; archetypes read in acceptance language.
_Avoid:_ "driver", "fixture".

**judge** — the injectable decider for `model` oracles (an LLM behind a rubric). Fail-closed:
no parseable verdict = fail, never a silent pass. Absent judge = `unresolved`, so the
aggregate cannot be green.
_Avoid:_ "AI", "grader".

**version (archetype / protocol)** — archetypes version independently as their criteria
evolve; `protocolVersion` versions the data model + vocabularies. Every verdict is stamped
with both, so a historical verdict names the exact ruler that produced it.
