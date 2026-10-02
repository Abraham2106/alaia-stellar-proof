# DEC-0015 — Grant, compuerta de tools y conformidad

- Status: `accepted`
- Decider: planner
- Date: 2026-10-02
- Supersedes: —

## Decision

ALAIA Verify 1 gana tres piezas, sin cargar un modelo y sin red pública.

Un **grant** es el receipt de una wallet `human`. Un pago de wallet `agent` solo puede salir `allow` de policy si trae ese grant y el destino, el activo y el monto caben dentro. Sin grant, la disposición no es `allow`.

La **compuerta de tools** clasifica `payment`, `changeTrust`, `setOptions` e `invokeContract` antes de cualquier modelo. `setOptions` niega con `signer_change_denied`. `invokeContract` niega con `contract_rail_closed`. `changeTrust` niega con `trustline_closed`. Esas tres no abren preguntas. Solo un `payment` que la policy ya permite queda marcado `questions: true`. El modelo que propuso la tool no autoriza.

La **conformidad** es un corpus `confirm` con oro fijo y un comparador de banda 0,15. No llama a Strands, a QVAC ni a la red. Si un id de vecino es el id del caso, la conformidad falla.

El hash canónico, en policy, en receipt y en laya, es SHA-256 hex de `JSON.stringify` sobre el valor con claves de objeto ordenadas recursivamente. Los arrays conservan orden.

## Why

El producto pasa de un judge único a un verificador que otra implementación puede fallar: el agente gasta contra un grant humano, la policy cierra las tools que este repo no construye, y la suite `confirm` es el estándar.

## Consequences

- T-020 posee `packages/policy/` únicamente.
- T-021 posee `packages/receipt/` únicamente. No cambia el hash del receipt v1.
- T-022 posee `packages/laya/` y `corpus/payments/`. El paquete nuevo no depende de otros paquetes `@alaia/*`.
- T-023 (`packages/gateway/`) espera a las tres. No se spawnea en esta ola.
- Ausencia de pesos de Laya sigue siendo escalate en el gateway, no un allow inventado.

## Forbidden

Descargar pesos. Llamar a Hugging Face, Strands Hub o QVAC. Construir envelopes de trustline o de Soroban. Dejar que `changeTrust`, `setOptions` o `invokeContract` pongan `questions: true`. Incluir el caso `confirm` entre sus propios vecinos. Leer `docs/graders/goldens/`.

## Cite in code

```text
// DEC-0015: agent spend requires a human grant; policy closes non-payment tools
```
