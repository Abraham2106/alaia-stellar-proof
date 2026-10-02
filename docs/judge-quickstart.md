# Quickstart con judge obligatorio

`consider(input)` ahora devuelve una Promise. Usa `await consider(input)` y comprueba `decision === "allow"` y `envelope !== null` antes de firmar. `policyDecision` describe las reglas; `decision` describe la autorización final. Se eliminaron el campo `verdict` y `considerWithJudge()`. No hay modo policy-only para ejecutar pagos.

Esta ola usa **un Qwen3-4B y dos claves de firma** (DEC-0004). Los modelos no reciben claves. El proceso de firma permanece dentro del trust domain local: esto no protege frente a un administrador del host con ambas seeds.

## Preparación (puede necesitar internet)

Desde un clone limpio, instala las dependencias de los paquetes utilizados. Node.js 22+:

```bash
for package in policy receipt judge stellar-classic gateway localnet live; do
  (cd "packages/$package" && npm ci)
done
```

Instala `@qvac/cli` siguiendo su [guía oficial](https://docs.qvac.tether.io/cli/http-server/). Fija y registra la versión instalada para tu demo (`qvac --version`); el adaptador necesita una versión que soporte `json_schema` y `reasoning_budget: false` en chat completions.

Obtén un GGUF de Qwen3-4B de procedencia confiable y verifica su hash. Colócalo en `models/Qwen3-4B-Q4_K_M.gguf`, o cambia **solo el src local** en `qvac.config.json`. El archivo no se incluye en git. El alias HTTP `Qwen3-4B` identifica la configuración, pero no autentica los weights: conserva el SHA-256 y la procedencia por separado. El gateway aún no verifica ese hash.

Descarga también la imagen `stellar/quickstart` antes del ensayo offline. Una descarga o preload durante el pago no cumple el perfil offline.

## Ejecución local

En una terminal, desde la raíz:

```bash
qvac serve --openai --config qvac.config.json --host 127.0.0.1 --port 11434
```

Esperar a que Qwen esté cargado. El config usa un archivo local, preload y lazy load deshabilitado. Si el CLI o el modelo no están disponibles, **no existe un pago aprobado por Qwen**.

En otra terminal, comprobar el modelo sin Horizon y sin mocks:

```bash
cd packages/judge
ALAIA_QVAC=1 ALAIA_QVAC_LIVE=1 npm test -- tests/qvac.live.test.ts
```

Levantar Quickstart standalone con Horizon en 8000 (puede tardar en estar listo):

```bash
docker run --rm -d --name alaia-stellar-local \
  -p 127.0.0.1:8000:8000 stellar/quickstart --local
```

Luego, desde `packages/live`:

```bash
ALAIA_HORIZON=http://127.0.0.1:8000 \
ALAIA_QVAC=1 ALAIA_QVAC_URL=http://127.0.0.1:11434/v1 \
ALAIA_LIVE=1 npm test
```

La prueba judged envía únicamente tras ALLOW real, firma con ambas claves y verifica el MEMO_HASH en Horizon. Otra prueba comprueba que recovery weight 0 da `tx_bad_auth`, sin depender del judge. Con `ALAIA_LIVE=1`, faltar Horizon/QVAC falla; sin esa solicitud explícita las integraciones no disponibles aparecen como skipped.

## Verificaciones sin modelo

```bash
for package in policy receipt judge stellar-classic gateway localnet; do
  (cd "packages/$package" && npm test)
done
```

`qvac-transport.test.ts` usa un servidor HTTP fixture y `consider.test.ts` un runtime sustituido explícitamente. Prueban transporte/autoridad, **no** inferencia ni robustez del modelo. `runtime-boundary.test.ts` comprueba que el gateway real con QVAC desactivado no llama a red ni produce envelope. La prueba `qvac.live.test.ts` queda skipped salvo opt-in.

## Fallos y configuración

- Sin `ALAIA_QVAC=1`: `escalate`, `runtime_unavailable`, sin envelope.
- Servidor caído, modelo no cargado, HTTP error, redirect o respuesta truncada: mismo bloqueo.
- JSON inválido, keys extra, enum desconocido, códigos vacíos/duplicados: `schema_invalid` y bloqueo.
- Judge deny/escalate: decisión final correspondiente; policy allow no permite enviar.
- Policy deny: no se invoca el judge.
- `ALAIA_QVAC_TIMEOUT_MS`: 1–120000; default 30000 ms. Preload antes de solicitar pagos.
- `ALAIA_QVAC_API_KEY`: opcional si el servidor QVAC local requiere Bearer token; no se guarda en receipts.
- `ALAIA_QVAC_URL`: solo HTTP loopback con base `/v1`; no permite hosts LAN ni cloud, ni sigue redirects.

El receipt incluye request hash y verdict. No incluye el prompt completo ni el GGUF: guarda esos artefactos localmente si necesitas reconstruir la evaluación. MEMO_HASH acredita integridad del receipt y sigue sin ser proof of inference.
