namespace Assay.Net;

// GENERATED ONCE from the protocol artifacts at the authority handover (2026-07-02) — since
// then THIS FILE is the source. Do not regenerate it from the JSON: the JSON is generated
// from HERE (ASSAY_WRITE_PROTOCOL=1 dotnet test --filter CatalogSync).

/// <summary>
/// THE SOURCE of the neutral AVP catalogs. The authority migration (decided 2026-06-21):
/// the .NET side LEADS the contract — new archetypes and criteria are born here, the
/// committed <c>protocol/*.json</c> artifacts are emitted from this source
/// (<see cref="CatalogEmitter"/> + the CatalogSync drift guard), and the JS implementation
/// conforms to the emitted artifact. Executors stay split by substrate: .NET runs the
/// backend tier (http/native), Assay JS runs the frontend tier (dom/style/geometry/model).
/// </summary>
public static class CatalogSource
{
    /// <summary>The BEHAVIOUR catalog source — emitted as <c>protocol/catalog.json</c>.</summary>
    public static ProtocolCatalog Behaviour { get; } = new(
        "AVP",
        "0.2.0",
        ["mechanical", "model", "human"],
        [
        new("action-effect", "0.1.0",
            [
                new("fires-primary-effect", "The action fires its primary effect; no visible action is a no-op.", "mechanical", "invariant", new("success"), SeenIn: ["615ed1a7", "92d99ad2"]),
                new("no-phantom-success", "On failure, the user input persists and an error is visible — never a phantom success.", "mechanical", "invariant", new("api-error"), Requires: "input", SeenIn: ["04677bf9"]),
                new("error-is-specific", "On failure, the error message names the real problem and a next step — not a generic \"something went wrong\".", "model", "invariant", new("api-error"), Requires: "input"),
                new("projections-converge", "After a successful mutation, sibling projections of the data (lists, badges, counts) reflect the change without a manual reload.", "mechanical", "invariant", new("success"), Requires: "projection", SeenIn: ["b9659b46", "5a0f2acb"]),
                new("request-accepted", "The request the UI sends is well-formed enough for the backend to accept it — no 400 from a malformed body (e.g. a datetime where a date-only field is expected).", "mechanical", "invariant", new("success"), Requires: "contract", SeenIn: ["c1849234"]),
                new("idempotent-retry", "A retry after a partial failure does not duplicate the effect — the same logical action fires once.", "mechanical", "invariant", new("retry"), Requires: "retryable", SeenIn: ["0188869f"]),
                new("single-flight", "A fast double-activation fires the effect once, not twice: a primary action guards itself while in flight (disables/locks on submit) so a double-click does not create a duplicate. Distinct from idempotent-retry — no failure is involved, only concurrency of clicks.", "mechanical", "invariant", new("double-activate"), Requires: "singleFlight", SeenIn: ["calcom:d7226fc3", "calcom:5b50a469", "documenso:56683aa9"]),
                new("survives-token-refresh", "An expired token mid-action recovers via a refresh-and-retry instead of erroring the user.", "mechanical", "invariant", new("token-expired"), Requires: "refresh", SeenIn: ["b4b0fc07"]),
                new("cache-cleared-on-identity", "Signing in/out wipes the prior identity's cached rows: after an identity switch, the previous account's data never feeds the new session — the UI shows the new identity's data, not the old.", "mechanical", "invariant", new("success"), Requires: "identity", SeenIn: ["documenso:8fca029d", "documenso:d2976cb1"]),
                new("optimistic-reconcile", "An optimistic update reconciles to the server's authoritative value: when the response differs from the optimistic guess, the UI settles on the server's truth — a count-based optimistic state never drifts permanently.", "mechanical", "invariant", new("success"), Requires: "reconcile", SeenIn: ["documenso:eb45d1e5", "documenso:ed7a0011"]),
            ],
            "An action produces its real effect — no visible control is a no-op, failures tell the truth."),
        new("data-honesty", "0.1.0",
            [
                new("no-fixture-fallback", "When the API returns no rows, the UI renders the empty state — it never falls back to fixture/demo rows.", "mechanical", "invariant", new("empty"), SeenIn: ["8ec5dae5", "74f546d1"]),
                new("no-fabricated-media", "A missing image renders a neutral placeholder — never a stock photo or a randomly generated face.", "mechanical", "invariant", new("partial"), Requires: "media", SeenIn: ["dfb23261"]),
                new("no-raw-id-flash", "A detail view renders resolved data (a name) or a skeleton — never a raw entity id flashed before the name resolves.", "mechanical", "invariant", new("success"), Requires: "detail", SeenIn: ["projp:ce04d0f", "projp:33a0d5a"]),
                new("count-matches-source", "The number of items rendered equals the number the API returned — a client-side filter or fixture merge never silently drops or invents rows.", "mechanical", "invariant", new("success"), Requires: "count", SeenIn: ["documenso:b8e08e88", "documenso:5f4e0ccf"]),
            ],
            "Rendered data traces to a real source — never fixtures, stock media, or invented rows."),
        new("persona-scoped-visibility", "0.1.0",
            [
                new("no-cross-persona-affordance", "Rendered as one actor, no affordance scoped to another actor (or tier) is visible or reachable.", "mechanical", "invariant", new("success"), SeenIn: ["16c6cd43", "1e6ba089", "projf:5512811"]),
                new("no-cross-persona-route", "A route scoped to one actor refuses another actor at the guard: opened as actor X, an actor-Y route redirects X to its own area — it never renders Y's screen.", "mechanical", "invariant", new("success"), Requires: "router", SeenIn: ["documenso:2ba0f48c", "bitwarden:e4359f071"]),
            ],
            "An actor sees and reaches only the affordances/routes of its role."),
        new("navigation-integrity", "0.1.0",
            [
                new("target-resolves", "Every navigation affordance targets a registered route; no tap lands on not-found.", "mechanical", "invariant", new("success"), Requires: "routes", SeenIn: ["287ab352", "2a3f9251", "projp:7ba900d"]),
                new("nested-renders", "Navigating to a nested route renders its content — the parent layout renders its outlet, not a blank screen.", "mechanical", "invariant", new("success"), Requires: "router", SeenIn: ["projp:37af286", "projp:039aaf2"]),
                new("back-has-fallback", "Back is never a dead no-op: opened deep with no history, it lands on a real fallback instead of doing nothing.", "mechanical", "invariant", new("success"), Requires: "router", SeenIn: ["3aa1c80a"]),
                new("required-params-guarded", "A route that needs a param redirects to a real parent when the param is absent or empty — it never renders the detail with an undefined/empty param (a ghost screen).", "mechanical", "invariant", new("success"), Requires: "router", SeenIn: ["documenso:184cbd67", "documenso:04b1ce1a"]),
                new("no-redirect-loop", "A guard/redirect resolves in finitely many hops: opened where a guard fires, the router settles on a real screen — it never bounces between routes forever (a replace-in-effect storm).", "mechanical", "invariant", new("success"), Requires: "router", SeenIn: ["documenso:849885b5", "documenso:ef79eb3c"]),
            ],
            "Every affordance leads somewhere real — no dead ends, loops, or ghost params."),
        new("mount-stability", "0.1.0",
            [
                new("settles-without-storm", "Mounting a screen settles to a bounded number of requests — no refetch/redirect storm that freezes the screen.", "mechanical", "invariant", new("success"), SeenIn: ["e6c81abe", "projp:626c8ce"]),
            ],
            "Mounting is quiet and convergent — no request storms or render loops."),
        new("authorization", "0.1.0",
            [
                new("own-resource-only", "A write resolves the target scoped to the caller; another account's id is refused (401/403/404), never a cross-account write.", "mechanical", "invariant", new("success"), Requires: "ownership", SeenIn: ["1db3c2fd", "bitwarden:0ad7a10c"]),
                new("role-required", "An endpoint enforces the role its operation implies; a privileged op called as a lesser role is refused — \"any authenticated\" is not a policy.", "mechanical", "invariant", new("success"), Requires: "role", SeenIn: ["d36af822", "gitea:171df0c9"]),
                new("server-is-authoritative", "The server records its own truth (price, version, quantity), never the client's word for it: writes that send a tampered value are recorded identically, as the server-resolved value.", "mechanical", "invariant", new("success"), Requires: "authority", SeenIn: ["bitwarden:ae5508d14", "bitwarden:3b5bb7680"]),
            ],
            "A caller acts only on resources it owns, with the role the operation implies."),
        new("access-control", "0.1.0",
            [
                new("requires-authentication", "A protected endpoint refuses an unauthenticated request (401/403) — it is never silently reachable without a credential. The baseline guard every [Critical] authenticated slice must hold; richer authorization (own-resource-only, role-required) layers on top.", "mechanical", "invariant", new("api-error")),
            ],
            "A protected endpoint refuses unauthenticated callers."),
        new("integration-integrity", "0.1.0",
            [
                new("webhook-signature-verified", "An inbound webhook with a forged or absent signature is rejected; only an authentically-signed callback is accepted and allowed to mutate state.", "mechanical", "invariant", new("success"), Requires: "webhook", SeenIn: ["692d85af", "documenso:3887aa67"]),
                new("redirect-urls-bound", "A checkout/OAuth flow binds its return URLs to the real environment: every required transition (success, failure) is present, an absolute http(s) URL, and never a placeholder, relative path, or dev host.", "mechanical", "invariant", new("success"), Requires: "checkout", SeenIn: ["bitwarden:aa1665065", "bitwarden:004e3c58e"]),
                new("callback-resolves-entity", "An inbound callback carries enough to resolve the domain entity it concerns: a callback with a missing or unknown reference is refused, never accepted and silently dropped or applied to the wrong entity.", "mechanical", "invariant", new("success"), Requires: "resolve", SeenIn: ["documenso:a99bdf5e", "documenso:8fbace0f"]),
            ],
            "External callbacks are verified, resolvable, and bound to the real environment."),
        new("second-order-effects", "0.1.0",
            [
                new("notifies-all-parties", "Every state transition notifies every party it concerns — both sides of a booking, both ends of a message — not one party or none.", "mechanical", "invariant", new("success"), SeenIn: ["81c919ed", "fbc56236"]),
            ],
            "A state transition fires ALL its downstream effects (every party notified)."),
        new("money-integrity", "0.1.0",
            [
                new("split-invariant", "A money split sums to the whole, exact to the cent: over every total, platform + host === total, each share is non-negative, and the platform share matches the policy fraction to the cent — no float-rounding leak.", "mechanical", "invariant", new("success"), Requires: "split", SeenIn: ["bitwarden:2e0e10307", "bitwarden:6d69c9bb9"]),
                new("amount-rendered-exact", "A money amount is displayed at the currency's exact precision: the rendered string equals the value formatted to its minor units — no float artifact (0.30000000000000004), no dropped or extra decimals (10.5 / 10.5000 for 10.50), no wrong rounding. Format from integer minor units, never raw float arithmetic.", "mechanical", "invariant", new("success"), Requires: "amount-display", SeenIn: ["firefly:797064a1", "firefly:d55cc03e", "firefly:ebc7ea0e"]),
            ],
            "Money is exact at rest and in display — splits sum to the whole, no float artifacts."),
        new("lifecycle-gate", "0.1.0",
            [
                new("gate-enforced-server-side", "The server enforces the transition's precondition: a transition requested on a resource whose precondition is unmet is refused (4xx), and a ready resource's transition still succeeds — the FE gate is a courtesy, not the guard.", "mechanical", "invariant", new("success"), Requires: "transition", SeenIn: ["documenso:6e09a470", "bitwarden:43d14971f"]),
                new("blocked-action-is-disabled", "When a precondition is unmet, the FE disables the action and says why — it does not offer a live control that will fail (e.g. publishing offered on an incomplete listing).", "mechanical", "invariant", new("success"), Requires: "blocked", SeenIn: ["documenso:41ed6c9a", "documenso:6d754acf"]),
            ],
            "A transition is gated on its real preconditions, server-side, with the FE disabled+explained."),
        new("temporal-integrity", "0.1.0",
            [
                new("zoned-to-user", "A displayed instant is rendered in the user's timezone: a stored UTC timestamp near a day boundary shows the user's local calendar date, not the UTC/server/ambient date — no off-by-one day.", "mechanical", "invariant", new("success"), Requires: "instant", SeenIn: ["documenso:22fd1b5b", "calcom:c1d0a6bb", "calcom:d70fa462"]),
                new("floating-date-not-shifted", "A date-only value (an expiry date, a birthday — no time, no zone) is displayed as authored: it is never zone-shifted a day by a round-trip through `new Date()` / `dayjs.tz()`. A floating date has no timezone; render its calendar parts, don't localize it.", "mechanical", "invariant", new("success"), Requires: "floating-date", SeenIn: ["calcom:26e85823", "calcom:f7b2f276", "documenso:22fd1b5b"]),
            ],
            "Time renders in the user's zone; date-only values are never zone-shifted."),
        new("pagination-integrity", "0.1.0",
            [
                new("pages-cover-the-set", "Paging through the entire list yields every item exactly once: the union of all pages equals the full set — nothing dropped at a page boundary, nothing duplicated across pages, nothing stranded by an unstable sort.", "mechanical", "invariant", new("success"), Requires: "paging", SeenIn: ["documenso:7d257236", "documenso:0488442", "calcom:367e2666"]),
            ],
            "Paging the whole list yields every item exactly once."),
        new("render-resilience", "0.1.0",
            [
                new("survives-malformed-data", "Rendering the surface with the empty/null/malformed data it can actually receive does not throw: it degrades to a fallback or empty state instead of crashing the screen. A guard for a happy-path shape is not optional — the real data is not always the fixture.", "mechanical", "invariant", new("success"), Requires: "malformed", SeenIn: ["calcom:000324c0", "calcom:013e6143", "documenso:43fe5584"]),
            ],
            "A surface degrades gracefully on bad data — it never white-screens."),
        new("request-idempotency", "0.1.0",
            [
                new("idempotency-key-honored", "A mutation carrying an idempotency key is applied at most once: two requests with the SAME key yield one resource (the original, replayed), and a request with a DIFFERENT key yields a distinct resource. Persist the key and replay on a repeat — never re-create, never dedup regardless of the key.", "mechanical", "invariant", new("success"), SeenIn: ["calcom:d85e0b51", "documenso:3887aa67", "documenso:31be5489"]),
            ],
            "A mutation with an idempotency key applies at most once."),
        new("credential-authority", "0.1.0",
            [
                new("rejects-invalid-credentials", "An authentication endpoint denies invalid credentials and never issues a token on the deny path — a silent accept (a token for a wrong credential) is an auth bypass.", "mechanical", "invariant", new("api-error")),
                new("issues-token-on-valid", "An authentication endpoint issues a session token for valid credentials.", "mechanical", "invariant", new("success")),
            ],
            "An auth endpoint denies invalid credentials and issues tokens only on valid ones."),
        new("token-rotation", "0.1.0",
            [
                new("rotates-on-refresh", "Exchanging a valid refresh token mints a NEW refresh token (rotation), never reissues the same one.", "mechanical", "invariant", new("success")),
                new("replay-burns-family", "Replaying an already-rotated (spent) refresh token is rejected AND revokes the whole token family — a leaked token cannot outlive its rotation (theft detection).", "mechanical", "invariant", new("double-activate")),
            ],
            "Session tokens rotate and expire the way the flow promises."),
        new("resource-uniqueness", "0.1.0",
            [
                new("rejects-duplicate", "Creating a resource whose unique key already exists is rejected (a conflict) — the second create of the same key must fail, never silently duplicate (a duplicate breaks the invariant the key holds, e.g. one-human-one-account).", "mechanical", "invariant", new("double-activate")),
            ],
            "A uniqueness rule holds server-side — duplicates are refused."),
        new("submission-gate", "0.1.0",
            [
                new("gate-enforced-on-submission", "The server enforces the precondition of a body-bearing submission: the SAME well-formed payload is accepted (2xx) on a resource whose precondition is met (ready) and refused (4xx) on one whose precondition is unmet. The ready acceptance proves the payload is well-formed, so the unmet refusal is the gate firing on the precondition — not the body being rejected. A required body is never a key past the gate; the FE form-gate is a courtesy, the server is the guard. The body-bearing sibling of lifecycle-gate's gate-enforced-server-side, for a mutation a body-less probe cannot reach.", "mechanical", "invariant", new("success")),
                new("gate-enforced-on-body-target", "The server enforces the precondition of a body-bearing mutation where the discriminating resource id is carried in the body, not the URL. Two submissions to the same endpoint carry bodies of the same shape but targeting different resource ids: one whose precondition is met (ready), one whose precondition is unmet. The ready submission is accepted (2xx); the unmet submission is refused (4xx). The gate fires on the body-carried id — FE form-gating is a courtesy; the server is the guard. Covers patterns like POST /charges or POST /request where the target resource is identified by a body field such as transactionId or serviceId.", "mechanical", "invariant", new("success")),
            ],
            "A body-bearing submission is gated on its precondition; a valid body is never a key past the gate."),
        ],
        ConditionAxes: new Dictionary<string, IReadOnlyList<string>>
        {
            ["fault"] = ["success", "api-error", "slow", "offline"],
            ["data"] = ["empty", "partial"],
            ["interaction"] = ["retry", "double-activate", "token-expired"],
        });

