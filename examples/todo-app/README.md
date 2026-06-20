# Assay example — Todo app (React + Node)

A small but real full-stack todo app, used to validate Assay against an actual component (not a
repro stub). Self-contained package so it never bloats the library's dependencies.

## Run it for real

```bash
npm install
npm run server   # zero-dependency Node backend on http://localhost:8787
npm run dev      # Vite frontend (in another terminal)
```

## Verify it with Assay

```bash
npm test            # runs the action-effect archetype against the add-todo flow
npx assay verify    # same run via the Assay command — prints the verdict
```

The verification file is a single declarative `defineVerification(...)` call — no
`describe/it/expect`. `assay verify` is a thin wrapper over Vitest (ADR 0001).

Assay mounts the **same** `TodoApp` component, forces network conditions through MSW (success /
api-error), and checks the `action-effect` criteria:

- `fires-primary-effect` — clicking **Add** fires the real `POST /todos` (no no-op).
- `no-phantom-success` — on a failed add, the draft survives and an error shows.

`assay` / `assay/react` resolve to the library source via a Vite alias (the library is
unpublished). See `assay/todo.subject.tsx` for how a real component declares its seams, and
`assay/todo.assay.test.ts` for the run.

> Try breaking the app to see Assay catch it: in `src/TodoApp.tsx`, clear the draft *before*
> `await addTodo(...)`, or drop the `catch` that sets the error — `npm test` turns red on
> `no-phantom-success`.
