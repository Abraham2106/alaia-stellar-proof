# ALAIA Verify 1

Identificador: `alaia-verify-1`.
Estado: borrador normativo de este repositorio, 2026-10-02.
Decisión: DEC-0014.

Este documento es el estándar que una implementación ALAIA debe cumplir. No es un SEP de la Stellar Development Foundation.

La forma de las respuestas sigue la API pública de decisión Jev leída el 2026-10-02: `state`, preguntas `noul` / `choice` / `score`, y respuestas con probabilidad. Fuentes de esa forma: la referencia hospedada en `https://jevtypesafeai.com/docs` y la ficha `typesafe/jev` de Cloudflare. Verify 1 no llama a esos servicios. Congela un conjunto de preguntas para que dos verificadores comparen los mismos porcentajes.

## Sujeto

Toda verificación nombra una wallet:

| Campo | Regla |
|---|---|
| `walletClass` | `human` o `agent` |
| `publicKey` | cuenta Stellar G de 56 caracteres que propone el pago |
| `networkPassphrase` | passphrase de la red local bajo verificación |

`human`: la intención del operador es la superficie confiable. La evidencia de factura o de herramienta no autoriza.

`agent`: el agente propone el pago. La intención del operador es el límite confiable del presupuesto. La evidencia sigue sin autorizar. La clase no añade un firmante ni un peso.

Las dos clases usan el mismo pago canónico, la misma policy y las mismas preguntas. El `state` que ve Laya incluye `walletClass` para que el porcentaje quede ligado a la clase.

## Orden

1. La policy determinista evalúa el pago. `deny` termina en `deny`. Laya y el judge no corren para ampliar ese resultado.
2. Si la policy permite, Laya responde el conjunto fijo y devuelve porcentajes.
3. El judge responde el mismo conjunto, sin ver las respuestas de Laya, y confirma los porcentajes.
4. Solo policy `allow`, disposición acordada `allow` y confirmación dentro de banda construyen un envelope. Cualquier ausencia, desacuerdo o salida inválida deja el envelope en null y la decisión en `escalate`, salvo `deny` explícito acordado o de policy.

## Preguntas fijas

El llamador no agrega ni quita preguntas.

| Id | Tipo | Qué mide |
|---|---|---|
| `recipient_match` | `noul` | Probabilidad de que el destino coincida con la intención confiable. Sin intención, la pregunta compara solo contra el pago propuesto y no inventa un destinatario. |
| `untrusted_instruction` | `noul` | Probabilidad de que la evidencia intente sustituir la intención o la policy. |
| `intent_ambiguous` | `noul` | Probabilidad de que la intención confiable no determine un único pago. |
| `disposition` | `choice` | `allow`, `escalate`, `deny`. Criterios cerrados: permitir solo sin discrepancia; escalar ambigüedad o instrucción no confiable; negar sustitución de destinatario. |
| `dispute_severity` | `score` | Rúbrica ordenada de cuatro niveles: `none`, `low`, `material`, `critical`. |

`noul` es la probabilidad de sí, de 0 a 1. `choice` devuelve la clave ganadora, `confidence` y `probabilities` sobre las tres claves. `score` devuelve el valor ponderado, `legend`, `confidence` y `probabilities` sobre `0..3`.

## Banda de confirmación

La banda es 0,15 en valor absoluto. Cambiarla exige otro `DEC-*`.

El judge confirma a Laya cuando se cumplen las cuatro condiciones:

- En cada `noul`, la diferencia absoluta es menor o igual a 0,15.
- `disposition` tiene el mismo argmax.
- En cada clave de `disposition`, la diferencia absoluta de probabilidad es menor o igual a 0,15.
- `dispute_severity` cae a lo sumo a un nivel entero de distancia.

Fuera de banda, la decisión es `escalate`.

## Laya

Laya es un modelo local entrenado en este repositorio. El artefacto es un archivo cuyo SHA-256 viaja en el registro. El runtime carga ese archivo desde disco. No descarga pesos en el camino de verificación.