    /// <summary>The DESIGN catalog source — emitted as <c>protocol/design-catalog.json</c>.</summary>
    public static ProtocolCatalog Design { get; } = new(
        "AVP",
        "0.2.0",
        ["mechanical", "model", "human"],
        [
        new("token-adherence", "0.1.0",
            [
                new("uses-tokens-only", "Every colour, spacing, radius and font size the surface renders is a value from the design token scale — no raw hex, no off-scale spacing/radius, no hard-coded font size. A value off the scale has no theme pair and drifts the moment the system changes.", "mechanical", "invariant", new("success"), Substrate: "style", Requires: "tokens", SeenIn: ["dd834c98", "3988ad19"]),
            ],
            "Every rendered colour/space/radius/font is a design-token value."),
        new("theme-parity", "0.1.0",
            [
                new("flips-with-theme", "Across every theme, every colour the surface renders belongs to the ACTIVE theme's token scale: a value with no pair in that theme (a raw palette step, a hard-coded light colour in dark mode) is the escape — it renders wrong, like a light badge on a dark surface. Resolve colours through theme-aware semantic tokens, not raw values.", "mechanical", "invariant", new("success"), Substrate: "style", Requires: "theme", SeenIn: ["dd834c98", "67ac3fcd", "6ac555ae"]),
            ],
            "Every colour resolves through the ACTIVE theme — nothing renders stuck in the other theme."),
        new("type-hierarchy", "0.1.0",
            [
                new("hierarchy-holds", "Visual type size matches the semantic heading level: a more-important heading (lower level number) renders strictly larger than any less-important heading present, and two headings of the same level render at the same size. No inversion (a section title bigger than the page title), no two titles competing at the same weight.", "mechanical", "invariant", new("success"), Substrate: "style", Requires: "headings", SeenIn: ["25b16a79", "9b609f8c", "7a2dfc74"]),
            ],
            "Heading/type sizes step down the scale in order."),
        new("composition-canonical", "0.1.0",
            [
                new("canonical-composition", "Every declared landmark slot is present, in the declared order, and is the canonical design-system component — not a hand-rolled fork. The back affordance comes before the title, the screen icon is present, and each slot is the DS component it should be (a bespoke element where a DS one exists is the escape).", "mechanical", "invariant", new("success"), Substrate: "style", Requires: "composition", SeenIn: ["897c6aa0", "2c9376e7", "c596531b"]),
            ],
            "Landmark slots are built from the canonical DS components."),
        new("state-coverage", "0.1.0",
            [
                new("states-visually-distinct", "Each declared interactive state (disabled, loading, …) renders visually distinct from the default state — a disabled control is dimmed/muted, a loading control shows a spinner. A state that is set but renders identically to default is the escape: it is not perceivable.", "mechanical", "invariant", new("success"), Substrate: "style", Requires: "states", SeenIn: ["c86c36b3", "f842d42c", "876f7734"]),
            ],
            "Interactive states (disabled/loading/…) are visually distinct from default."),
        new("color-contrast", "0.1.0",
            [
                new("contrast-sufficient", "Every text/background pair meets the WCAG AA contrast minimum (4.5:1 normal text, 3:1 large/bold): the computed ratio of the text colour against its effective background is sufficient. An on-scale but low-contrast pairing (muted text on white) or a theme-stranded value (a light colour on a light surface) is the escape — the text is hard or impossible to read.", "mechanical", "invariant", new("success"), Substrate: "style", Requires: "text", SeenIn: ["dd834c98"]),
            ],
            "Text clears the WCAG contrast ratio against its effective background."),
        new("spacing-rhythm", "0.1.0",
            [
                new("rhythm-holds", "Nested containers follow the spacing rhythm: each container's padding is a value from the spacing scale, a deeper container is never roomier than the one enclosing it (outer ≥ inner, strictly decreasing with depth), and two containers at the same depth share the same padding. An inverted, off-scale, or inconsistent rhythm is the escape.", "mechanical", "invariant", new("success"), Substrate: "style", Requires: "nesting", SeenIn: ["b885222b", "25b16a79", "dc4dd857"]),
            ],
            "Declared spacing values sit on the spacing scale."),
        new("accessible-name", "0.1.0",
            [
                new("controls-have-accessible-name", "Every interactive control (button, link, input, select, textarea, or ARIA-roled widget) that reaches the accessibility tree exposes a non-empty accessible name — from aria-labelledby, aria-label, an associated <label>, its visible text (excluding aria-hidden subtrees), or title. An icon-only control whose only content is an aria-hidden glyph, or an input with only a placeholder, is the escape: a screen reader announces the role and nothing more.", "mechanical", "invariant", new("success"), Substrate: "dom", Requires: "interactive", SeenIn: ["8cace7f7", "a0e4580f", "bf9be591", "02a86f1d"]),
            ],
            "Every control exposes an accessible name."),
        new("image-alt", "0.1.0",
            [
                new("images-have-text-alternative", "Every informative image (`<img>` or `role=\"img\"`) exposes a text alternative — a non-empty `alt`, `aria-label`, `aria-labelledby`, or `title`. An image deliberately marked decorative (`alt=\"\"`, `aria-hidden=\"true\"`, or `role=\"presentation\"`/`\"none\"`) is correct and is not flagged. The escape is an image with NO text alternative and NO decorative marking: it reaches the accessibility tree unnamed. Add descriptive `alt`, or mark it decorative if it carries no meaning.", "mechanical", "invariant", new("success"), Substrate: "dom", Requires: "images", SeenIn: ["fa20f19e", "55113f20", "df9c603a"]),
            ],
            "Every meaningful image has a text alternative."),
        new("input-purpose", "0.1.0",
            [
                new("personal-fields-declare-purpose", "Every input that collects a known kind of personal data — identified unambiguously by its type (`email`/`tel`/`password`) or a high-confidence name/id (email, phone, first/last name, street, postal code, organization, credit card) — declares an `autocomplete` attribute (WCAG 1.3.5 Identify Input Purpose). A field whose purpose is opaque (a search box, an arbitrary text field) gets no opinion, and any present `autocomplete` (even `off`) is the author's decision; the escape is a personal-data field with NO autocomplete at all — no autofill, no programmatic purpose.", "mechanical", "invariant", new("success"), Substrate: "dom", Requires: "inputs", SeenIn: ["calcom:24422", "calcom:21065", "calcom:6705", "calcom:2645"]),
            ],
            "Personal-data fields declare their purpose (autocomplete)."),
        new("layout-integrity", "0.1.0",
            [
                new("content-fits", "No element clips its own content: for every element whose overflow is hidden/clipped, the content fits the box (scrollWidth ≤ clientWidth, scrollHeight ≤ clientHeight). Content cut off at the edge of a fixed-size container is the escape — give it room, wrap, or truncate with an ellipsis intentionally.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["calcom:635c1feb", "calcom:a1124ede", "calcom:e8e50b70"]),
            ],
            "No unintended overflow or overlap in the real layout."),
        new("layer-integrity", "0.1.0",
            [
                new("no-unintended-overlap", "Declared in-flow regions do not visually overlap: the bounding boxes of the regions that should stack/sit beside each other do not intersect. A control sitting on top of another (a button over a textarea, text over a button) — from absolute positioning, a negative margin, or a transform — is the escape.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["calcom:44ccc72f", "calcom:794046cf", "calcom:0e900a73"]),
            ],
            "Layered regions (modals, dropdowns) stack and occlude correctly."),
        new("responsive-integrity", "0.1.0",
            [
                new("holds-across-breakpoints", "The surface holds across breakpoints: rendered at each declared viewport width, the page never overflows horizontally (documentElement.scrollWidth ≤ viewport width). A surface that fits wide but pushes the page past a narrow viewport — a fixed-width row, an oversized block, or nowrap text that never reflows — is the escape. Let it wrap, cap widths, or add the breakpoint that the mobile layout is missing.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["mastodon:98ec6991", "mastodon:861625fd", "gitea:b9f69b4a"]),
            ],
            "The layout holds across the declared breakpoints without horizontal overflow."),
        new("reading-order-integrity", "0.1.0",
            [
                new("dom-order-matches-visual", "The DOM order of the landmark items matches their visual reading order: reading the items top to bottom and (within a row) left to right yields the same sequence as their order in the DOM. CSS that moves an element visually (flex `order`, column-reverse, float, absolute position) without moving it in the DOM is the escape — it desyncs keyboard/screen-reader order from what is seen. Reorder the DOM to match the layout instead of reordering with CSS.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["mastodon:d20d0492"]),
            ],
            "Visual order matches DOM/reading order."),
        new("rtl-integrity", "0.1.0",
            [
                new("directional-icons-mirror", "Every direction-dependent icon mirrors correctly with the writing direction: under dir=rtl its computed transform is horizontally flipped (so a back/forward arrow points the right way), and under dir=ltr it is not flipped. A directional icon left unmirrored under RTL — or mirrored unconditionally — is the escape. Scope the horizontal flip to `[dir=\"rtl\"]` and apply it to every directional glyph.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["mastodon:51345e51", "mastodon:af157939d"]),
            ],
            "The layout mirrors correctly under RTL."),
        new("tap-target-integrity", "0.1.0",
            [
                new("targets-meet-minimum-size", "Every interactive control meets the minimum tap-target size: its rendered box is at least 44×44 CSS px on both axes (WCAG 2.5.5). A bare icon button, a thin link, or a control shrunk to its glyph is the escape — too small to reliably tap on touch or for users with motor impairments. Give the control padding or an explicit min-width/min-height.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["mastodon:2b93a221", "mastodon:a8330be9", "gitea:8703b6c9", "gitea:06eaf74e"]),
            ],
            "Touch targets meet the minimum hit area."),
        new("layout-shift-integrity", "0.1.0",
            [
                new("reserved-space-stable", "Async content reserves its space: an element that loads or mounts late (image, widget, banner) does not move the content below it — a downstream anchor keeps the same position between the loading and loaded states. Content that jumps when media arrives is the escape (cumulative layout shift). Reserve the box up front with explicit dimensions, aspect-ratio, or a fixed-height skeleton.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["mastodon:511e10df", "gitea:32fdfb0b", "documenso:1a23744d"]),
            ],
            "Loading→loaded transitions do not shift settled content."),
        new("focus-visible-integrity", "0.1.0",
            [
                new("focus-is-visible", "Every interactive control paints a visible focus indicator when focused (WCAG 2.4.7): focusing it must change its outline, box-shadow, border, or background to something a sighted keyboard user can actually see. The escape is removing the UA outline (`outline: none` / `focus:outline-none`) without adding a replacement — or adding one that paints nothing (a transparent ring, a zero-width outline) or that only triggers on `:hover`, not `:focus`. Add a visible focus ring.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["calcom:7393ba1d1", "calcom:689150d78", "calcom:c1b41d825"]),
            ],
            "Keyboard focus is visible on every interactive element."),
        new("truncation-integrity", "0.1.0",
            [
                new("overflowing-text-is-truncated", "When text overflows its width- or height-constrained container, it must be handled gracefully: truncated with an ellipsis (`text-overflow: ellipsis`), clamped to N lines (`-webkit-line-clamp`), or made scrollable (`overflow: auto/scroll`). The escape is text that SPILLS out of its box (`overflow: visible`) over neighbouring content, or that is HARD-CLIPPED (`overflow: hidden`) with no ellipsis or clamp so the cut is invisible to the user. Add an ellipsis, a line-clamp, or a scroll affordance.", "mechanical", "invariant", new("success"), Substrate: "geometry", SeenIn: ["calcom:f63d70552", "calcom:22201cbc7", "calcom:3af6fee05"]),
            ],
            "Text truncates by design, never by accident."),
        new("icon-correctness", "0.1.0",
            [
                new("icon-fits-meaning", "Every icon’s meaning fits its control: the glyph a control shows matches the action or label it stands for — a back affordance uses a left chevron/arrow, a fork count a fork, a search a magnifier, a delete a trash. An icon that is semantically wrong or misleading for its label is the escape (a generic glyph where a specific one is expected, a stale icon left after the action changed).", "model", "invariant", new("success"), Substrate: "model", Requires: "render", SeenIn: ["gitea:edf0dfd1", "gitea:3102c04c", "mastodon:9576434d"]),
            ],
            "An icon's meaning fits the action it decorates (model-judged)."),
        ],
        CatalogName: "design",
        Substrates: ["static", "dom", "http", "style", "geometry", "model"]);
}
