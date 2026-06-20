# ADR 0001 — AVP stays a thin layer, not a framework

## Status
Accepted (2026-06-19)

## Context
AVP has a declarative authoring DSL (`archetype` / `criterion` / `mechanical|model|human`). DSLs
and convention kits tend to accrete into invasive frameworks — config, runners, plugin
lifecycles, eventually a compiler. The cautionary case is a sibling project: an AI-first
declarative metalanguage that grew into a full compiler + multi-target codegen + LSP + plugin
ecosystem (2,400+ commits). The concern: does AVP's DSL risk the same fate?

## Decision
AVP's contribution is the **dictionary** (the knowledge of what to check, per archetype) plus a
**calibrated benchmark** — not machinery. Concretely:

- The DSL is **pure sugar over a serializable data model**: `archetype()` emits a plain
  `Specification`. It compiles nothing, has no IR, generates no code.
- AVP **describes specs, never the app.** A metalanguage owns your source of truth and must
  generate it (→ compiler/framework). AVP **observes** an app written however you like; specs are
  a separate, deletable artifact beside your code. Same adjectives as the metalanguage
  ("declarative", "AI-first"), opposite mass: one *generates* the app, the other *verifies* it.
- **Ride the substrate, never rebuild it**: Vitest / MSW / axe-core / an LLM judge. No AVP test
  runner, no `avp.config`, no plugin lifecycle. The agent-facing CLI/MCP is a thin wrapper over
  the executor (`verify`), not a runner.
- **Grow vocabulary escape-driven**: a new `condition` or `expect.*` matcher is added only when a
  real criterion needs it. The core surface stays tiny; only the dictionary grows.

## Consequences
- AVP stays adoptable and non-invasive: delete it and the app still runs.
- Value compounds in the dictionary + benchmark, not in infrastructure.
- **Smell test (drift alarm):** if a change adds infrastructure instead of criteria — a config
  system, a runner, a plugin API, DSL control-flow, a compiler/IR — stop. That is the road to a
  framework, and it is out of scope.

## Non-goals
A test runner, a build/codegen step, a config/plugin system, a query language, an app scaffolder.