El corpus vive en `corpus/payments/`, generado en el repo, sin seeds, sin passphrases y sin cuentas de una red pública. Cada caso trae `walletClass`, el pago canónico, la intención confiable o su ausencia, la evidencia no confiable o su ausencia, y las respuestas oro.

El oro de un `noul` es 0 o 1. El oro de `disposition` es una sola clave. El conjunto se parte en `train` y `confirm`. Laya se entrena solo con `train`. La compuerta de publicación corre `confirm`: el argmax de Laya coincide con el oro y cada `noul` cae a 0,15 del oro. Sin esa compuerta el artefacto no se publica y el runtime no lo carga.

Casos que el corpus tiene que cubrir, en las dos clases de wallet:

- Pago alineado con la intención: `disposition = allow`, `recipient_match = 1`, instrucciones no confiables en 0.
- Destinatario distinto al de la intención, aunque ambos estén en la lista de la policy.
- Evidencia que conserva un importe permitido y miente sobre el destino o la finalidad.
- Instrucción dentro de la evidencia que pide ignorar la intención.
- Intención ausente: no se inventa identidad; la disposición no es `allow` si el pago no queda determinado.
- Pago que la policy niega por tope, destino o activo: el oro de la policy es `deny` y Laya no se usa para volverlo `allow`.

## Judge

El judge de esta versión es el runtime local ya acotado a loopback. Confirma porcentajes. No elige otro modelo, no firma y no lee las respuestas de Laya antes de emitir las suyas. Su propio mapa de respuestas entra al registro junto al de Laya y al delta por pregunta.

Los labels `allow` / `deny` / `escalate` y los códigos del receipt v1 siguen siendo la reducción de autorización del camino actual. Verify 1 no los borra. Los porcentajes viven en el registro de verificación, no sustituyen en silencio el hash del receipt v1.

## Registro

Una verificación conforme emite este objeto. Los porcentajes son números decimales de 0 a 1. Las probabilidades de un `choice` o de un `score` suman 1 con tolerancia de 0,01.

```json
{
  "standard": "alaia-verify-1",
  "walletClass": "human",
  "subject": { "publicKey": "G...", "networkPassphrase": "Standalone Network ; February 2017" },
  "policy": { "decision": "allow", "reasons": [] },
  "laya": { "model": "laya", "artifactSha256": "<hex64>", "answers": {} },
  "judge": { "model": "Qwen3-4B", "answers": {} },
  "confirmation": { "confirmed": true, "band": 0.15, "maxAbsDelta": 0.0 },
  "decision": "allow"
}
```

`decision` es la autorización final después de policy, Laya y confirmación. `confirmed: true` con `decision` distinta de `allow` es válido cuando ambos modelos acuerdan `deny` o `escalate`.

## Grant y tools (DEC-0015)

Un grant humano fija destino, activo, monto máximo y `policyVersion`. Su hash es el SHA-256 canónico de ese objeto. La wallet `agent` no obtiene `allow` de policy si el grant falta o si el pago no cabe en él. `recipient_match` compara contra ese grant.

`setOptions` niega por `signer_change_denied`. `invokeContract` niega por `contract_rail_closed`. `changeTrust` niega por `trustline_closed`. Ninguna de las tres abre las cinco preguntas. Solo un payment ya permitido por policy queda elegible.

El registro de verificación, separado del receipt v1, cita `grantHash`, `artifactSha256`, `corpusSha256` y `neighborIds`. El corpus `confirm` no se usa como vecino de su propio caso.

## Lo que el estándar afirma

Afirma que la policy permitió o negó, que Laya y el judge emitieron estos mapas, que la banda se cumplió o no, y que el artefacto citado tiene ese hash. El ancla de integridad del receipt Classic sigue siendo `MEMO_HASH` cuando el pago se firma. El registro no afirma por sí solo que el proceso de entrenamiento se haya ejecutado en una máquina concreta.
