# DEC-0018 — System One judge adapter

- Status: `accepted`
- Decider: planner
- Date: 2026-10-03
- Supersedes: **solo** la fijación de checkpoint y `receipt.judge.model` en el núcleo del pipeline (DEC-0016 / DEC-0017). Preguntas, parseo, policy-first, `ALAIA_STRANDS`, timeout, sin few-shot y sin umbral de confianza siguen como DEC-0017.

## Decision

El judge local no nombra un modelo en `runtime` ni en `consider`. Un **System One adapter** (`SystemOneAdapter`) posee `id`, `modelId`, `checkpoint` y `ask(request)` que devuelve el JSON crudo que ya acepta `parseStrandsDeciderJson` (`noul_0`, `noul_1`, `noul_2`, `choice_0`, `score_0`). La preimagen de `requestHash` es `{ checkpoint, state, questions }` con el `checkpoint` del adapter activo. El receipt nuevo guarda `judge.model` = `modelId` del adapter activo.

Selección: `ALAIA_JUDGE_ADAPTER`, default `decider-0.8b`. El registro expone `registerAdapter` / `getAdapter`. Un `id` desconocido lanza `UnknownAdapterError`; el runtime lo convierte en `escalate` / `runtime_unavailable`. No hay mock silencioso.

Adapter por defecto: `decider-0.8b` (`modelId` `decider-0.8b`, checkpoint `Mapika/decider-0.8b`) ejecuta `packages/judge/scripts/decider-ask.py` con `USE_HUB_KERNELS=NO`, `ALAIA_STRANDS_PYTHON`, `ALAIA_STRANDS_DECIDER` (fixture `.mjs` incluido) y `ALAIA_STRANDS_TIMEOUT_MS`. Sin cuantizar. Sin Bedrock. Las cinco preguntas de DEC-0014 / DEC-0017 no cambian al cambiar de adapter.

Otros adapters (p. ej. CLI Strands) se registran en el mismo registro; no añaden preguntas.

## Why

Permitir sustituir el proceso de inferencia (Mapika decider, strands-decider, etc.) sin reescribir gateway, parseo ni receipt, manteniendo un contrato único de salida tipada.

## Consequences

- Export legacy: `STRANDS_MODEL` y `STRANDS_CHECKPOINT` siguen siendo los valores del adapter por defecto para imports antiguos; `consider` y `runJudge` leen el adapter activo.
- Habilitación del pipeline: `ALAIA_STRANDS=1` (DEC-0016). Si falta, `runtime_unavailable` sin spawn.
- Tests de contrato: fixture `.mjs` vía `ALAIA_STRANDS_DECIDER`; prueba unitaria de adapter desconocido sin spawn.

## Forbidden

Mock silencioso en adapter desconocido, Bedrock, QVAC, cambiar el conjunto de preguntas al seleccionar adapter, cuantizar en el camino de producto, confianza como compuerta.

## Cite in code

```text
// DEC-0018: System One adapter; pipeline is model-agnostic
```
