# REQ-0001 — Producto (preflight)

Estado: preflight histórico del 2026-10-01. La visión vigente es REQ-0002 y
DEC-0014. El código que ya se mergeó sigue este preflight hasta que existan
corpus y artefacto Laya. No certifica aceptación del MVP ni de Verify 1.

## Cerrado

| Campo | Valor |
|---|---|
| Notify | `done` / `killed` / hard-block. Cero preguntas mid-run |
| Panorama | `Idea.md` |
| Restricciones | `alaia-proof-context.md` |
| IA local | Núcleo QVAC en este repo (JSON schema; código decide; el modelo no firma) |
| Código | Subagentes worker cuando empiece la implementación |

### 1. Qué afirma el sistema

Un pago Classic propuesto contra una cuenta de presupuesto local solo se firma si las reglas deterministas lo permiten. Qwen3-4B puede escalar o rechazar; no puede ampliar el permiso. El receipt anclado en `MEMO_HASH` permite reconstruir la disputa. No es una prueba de que el modelo infirió.

### 2. Local

Stellar Quickstart (standalone). El grader no usa testnet, futurenet ni mainnet.

### 3. Red

Offline en el camino feliz. Salida a red pública = fallo del grader.

### 4. Lenguaje

TypeScript. Ver `DEC-0003`.

### 5. API pública mínima

Proponer un pago canónico, evaluarlo (reglas y, si pasan, Qwen), firmar solo si la política lo permite, devolver el receipt. No es API: UI de producto, x402, Soroban.

### 6. Grader

Quickstart local. Compara configuración de cuenta en ledger, rechazo de mutaciones post-aprobación, y casos negativos. Goldens fuera del prompt del worker. RAG/grafo entra después de que pago y receipt pasen; corpus sintético de txs válidas, generado en el repo.

### 7. No-goals de esta ola

Mainnet, x402, Soroban como camino feliz, segundo judge, replay universal, UI de producto ajena, custodia de una wallet principal.

### 8. Secrets

Claves de la cuenta de presupuesto se generan en local al levantar el quickstart. No se commitean. Recuperación documentada y testeada (`DEC-0004`).

### 9. Done de esta ola

Script local: quickstart up, cuenta 2-de-2 comprobada en ledger, un pago permitido firmado, los casos negativos rechazados, receipt reconstruible. Sin red pública.

## Paquete

- `Idea.md`
- `alaia-proof-context.md`
- `docs/design/INTAKE-2026-10-01.md`
