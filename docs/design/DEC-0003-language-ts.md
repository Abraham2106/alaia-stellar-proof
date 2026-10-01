# DEC-0003 — TypeScript para Stellar Classic y QVAC

- Status: `accepted`
- Decider: planner (preflight; el humano pidió el mejor lenguaje para Stellar y QVAC)
- Date: 2026-10-01

## Decision

El MVP es **TypeScript**. Stellar Classic vía `@stellar/stellar-sdk`. Inferencia local vía el adaptador QVAC del repo [Albatross](https://github.com/Abraham2106/Albatross), sin su UI de hospitales.

## Why

QVAC publica aplicaciones JS/Python. Albatross ya es Electron + TypeScript sobre `@qvac/sdk`. Un núcleo Rust obligaría un puente para el mismo runtime y parte el hackathon en dos procesos. Classic (envelope, multisig, memo, Horizon contra quickstart) está cubierto por el SDK de TypeScript.

## Consequences

Rust no es el lenguaje del MVP. Si un seam posterior exige XDR a mano o un binario, se abre otra `DEC-*`; no se mezcla en esta.

## Forbidden

Reimplementar Whisper, el dominio de hospitales, o la UI de Albatross. El LLM no firma ni escribe el ledger.

## Cite in code

```text
// DEC-0003: TypeScript; Stellar SDK + QVAC adapter, not a Rust core
```
