# Assay.Ex

Elixir reference implementation of the Acceptance Verification Protocol for the
`http` substrate. It reads the same catalog bytes as `protocol/catalog.json`
(`priv/catalog.json`, guarded by a byte-equality test) and binds mechanical
oracles to these archetypes:

| Archetype | Criteria |
| --- | --- |
| `access-control` | `requires-authentication` |
| `authorization` | `own-resource-only`, `role-required`, `server-is-authoritative` |
| `lifecycle-gate` | `gate-enforced-server-side` |
| `request-idempotency` | `idempotency-key-honored` |
| `resource-uniqueness` | `rejects-duplicate` |
| `money-integrity` | `split-invariant` |

Every other catalog criterion is `unresolved` here, so a verdict is never
greener than this adapter can prove.

```elixir
verdict =
  Assay.run(Assay.LifecycleGate, "booking.check_in",
    %Assay.LifecycleGate.Subject{
      ready_transition_path: "/api/bookings/#{paid}/check-in",
      unmet_transition_path: "/api/bookings/#{requested}/check-in",
      bearer: host_token
    },
    transport: Assay.Http.plug(MyAppWeb.Endpoint)
  )

Assay.Verdict.require_accepted!(verdict)
Assay.Verdict.to_map(verdict) # the portable verdict shape
```

Transports: `Assay.Http.plug/1` calls a Plug or Phoenix endpoint in process (no
port; `plug` is an optional dependency), `Assay.Http.httpc/1` reaches a real
server, and any function from a request map to a response map works. Calibration
lives in `test/calibration_test.exs`: each oracle passes a correct in-memory
server and fails a vulnerable one.

```sh
mix test --cover   # 95% line coverage threshold (mix.exs)
```
