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

| DEC-0008 | Renderer con arrays y spawn parcial reanudable sin borrar cambios | accepted |
| DEC-0009 | Firma aprobada exacta y recuperación mediante backups separados sin nuevo signer | accepted |
| DEC-0010 | Bundle de evidencia y request preimage, con validación de integridad | accepted |
| DEC-0011 | Transporte loopback y grader reservado generado después de workers | accepted |
| DEC-0012 | Intención confiable y evidencia en Qwen real | accepted |
| DEC-0013 | Identidades distintas en setup 2-de-2 | accepted |
| DEC-0014 | Verify 1: Laya puntúa, el judge confirma porcentajes | accepted |
| DEC-0015 | Grant humano, compuerta de tools y suite confirm | accepted |
| DEC-0016 | Judge local: strands-decider ask; QVAC fuera | accepted |
| DEC-0017 | Checkpoint Mapika decider-0.8b (supersede id DEC-0016) | accepted |
| DEC-0018 | Judge vía System One adapter; default decider-0.8b | accepted |

Si dos planners contradicen una fila, no se mergea código. Se abre reconciliación
de docs y se incrementa el id; no se agregan sufijos al id.
