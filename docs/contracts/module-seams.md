# Module seams

Cada seam tiene un dueño. Dos workers no escriben el mismo path.

| id | path | owns | must not own | status |
|---|---|---|---|---|
| `S-policy` | `packages/policy/` | pago canónico, reglas deterministas, razones de deny | red, firmas, SDK Stellar | accepted |
| `S-stellar` | `packages/stellar-classic/` | envelope Classic, `MEMO_HASH`, SetOptions de la cuenta presupuesto (sin submit) | política de negocio, QVAC, Horizon | accepted |
| `S-local` | `packages/localnet/` | quickstart up/down | protocolo del pago | draft — hito posterior |
| `S-judge` | `packages/judge/` | transporte QVAC local, un modelo Qwen3-4B, JSON schema | ampliar caps, firmar | accepted — DEC-0006 |
| `S-gateway` | `packages/gateway/` | policy primero, judge obligatorio, decisión final, receipt y envelope | aceptar verdicts del caller, firmar, submit | accepted — DEC-0006 |
| `S-rag` | `packages/rag-graph/` | corpus sintético y grafo | camino feliz del pago | draft — después del receipt |
| `S-raven-dev` | _(sin path aún)_ | conexión MCP Raven opcional en IDE del humano | runtime del pago, grader, Horizon local | draft — referencia DEC-0005 |

Decisiones: `DEC-0003`, `DEC-0004`, `DEC-0005`, `DEC-0006`.
