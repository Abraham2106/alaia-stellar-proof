# alaia-stellar-proof

Pasarela local de políticas para pagos Classic de Stellar. El modelo puede
rechazar o escalar; no amplía permisos ni firma. MEMO_HASH demuestra integridad
del receipt, no que ocurrió una inferencia.

La visión vigente es el estándar `alaia-verify-1`: wallets `human` y `agent`,
Laya local, y el judge confirmando porcentajes (`docs/design/REQ-0002-verify.md`).
Ese camino todavía no está en el código.

## Flujo actual

TypeScript (DEC-0003), Stellar Quickstart standalone y Qwen3-4B vía QVAC.
consider() evalúa policy antes del judge obligatorio. Solo ambos allow producen
un envelope; el caller comprueba decision y envelope antes de firmar.
considerWithGraph() exige que la pareja del grafo coincida con el pago real:
una discrepancia se rechaza y una arista desconocida se escala (DEC-0007).

La cuenta de presupuesto utiliza dos firmas, masterWeight=0 y umbrales 2.
`signApprovedEnvelope` vincula la firma al cuerpo y los campos aprobados.
La recuperación por backups cifrados restaura A/B sin añadir una tercera
autoridad (DEC-0009). El parámetro legacy recoverySigner solo elimina un signer
de peso cero. Ambas claves de gasto viven en el mismo host: este prototipo no
protege contra su administrador.

El gateway conserva `judgeRequestJson`, preimagen exacta de requestHash. El bundle
versionado de receipt permite persistir y comprobar esos hashes (DEC-0010);
comparar con el ledger y ejecutar Qwen real son verificaciones separadas.

## Ejecutar y verificar

- [Quickstart con judge obligatorio](docs/judge-quickstart.md)
- [Runner y alcance de la evidencia](docs/graders/runner.md)
- [Decisiones](docs/design/DECISIONS.md)
- Idea.md y alaia-proof-context.md: fuentes y límites de producto.

La demo completa requiere Docker, QVAC y un GGUF local verificado. Las pruebas
con dobles explícitos no prueban inferencia. Qwen está pausado por instrucción
del usuario; la aceptación real en ledger permanece pendiente. Ver
[estado y evidencia de reparación](docs/ESTADO-REPARACION-NUCLEO-2026-10-01.md).
