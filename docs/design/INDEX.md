# Design index

Cada decisión tiene un id estable `DEC-XXXX`. El planner la escribe. El worker la cita. El reconciler (humano o judge) fusiona conflictos de docs, no de código.

| ID | Título | Status | Seams |
|---|---|---|---|
| DEC-0001 | Planner no implementa; worker no diseña | accepted | orchestration |
| DEC-0002 | Dominio Stellar + local; spec aún no cerrada | accepted | product |
| DEC-0003 | TypeScript + in-repo QVAC core | accepted | language |
| DEC-0004 | MVP Classic, una cuenta presupuesto, RAG después | accepted | product |
| DEC-0005 | Raven MCP referencia; sin runtime en receipt | accepted | dev-tooling (future) |
| DEC-0006 | Judge local obligatorio antes del envelope | accepted | gateway, judge, receipt, live |
| DEC-0007 | Reanudar fronteras y verificación | accepted | gateway, live, grader, build |

| DEC-0008 | Orquestación reanudable | accepted | orchestration |
| DEC-0009 | Firma y recuperación | accepted | stellar, live |
| DEC-0010 | Reconstrucción | accepted | gateway, receipt, live |
| DEC-0011 | Transporte y grader | accepted | local, grader, live |
| DEC-0012 | [Judge trust boundaries](DEC-0012-judge-trust-boundaries.md) | accepted | judge |
| DEC-0013 | [Budget signer identity](DEC-0013-budget-signer-identity.md) | accepted | stellar |

Plantilla: `_template.md`. Requisitos respondidos: `REQ-0001-product.md`.
Aceptación de integración pendiente; pausa de Qwen por instrucción del usuario.
