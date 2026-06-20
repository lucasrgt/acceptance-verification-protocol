# Assay Design — acceptance verification for design fidelity

> Can we do for **design** what AVP does for behavior? Yes — and it's not a separate
> protocol. It's the **same** AVP protocol (subject / criterion / oracle / condition /
> verdict, the neutral `core/run.ts`) with a new **archetype catalog** and new **probe
> substrates**. Exactly how the React adapter and the HTTP adapter already coexist, and
> how Assay.NET is a sibling implementation — Assay Design is a sibling *adapter*.

## The thesis transfers verbatim

AVP's wager is "the determinism lives in the **verifier**, not the screen". "Is this
design done?" is subjective the same way "is this feature done?" is — until you
fabricate the judge. For design the judge already exists and has a name: **the design
system** — the tokens, the component registry, and the composition rules. A screen is
*correct* when every colour/space/radius/type it uses is a token from the scale, every
element is the canonical component (not a hand-rolled fork), and the composition obeys
the declared hierarchy. That is checkable, not a matter of taste.

The pun even survives: AVP = *acesso venoso periférico*; Assay Design taps the vein of
the **design system** and confirms the screen is faithful to it.

## Mined by error analysis, not taste

Same discipline as `docs/catalog.md`: every archetype comes from a real fix commit.
We mined the design-discrepancy fixes of three independently-built products (the
marketplace + project P + project F from `docs/transfer.md`) and one unrelated
non-Lazuli app (cal.com) for breadth.

| design escape class | marketplace | project P | cal.com (transfer) |
|---|--:|--:|--:|
| colour / token adherence | 19 | 10 | (84 theme) |
| theme parity (light/dark) | 6 | 1 | 84 |
| component consistency (one canonical, not a fork) | 1 | 9 | 14 |
| spacing / padding rhythm | 2 | 5 | 82 |
| typography / hierarchy | 2 | 4 | — |
| layer / z-index / overlay | 2 | 6 | 21 |
| responsive / breakpoint | 4 | 1 | 88 |
| icon correctness | 4 | 1 | 50 |
| contrast / a11y | 6 | 3 | 5 |
| overflow / overlap / misalign | 2 | 1 | 78 |

Two findings shape everything:

1. **The classes transfer hard.** cal.com (no shared framework, no shared design
   system) has the same shapes at scale — theme 84, responsive 88, spacing 82, overflow
   78, icon 50. Design fidelity is a property of *UI software*, not of one team.

2. **The distribution shifts with how codified the design system is.** The Lazuli apps
   already run a **static design-token doctor** (`LZFE012` design-tokens, `LZFE010`
   state-completeness) — so their *residual* runtime escapes skew to token/theme/
   composition (jsdom-reachable). cal.com, less codified, is dominated by **geometry**
   (overflow, overlap, responsive) that no DOM-only check can see. The more you codify
   the system as data, the more the remainder is pure layout — which is exactly the
   substrate boundary below.

Representative real escapes (faithful, the way the catalog was built):

- *"badge tones go semantic — the raw palette steps had no dark pair, rendering light
  badges in dark mode"* → **token-adherence** + **theme-parity** (raw palette step
  instead of a semantic token, which had no dark counterpart).
- *"drive data-theme off the effective theme so light mode flips every surface"* /
  *"theme toggle stuck on dark"* → **theme-parity**.
- *"consolidate hand-rolled tab bars into one `<TabBar>`"*, *"…confirm dialogs into one
  `<ConfirmDialog>`"*, *"…label-value fields into one `<Field>`"* → **composition-canonical**.
