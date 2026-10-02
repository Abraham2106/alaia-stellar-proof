# Decisions ledger

Fuente compacta para inyectar en workers. Detalle en `DEC-*.md`.

| ID | One-liner | Status |
|---|---|---|
| DEC-0001 | Planner no codea; worker no diseña; worktrees | accepted |
| DEC-0002 | Stellar + local; spec de producto abierta | accepted |
| DEC-0003 | TypeScript: Stellar SDK + núcleo QVAC en repo | accepted |
| DEC-0004 | MVP Classic quickstart; Qwen solo; RAG después del receipt | accepted |
| DEC-0005 | Raven MCP solo referencia; sin llamadas públicas en camino feliz | accepted |
| DEC-0006 | Policy allow + Qwen allow; runtime ausente bloquea el envelope | accepted |
| DEC-0007 | Identidad del grafo, estados coherentes y verificación al reanudar | accepted |

Si dos planners contradicen una fila, no se mergea código. Se abre un reconciler de docs y se incrementa el id (`DEC-0003a` no: se supersede con `DEC-0004`).
