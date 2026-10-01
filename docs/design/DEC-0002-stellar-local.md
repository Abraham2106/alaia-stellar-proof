# DEC-0002 — Stellar + local, spec abierta

- Status: `accepted`
- Decider: planner (bootstrap)
- Date: 2026-10-01

## Decision

El dominio del repo es un proof ligado a **Stellar** que debe poder correr **en local**. Los detalles de protocolo, red, grader y API pública son `TBD` hasta `REQ-0001-product.md`.

## Why

Hay un spoiler de producto pero no hay requisitos. Inventar Soroban vs stellar-core vs pagos vs identity crearía split-brain el día que llegue la spec real.

## Consequences

- `FEATURE-PREPARATION.md` permanece `blocked`.
- `orchestration/orchestrate.ps1 spawn` de tasks `worker` debe fallar mientras el gate esté bloqueado.
- Hipótesis permitidas solo marcadas `shaky` (p. ej. “probablemente Rust”).

## Forbidden

Crates de relleno (`stellar-client`, `localnet-mock`) sin seam aceptado. Llamadas a mainnet como camino feliz. Mocks de RPC Stellar sin alarm.

## Cite in code

No hay código de producto todavía. Cuando exista:

```text
// DEC-0002: local Stellar only; no implicit public network
```
