# alaia-stellar-proof

Policy gateway local para pagos Classic de Stellar. El modelo puede rechazar o escalar; no amplía permisos. El ancla `MEMO_HASH` demuestra integridad del receipt, no que una inferencia ocurrió.

## Fuentes

- `Idea.md` — panorama
- `alaia-proof-context.md` — restricciones antes de construir
- `docs/design/` — decisiones `DEC-*`

## Alcance de esta ola

Quickstart standalone, sin red pública. Cuenta de presupuesto 2-de-2 (`masterWeight = 0`) con recuperación. Reglas deterministas primero. Un judge local (Qwen3-4B vía adaptador de qvac) . RAG y grafo sobre un corpus sintético entran después de que el pago y el receipt pasen.

Lenguaje: TypeScript (`DEC-0003`).
