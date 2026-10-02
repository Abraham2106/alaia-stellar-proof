# REQ-0002 — ALAIA Verify 1

Estado: visión aceptada el 2026-10-02 por DEC-0014. Sustituye el alcance de producto de REQ-0001. No certifica implementación ni un artefacto entrenado.

## Auditoría del requisito anterior

| Requisito vigente hasta hoy | Alineación |
|---|---|
| Policy determinista manda; el modelo no amplía permiso | Se conserva |
| Quickstart local, sin red pública en el camino feliz | Se conserva |
| TypeScript y núcleo local | Se conserva |
| Un solo judge Qwen3-4B | Sustituido: Laya puntúa y el judge confirma porcentajes |
| API = proponer, evaluar con Qwen, firmar, receipt | Sustituida por el registro `alaia-verify-1` |
| Corpus solo después del receipt, y solo de txs válidas | Sustituido: corpus de pagos buenos y malos es la puerta de Laya |
| Segundo judge prohibido | Revocado |
| `MEMO_HASH` prueba integridad del receipt, no la inferencia | Se conserva |
| Mainnet, x402, Soroban como camino feliz, UI de producto | Siguen fuera |
| Pausa de carga de modelos pedida por el usuario | Sigue en pie; esta req no la levanta |

## Cerrado

| Campo | Valor |
|---|---|
| Estándar | `docs/design/ALAIA-VERIFY-1.md` |
| Clases | `human` y `agent`, mismo registro |
| Decisión local | Laya, forma Jev, conjunto fijo de preguntas |
| Confirmación | Judge local, banda 0,15, sin ver las respuestas de Laya |
| Corpus | `corpus/payments/`, partes `train` y `confirm`, oro 0/1 y una clave de disposición |
| Código de producto | No arranca en esta hoja. Workers, un seam, cuando el corpus esté escrito |

### Afirmación

Un verificador conforme acepta un pago Classic de una wallet humana o de una wallet de agente solo si la policy lo permite, Laya responde el conjunto fijo, y el judge confirma los porcentajes dentro de banda. El receipt anclado sigue sirviendo para reconstruir la disputa. Los porcentajes no firman.

### Hecho

No hay directorio `corpus/payments/` ni archivo de pesos de Laya. Hasta que existan, el camino ejecutable del repositorio sigue siendo el de REQ-0001 y DEC-0006. Un worker que devuelva porcentajes sin el artefacto y sin la compuerta de `confirm` no cumple esta req.

### Done de la visión

Corpus publicado con las dos clases y los casos de ALAIA-VERIFY-1. Artefacto Laya con SHA-256 que pasa la parte `confirm`. Judge confirma en vivo dentro de banda, en loopback. Policy `deny` no se convierte en `allow`. Envelope solo con acuerdo `allow`. Registro `alaia-verify-1` persistido junto al receipt, sin red pública.
