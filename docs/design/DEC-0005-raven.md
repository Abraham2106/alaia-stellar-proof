# DEC-0005 — Stellar Raven (referencia, sin runtime)

- Status: `accepted`
- Decider: worker (investigación Raven + DEC-0004), 2026-10-01
- Date: 2026-10-01
- Supersedes: —

## Decision

**Stellar Raven es solo referencia para desarrolladores humanos y agentes en el IDE.** Este repo **no** depende de Raven en runtime, grader ni camino feliz. No se crea `packages/raven-inspect/` ni otra dependencia npm de Raven.

Raven es un **servidor MCP remoto** (streamable HTTP + OAuth) desplegado en Cloudflare Workers, expuesto en `https://raven.stellar.org/mcp` (alias histórico `https://raven.stellar.buzz/mcp`). Código abierto: [stellar-experimental/stellar-raven](https://github.com/stellar-experimental/stellar-raven). Documentación: [raven.stellar.org/docs](https://raven.stellar.org/docs). Ofrece dos herramientas MCP — `search` (catálogo de docs, skills y operaciones del ecosistema) y `execute` (JavaScript en un isolate sin red; las llamadas a servicios upstream las hace el **host** de Raven con credenciales en servidor). No publica una librería npm para inspeccionar XDR Classic offline ni un componente que el producto pueda enlazar contra Quickstart local sin salir a internet.

**Qué usamos:** citas en diseño y, opcionalmente, conexión MCP manual en Cursor/otro cliente **fuera** del grader y del pago Classic — para investigación de protocolo y ecosistema, no para firmar ni submit.

**Qué rechazamos:** cualquier `fetch`, cliente MCP o SDK en código de producto, tests o grader que contacte `raven.stellar.org`, `raven.stellar.buzz`, u otro endpoint Raven público en el camino feliz (DEC-0004). Rechazamos tratar Raven como sustituto de Horizon local, del SDK Stellar para envelopes, o de mocks silenciosos de red.

## Why

El humano pidió considerar Raven. Raven agrega valor como **gateway MCP hosted** para contexto Stellar en agentes, no como pieza offline del receipt Classic. DEC-0004 exige quickstart local sin internet en el camino feliz; Raven requiere OAuth y, en `execute`, adapters del host hacia servicios vivos del ecosistema.

## Consequences

- Sin paquete nuevo. Seam futuro documentado en `docs/contracts/module-seams.md` (`S-raven-dev`), status draft, sin dueño de código hoy.
- Workers que evalúen integración Raven lo harán en una tarea explícita y **nunca** en `packages/policy/` ni `packages/stellar-classic/` sin nuevo DEC.

## Forbidden

- Llamadas HTTP/MCP a Raven desde `packages/*` del camino feliz, grader, o CI del receipt.
- Inventar un mock local de Raven o emular su catálogo en tests.
- Usar Raven como fuente de verdad de protocolo en lugar de docs oficiales + quickstart local (Raven mismo indica verificar claims de protocolo con Stellar Docs).

## Cite in code

```text
// DEC-0005: Raven is MCP reference only; no public Raven calls on the happy path
```

## Sources

| What | URL |
|---|---|
| Landing + connect | https://raven.stellar.org/ |
| Docs | https://raven.stellar.org/docs |
| Official AI build guide | https://developers.stellar.org/docs/build/building-with-ai |
| Source | https://github.com/stellar-experimental/stellar-raven |
