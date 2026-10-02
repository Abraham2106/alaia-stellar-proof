# alaia-stellar-proof

Policy gateway local para pagos Classic de Stellar. El modelo puede rechazar o escalar; no amplía permisos. El ancla `MEMO_HASH` demuestra integridad del receipt, no que una inferencia ocurrió.

## Fuentes

- `Idea.md` — panorama
- `alaia-proof-context.md` — restricciones antes de construir
- `docs/design/` — decisiones `DEC-*`

## Alcance de esta ola

Quickstart standalone, sin red pública. Cuenta de presupuesto 2-de-2 (`masterWeight = 0`) con recuperación. Reglas deterministas primero. Un judge local (Qwen3-4B vía núcleo QVAC en este repo; JSON schema, código decide, el modelo no firma). RAG y grafo sobre un corpus sintético entran después de que el pago y el receipt pasen.

Lenguaje: TypeScript (`DEC-0003`).

## Pago con judge obligatorio

`consider()` ahora es asíncrono y ejecuta Qwen internamente después de policy. Sin runtime, con timeout o sin ALLOW válido, devuelve `envelope: null`; no se debe firmar ni enviar. No acepta veredictos del caller.

Setup del servidor QVAC local, migración de API y pruebas: [judge Quickstart](docs/judge-quickstart.md). La integración real requiere QVAC/Qwen y Horizon; los tests unitarios con sustitutos explícitos no prueban inferencia.
