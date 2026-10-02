# alaia-stellar-proof

Pasarela local de políticas para pagos Classic de Stellar. El modelo puede
rechazar o escalar; no amplía permisos ni firma. MEMO_HASH demuestra integridad
del receipt, no que ocurrió una inferencia.

## Flujo actual

TypeScript (DEC-0003), Stellar Quickstart standalone y Qwen3-4B vía QVAC.
consider() evalúa policy antes del judge obligatorio. Solo ambos allow producen
un envelope; el caller comprueba decision y envelope antes de firmar.
considerWithGraph() exige que la pareja del grafo coincida con el pago real:
una discrepancia se rechaza y una arista desconocida se escala (DEC-0007).

La cuenta de presupuesto utiliza dos firmas, masterWeight=0. La clave denominada
recovery tiene peso cero y no puede recuperar ni gastar por sí sola; el
procedimiento de recuperación real sigue pendiente. Ambas claves de gasto viven
en el mismo host: este prototipo no protege contra su administrador.

## Ejecutar y verificar

- [Quickstart con judge obligatorio](docs/judge-quickstart.md)
- [Runner y alcance de la evidencia](docs/graders/runner.md)
- [Decisiones](docs/design/DECISIONS.md)
- Idea.md y alaia-proof-context.md: fuentes y límites de producto.

La demo completa requiere Docker, QVAC y un GGUF local verificado. Las pruebas
con dobles explícitos no prueban inferencia. El corpus oculto, la recuperación
real y los negativos semánticos permanecen pendientes de aceptación.
