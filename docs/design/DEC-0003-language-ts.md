# DEC-0003 — TypeScript para Stellar Classic y QVAC

- Status: `accepted`
- Decider: planner (preflight; el humano pidió el mejor lenguaje para Stellar y QVAC)
- Date: 2026-10-01

## Decision

El MVP es **TypeScript**. Stellar Classic vía `@stellar/stellar-sdk`. Inferencia local mediante un **núcleo QVAC en este repo**: salida con JSON schema; el código determinista decide; el modelo no firma ni escribe el ledger.

## Why

Las aplicaciones QVAC son JS/TypeScript (y Python en otros perfiles). Classic (envelope, multisig, memo, Horizon contra quickstart) está cubierto por el SDK de TypeScript. Un núcleo Rust obligaría un puente para el mismo runtime del judge y parte el hackathon en dos procesos.

## Consequences

Rust no es el lenguaje del MVP. Si un seam posterior exige XDR a mano o un binario, se abre otra `DEC-*`; no se mezcla en esta.

## Forbidden

Importar o copiar la UI o el dominio de un producto ajeno. El LLM no firma ni escribe el ledger.

## Cite in code

```text
// DEC-0003: TypeScript; Stellar SDK + in-repo QVAC core, not a Rust core
```
