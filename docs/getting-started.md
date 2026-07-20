# Getting started — verifying with Assay

Ten minutes per substrate. Everything below runs inside YOUR Vitest (JS) or xUnit (.NET) —
Assay is a library plus a thin `assay` bin, never a runner or a config file (ADR 0001).

## 1. React (DOM) — "the button actually does the thing"

```bash
npm i -D @aerofortress/assay vitest jsdom @testing-library/react @testing-library/user-event msw
```

Declare the feature's **seams** (what already exists) as a subject, pick the archetype,
and register the verification:

```ts
// features/send/send.subject.tsx
import type { ActionEffectSubject } from '@aerofortress/assay/react';
import { Composer } from './Composer';

export const sendMessage: ActionEffectSubject = {
  name: 'send-message',
  render: () => <Composer />,                                  // mount (with providers)
  endpoint: { method: 'POST', path: 'http://localhost/api/messages' }, // the REAL effect
  action: { role: 'button', name: /send/i },                   // what the user activates
  input: { role: 'textbox', name: /message/i },                // draft that must survive failure
  draftSample: 'hi!',
};
```

For a form that needs more than one field before submit, declare every draft instead of weakening the subject:

```ts
inputs: [
  { role: 'textbox', name: /wallet/i, value: '11111111-1111-4111-8111-111111111111' },
  { role: 'spinbutton', name: /amount/i, value: '50' },
]
```

Assay fills the complete form and, under failure, requires every declared draft to survive. The single-field
`input` + `draftSample` shape remains supported.

```ts
// features/send/send.assay.test.ts
import { actionEffect } from '@aerofortress/assay';
import { defineVerification } from '@aerofortress/assay/react/vitest';
import { sendMessage } from './send.subject';

defineVerification(actionEffect, sendMessage);
```

```bash
npx assay verify          # every *.assay.test.* file; --json for machine output; --help for more
```

Assay mounts the component, forces each criterion's condition through MSW (`success`,
`api-error`, `offline`, `double-activate`, …), and emits a verdict per criterion.
Criteria whose seam the subject doesn't declare are **skipped honestly** — declare more
seams (`projection`, `retryable`, `successMarker`, …) to arm more criteria.

## 2. HTTP — "the server actually enforces it"

No extra installs — `fetch` is the substrate. Point subjects at an environment YOU own
(local/staging with seeded data; see SECURITY.md):

```ts
import { verifyHttp } from '@aerofortress/assay/http';
import { authorization, formatVerdict } from '@aerofortress/assay';

const verdict = await verifyHttp(authorization, {
  name: 'quotes-api',
  // ownership seam: as account A, a resource of account B — must be refused
  request: { method: 'GET', url: `${base}/quotes/other-accounts-id`, headers: authAsA },
  // authority seam: tampered writes; the server must record ITS truth
  writes: [{ method: 'POST', url: `${base}/quotes`, body: { price: 1 }, headers: authAsA }],
  readRecorded: (b) => (b as { price: number }).price,
  serverTruth: 100,
});
console.log(formatVerdict(verdict));
```

In .NET the same criteria run via `Assay.Net` (`Runner.Run(Catalog.LoadDefault(), …)`),
including in-process over `WebApplicationFactory` — see [assay-net.md](assay-net.md).

## 3. Design — "it looks like the design system, everywhere"

**Style tier (jsdom):** tokens, themes, WCAG contrast, accessible names —

```ts
import { verifyDesign, tokens } from '@aerofortress/assay/design';
import { tokenAdherence } from '@aerofortress/assay';

await verifyDesign(tokenAdherence, { name: 'card', render: () => <Card /> }, {
  tokens: myDesignSystemTokens,   // YOUR token export replaces the demo ground truth
  checkComputed: true,            // also check class/stylesheet-styled values
});
```

**Geometry tier (your installed Chrome — no browser download):** overflow, responsive,
RTL, tap targets, layout shift —

```ts
import { openBrowser, verifyDesignBrowser } from '@aerofortress/assay/design/browser';
import { responsiveIntegrity } from '@aerofortress/assay';

const browser = await openBrowser();          // finds Chrome/Edge/Brave; CHROME_PATH overrides
const page = await browser.newPage();
await verifyDesignBrowser(responsiveIntegrity, { name: 'home', url: 'http://localhost:5173' }, page);
```

## 4. Your own criteria (off-catalog, ADR 0002)

Author domain invariants with the same DSL and pass `{ hooks }` to any verify entry —
they run through the same executor and verdict, and never touch the shipped catalog's
benchmark. Worked example: [`assay/test/custom-criterion.test.ts`](../assay/test/custom-criterion.test.ts).

## 5. The static half

`@aerofortress/eslint-plugin-assay` fails the lint when a feature file lacks a co-located
`*.assay.test.*` covering the archetypes its type demands — "did you even write a
verification?" is a static question. See
[`assay/eslint-plugin-assay/README.md`](../assay/eslint-plugin-assay/README.md).
