# DEC-0014 — ALAIA Verify 1

- Status: `accepted`
- Decider: planner, por redirección de producto del 2026-10-02
- Date: 2026-10-02
- Supersedes: DEC-0004 ítems 4 y 6; la frase «un solo judge» y «no se añade un segundo judge» de DEC-0006; el no-goal «segundo judge» de REQ-0001

## Decision

ALAIA es el estándar de verificación **ALAIA Verify 1** (`alaia-verify-1`), especificado en `docs/design/ALAIA-VERIFY-1.md`. Verifica pagos Classic de dos clases de wallet, `human` y `agent`, con el mismo registro. Laya es el modelo de decisión local, con la forma de preguntas Jev (`noul`, `choice`, `score`) y porcentajes. El judge local confirma esos porcentajes. La policy determinista sigue mandando: ni Laya ni el judge amplían un tope, un destino o un activo.

## Why

El producto deja de ser solo la demo de un judge Qwen sobre una cuenta de presupuesto. El registro de verificación es el objeto que otra implementación puede reproducir: clase de wallet, respuestas de Laya, confirmación del judge y hash del artefacto.

## Consequences

- REQ-0002 es el requisito vigente. REQ-0001 queda como preflight histórico.
- El código actual no implementa Verify 1. Sigue el camino DEC-0006 hasta que aterricen las hojas de corpus, Laya y confirmación.
- No hay pesos de Laya en el repo. Un allow con porcentajes sin artefacto hasheado es inválido.
- La pausa de carga de modelos no se levanta con esta decisión.
- Receipt v1 y su `MEMO_HASH` no cambian en este documento. Verify 1 define el registro; la versión nueva del receipt llega en una hoja posterior que cite este id.

## Forbidden

Llamar a la API hospedada de Jev o a cualquier clasificador en la nube. Añadir preguntas fuera del conjunto fijo. Tratar los porcentajes como firma o como prueba de inferencia. Declarar este borrador como SEP adoptado. Devolver porcentajes de relleno cuando falte el artefacto o el judge.

## Cite in code

```text
// DEC-0014: Laya scores; the judge confirms probabilities; policy still outranks both
```
