# DEC-0004 — Alcance del primer build

- Status: `accepted`
- Decider: planner, desde el preflight del 2026-10-01
- Date: 2026-10-01

## Decision

Demo de hackathon, en este orden:

1. Pago **Classic** en **Stellar Quickstart local**. El grader falla si el camino feliz sale a internet.
2. Cuenta de **presupuesto** 2-de-2, `masterWeight = 0`, recuperación documentada y testeada. No es la wallet principal.
3. Reglas deterministas mandan (caps, activo, destino, admin). Un ALLOW del modelo no amplía permisos.
4. **Un** judge local: Qwen3-4B vía QVAC. El segundo judge no está en esta ola.
5. Casos negativos en el grader: factura que conserva un importe permitido pero miente, cambio de destinatario, bypass de firma, disputa reconstruible desde el receipt.
6. **Después** de que el pago Classic y el receipt pasen: RAG + grafo contra un corpus **sintético** de transacciones válidas. No antes.

## Why

El humano eligió demo Classic, quickstart offline, cuenta 2-de-2 con recuperación, adaptador Albatross, y Qwen solo al principio. El hito “dos judges” del formulario queda sustituido por la respuesta específica de judges. El contexto (`alaia-proof-context.md` §14) retira “proof of inference” y replay universal.

## Consequences

`MEMO_HASH` ancla integridad del receipt en Classic. No se afirma que el modelo se ejecutó ni que la decisión es bit-exact en cualquier máquina.

## Forbidden

Mainnet. x402 / Soroban en esta ola. Smart accounts OpenZeppelin como camino feliz. UI de producto. Mocks silenciosos de Horizon. Corpus RAG antes del receipt.

## Cite in code

```text
// DEC-0004: Classic quickstart; deterministic policy outranks the judge
```
