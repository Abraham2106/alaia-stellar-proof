# Module seams

Cada seam tiene un dueño. Dos workers no escriben el mismo path.

| id | path | owns | must not own | status |
|---|---|---|---|---|
| `S-policy` | `packages/policy/` | pago canónico, reglas deterministas, razones de deny | red, firmas, SDK Stellar | accepted |
| `S-stellar` | `packages/stellar-classic/` | envelope Classic, `MEMO_HASH`, SetOptions de la cuenta presupuesto (sin submit) | política de negocio, QVAC, Horizon | accepted |
| `S-local` | `packages/localnet/` | quickstart up/down | protocolo del pago | draft — hito posterior |
| `S-judge` | `packages/judge/` | adaptador QVAC, un modelo Qwen3-4B, JSON schema | ampliar caps, firmar | draft — después de policy+envelope |
| `S-rag` | `packages/rag-graph/` | corpus sintético y grafo | camino feliz del pago | draft — después del receipt |
| `S-raven-dev` | _(sin path aún)_ | conexión MCP Raven opcional en IDE del humano | runtime del pago, grader, Horizon local | draft — referencia DEC-0005 |

Decisiones: `DEC-0003`, `DEC-0004`, `DEC-0005`.
