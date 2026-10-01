# REQ-0001 — Producto (preflight)

Estado: respuestas del 2026-10-01. El gate de implementación sigue cerrado hasta el crate/módulo graph y el runner del grader.

## Cerrado

| Campo | Valor |
|---|---|
| Notify | `done` / `killed` / hard-block. Cero preguntas mid-run |
| Panorama | `Idea.md` |
| Restricciones | `alaia-proof-context.md` |
| IA local | Adaptador QVAC de https://github.com/Abraham2106/Albatross |
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

Proponer un pago canónico, evaluarlo (reglas y, si pasan, Qwen), firmar solo si la política lo permite, devolver el receipt. No es API: UI, x402, Soroban, Whisper, dominio hospitalario.

### 6. Grader

Quickstart local. Compara configuración de cuenta en ledger, rechazo de mutaciones post-aprobación, y casos negativos. Goldens fuera del prompt del worker. RAG/grafo entra después de que pago y receipt pasen; corpus sintético de txs válidas, generado en el repo.

### 7. No-goals de esta ola

Mainnet, x402, Soroban como camino feliz, segundo judge, replay universal, UI de Albatross, custodia de una wallet principal.

### 8. Secrets

Claves de la cuenta de presupuesto se generan en local al levantar el quickstart. No se commitean. Recuperación documentada y testeada (`DEC-0004`).

### 9. Done de esta ola

Script local: quickstart up, cuenta 2-de-2 comprobada en ledger, un pago permitido firmado, los casos negativos rechazados, receipt reconstruible. Sin red pública.

## Paquete

- `Idea.md`
- `alaia-proof-context.md`
- `docs/design/INTAKE-2026-10-01.md`
