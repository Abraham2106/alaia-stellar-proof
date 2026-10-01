# DEC-0006 — Judge obligatorio antes del envelope

- Status: `accepted`
- Date: 2026-10-01
- Basis: corrección del bypass observado en Quickstart, dentro del alcance de DEC-0004.

## Decision

`consider()` es asíncrono. Ejecuta policy primero y, si permite, llama internamente al único judge Qwen3-4B de esta ola. No acepta `verdict` ni expone `considerWithJudge()`. Solo policy allow + judge allow con código `ok` construyen un envelope. Deny, escalate, salida inválida, timeout y runtime ausente producen un receipt y `envelope: null`.

El resultado separa `policyDecision` de la decisión final `decision`. El receipt guarda el modelo declarado, hash de la solicitud (prompt, system prompt, schema y parámetros) y veredicto. Esto ancla integridad, no prueba ejecución del modelo, procedencia del GGUF ni independencia de las claves.

El adaptador en `packages/judge/src/qvac-runner.ts` llama al servidor local de QVAC mediante su extensión HTTP OpenAI-compatible. QVAC carga el GGUF; no se sustituye por un servicio cloud. Solo se permiten endpoints loopback, con redirects prohibidos y timeout acotado. Configuración del servidor en `qvac.config.json`.

## Tests y límites

Tests unitarios pueden sustituir explícitamente el runtime desde Vitest. El Quickstart live nunca recibe un verdict ni utiliza ese mock. La prueba de recovery weight 0 queda separada de la prueba Qwen+payment. `ALAIA_LIVE=1` exige infraestructura real y falla si falta; una ejecución normal sin infraestructura marca las integraciones como skipped.

No se añaden un segundo judge, Soroban ni mainnet. Las dos firmas siguen siendo autoridad de claves en un host, no firmas emitidas por dos modelos. El SDK Classic actual solo construye XLM: un asset credit se rechaza incluso si aparece en una policy del caller.