- *"every screen rides PageContainer + PageHeader — one padding, one type scale"* /
  *"identidade dos títulos — ícone da tela no page header e cor heading"* →
  **composition-canonical** + **spacing-rhythm** + **type-hierarchy** (this is the
  user's "back button above the blue XL title with the right icon", generalized).
- *"'Banheiro' uses a toilet icon, not a shower"* → **icon-correctness** (the icon must
  match its *meaning* — a genuine `model`-oracle case).
- *"modais padronizados — overlay bg-black/80 em todo o sistema"* / *"overlay the file
  input … stops breaking the host modal"* → **layer-integrity**.
- *"uniform page padding at every breakpoint"* → **spacing-rhythm** across breakpoints.

## The design archetype catalog (proposed)

Each is an **invariant** (holds over all states of the screen), mined from the escapes
above, with its cheapest deciding oracle.

| # | archetype | the invariant | oracle | substrate |
|---|---|---|---|---|
| 1 | **token-adherence** | every colour/space/radius/font is a **semantic token** from the scale — never a raw palette step or a hard-coded literal | static + mechanical | doctor / jsdom |
| 2 | **theme-parity** | every surface flips correctly across themes; no token lacks a dark pair, no surface is stuck | mechanical (matrix) | jsdom |
| 3 | **composition-canonical** | a UI element is the canonical DS component (one `<TabBar>`, one `<PageHeader>`), composed in the declared structure (back · icon · title, in order) — not a bespoke fork | static + mechanical | doctor / jsdom |
| 4 | **type-hierarchy** | headings/type come from the type scale, are monotonic, and one screen uses one scale; heading identity (level, colour) is consistent | mechanical | jsdom |
| 5 | **color-hierarchy-contrast** | emphasis colours follow the intended order (primary > secondary > muted) and every text/bg pair meets WCAG | mechanical (axe-core) | jsdom |
| 6 | **icon-correctness** | the icon is from the canonical set **and** matches its meaning (toilet ≠ shower) | static (set) + **model** (fit) | doctor / judge |
| 7 | **state-coverage** | every interactive element renders its states (hover/focus/disabled/loading/empty) on-token, none broken | mechanical (matrix) | jsdom |
| 8 | **spacing-rhythm** | padding/spacing is on-scale and consistent — uniform across breakpoints, correct nested ratio (e.g. 4×/2×/1×) | mechanical (geometry) | **browser** |
| 9 | **layer-integrity** | overlays/modals stack correctly; nothing bleeds over/under another; canonical overlay treatment | mechanical (geometry) | **browser** |
| 10 | **layout-integrity** | no overflow/clip/overlap at the target breakpoints; touch targets ≥ the minimum | mechanical (geometry) | **browser** |

The oracle mix answers the "is design too subjective to verify?" worry head-on: with
the design system as ground truth, **most of it is mechanical**. Only `icon-correctness`
(does the glyph fit the meaning) and a future `visual-balance` are genuinely `model`/
`human` — and those route to the existing `claudeJudge`.

## Substrates — "determinism is layered" applied to design

This is the answer to "a DOM simulator or something". There isn't one magic substrate;
the catalog routes each criterion to the **cheapest engine that can decide it** — the
same three-way split as `docs/catalog.md`:

- **STATIC (host doctor — already exists).** Hard-coded hex/spacing literals, a
  non-token value, a bespoke component where a DS one exists, an icon name off the
  registry. This is `LZFE012`/`LZFE010` territory — caught before runtime, *not* Assay
  Design's job to re-own. Assay Design *formalises the runtime half*, exactly as AVP
  does for behaviour.
- **RUNTIME · jsdom (RTL + `getComputedStyle`).** Resolved **colours, fonts, contrast,
  composition structure, theme matrix, state matrix.** jsdom *can* do these — they are
  computed-style + tree-shape, not geometry. Covers token-adherence, theme-parity,
  type-hierarchy, color-hierarchy-contrast (axe-core runs in jsdom), state-coverage,
  and the structural half of composition-canonical. This is where the Lazuli residual
  lives, so it's the **highest-ROI substrate to build first**.
- **RUNTIME · real browser (Playwright — the `proof` plugin already wires it).** Pure
  **layout geometry**: spacing ratios, overflow/clip, overlap, z-index stacking,
  touch-target size, responsive across breakpoints, and screenshot diffing for
  theme-parity. jsdom returns `offsetWidth = 0` and has no layout engine — there is no
  shortcut here. This is where cal.com's escapes (responsive 88, overflow 78) live.

Honest boundary: jsdom is the cheap DOM simulator and covers the *majority* of the
codified-system escapes; **geometry has no jsdom path** and requires the browser. Don't
force geometry into jsdom — route it.

## Architecture — reuse, not a fork

Same protocol, new adapter. Concretely:

- **Reused verbatim:** `core/dsl.ts` (archetype/criterion/oracle), `core/run.ts` (the
  neutral runner), `core/types.ts`, the verdict aggregation, `claudeJudge`.
- **New:** `src/archetypes/design/*` (the catalog above), a `subject` shape that
  declares the design seams (the **design system as data**: token set, component
  registry, composition rules), and **two adapters** — `adapter-react-style` (jsdom +
  computed style) and `adapter-browser` (Playwright). Both register in the same way the
  React/HTTP adapters do.
- **Ships as** `assay/design` — a sibling entry point, like `assay/react` and a future
  `assay/dotnet`. Not a separate repo, not a separate protocol.

## Prerequisite: the design system *as data*

The verifier is only as good as its ground truth. Assay Design needs the system
codified: a **token set** (the legal colours/spaces/radii/type — the Lazuli apps
already have this), a **component manifest** (which DS component each role maps to), and
**composition rules** (a screen header = back · icon · title, in order). Where this is
missing, codifying it is the highest-value first step — and the verifier then *is* the
proof the system is being respected. (This is precisely the cure for the theme/layout/
hierarchy discrepancy that motivated the idea.)

## Recommended build order

1. **Spike `token-adherence` over jsdom** — ✅ **DONE.** A surface with a raw hex /
   off-scale value fails; the same surface on tokens passes; mutation family (raw
   palette colour, off-scale bg/space/radius/font) **5/5 killed, false-alarm 0**.
   Proves the whole skeleton: the design subject (`src/adapter-design/`), the
   computed-style probe (jsdom resolves inline colours to rgb + px values — the
   token-membership check works), the archetype (`src/archetypes/token-adherence.ts`)
   and the token-set ground truth (`src/design/tokens.ts`), all running through the
   SAME neutral `core/run.ts` as the behaviour adapters. `bench/token-adherence.test.ts`.
2. Add the rest of the **jsdom tier** — highest ROI, no browser needed.
   - **theme-parity** — ✅ **DONE.** Renders the surface under each theme and asserts
     every colour is on the ACTIVE theme's scale; a light value stranded in dark is the
     escape. Mutation 4/4 (stuck bg, stuck text, all-light, raw step), false-alarm 0.
     Ground truth extended with per-theme colour scales (`themes`/`themeColorScale`).
     `bench/theme-parity.test.ts`.
   - **type-hierarchy** — ✅ **DONE.** Reads heading sizes + levels and asserts visual
     size matches semantic level (h1 > h2 > h3; same level, same size) — distinct from
     token-adherence's membership check. Mutation 4/4 (inverted title, equal-weight,
     subtitle-beats-title, inconsistent same-level), false-alarm 0.
     `bench/type-hierarchy.test.ts`.
   - **composition-canonical** — ✅ **DONE.** Reads the rendered `[data-slot]` landmarks
     and asserts they are present, in the declared order, and each the canonical DS
     component (via `data-ds`) — atoms/molecules/organisms: the back affordance above
     the title, the screen icon present, no bespoke fork. Mutation 4/4 (wrong order,
     missing icon, bespoke back, missing back), false-alarm 0.
     `bench/composition-canonical.test.ts`.
   - **state-coverage** — ✅ **DONE.** Renders default + each declared state and asserts
     each is visually distinct (the runtime sibling of LZFE010): a `disabled` button
     that isn't dimmed or a loading button with no spinner is the escape. Mutation 3/3
     (disabled-not-dimmed, loading-no-spinner, all-flat), false-alarm 0.
     `bench/state-coverage.test.ts`. **Design catalog: 5/5 detection, 20/20 mutants killed.**
   - Remaining jsdom: color-hierarchy-contrast (compute the WCAG ratio directly).
3. Stand up the **Playwright tier** for geometry (spacing-rhythm, layer-integrity,
   layout-integrity) — the only criteria with no jsdom path (offsetWidth = 0), reusing
   the `proof` plugin's browser harness. The next architectural step.
4. `icon-correctness` fit and any `visual-balance` via `claudeJudge`.

Built cheapest-substrate-first, each criterion closed *chaos → green* with a faithful
repro and a 100%-kill mutation family — the same loop that took the behaviour catalog to
39/39.
