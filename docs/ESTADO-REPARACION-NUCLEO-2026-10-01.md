# Reparación del núcleo de ALAIA

Fecha: 2026-10-01, America/Costa_Rica. Coordinación/review: Codex;
implementación: Composer 2.5 vía Cursor CLI headless, una hoja por worktree.
Alcance: núcleo y pruebas; sitio y documentos de diseño web previos excluidos.

## Restricción actual

El usuario pidió **no cargar Qwen y pausar sus pruebas por RAM al 100%**.
El servidor QVAC se detuvo y se comprobó que no quedaran sus procesos ni el
puerto 11434 abierto. Ninguna prueba posterior debe cargar el modelo sin
reanudación explícita. La pausa de inferencia no se declara prueba aprobada.

## Evidencia real anterior a la pausa

- CLI QVAC 0.14.0 instalado localmente; Qwen3-4B GGUF cargó realmente en loopback.
- Fallo de arranque localizado: `files.model[0] must be an absolute path`.
  Se resolvió en configuración **local ignorada**, conservando el config portable
  del repo. No guardar una ruta Windows particular en el config compartido.
- SHA-256 del GGUF preparado:
  `7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5`.
- Control QVAC explícito: **falló**, obtuvo deny/untrusted_instruction en pago
  legítimo con evidencia null. DEC-0012 permite aclarar la distinción de confianza;
  hasta verificar nuevamente el modelo, ese falso rechazo continúa pendiente.
- El CLI avisó `Ignoring unsupported param: seed=42`. La configuración solicitada
  y su hash no demuestran que el backend aplicó seed ni replay bit-a-bit.
- Docker quedó en starting con HTTP 500 y sin init/engine; se inspeccionó
  docker-desktop y solo había init/vpnkit, sin dockerd/containers. El intento de
  reinicio no recuperó el motor. Se cerraron los procesos de ese arranque y esa
  distribución para aliviar recursos; no se borraron volúmenes ni datos.

## Reparaciones verificadas hasta ahora

| Hoja | Cambio | Evidencia independiente | Integración en main |
|---|---|---|---|
| T-005 | Grafo ligado a source/destination; unknown escala receipt/result | 26 tests, build exit 0 | 536ede5 |
| T-011 | Arrays vacíos/singular/múltiples, spawn reanudable y handoff preservado | suite PowerShell exit 0 | archivos locales orchestration/ |
| T-012 | HTTP loopback, sin credenciales/fragmentos, puerto válido | 10 tests, build exit 0 | 654ab80 |
| T-013 | Firma vinculada; backups scrypt/AES-GCM; recovery weight 0 no autoridad | 33 tests, build exit 0 | 9a70827 |
| T-014 | Bundle JSON con manifest, receipt/request hashes y parse estricto | 35 tests, build exit 0 | 1892ec0 |
| T-015 | Preimagen del descriptor QVAC conservada en gateway | 35 tests, build exit 0; wrapper timeout declarado | c95b3d9 |
| T-006 | Opt-in live, URLs/redirects/standalone, deadline y env restore | 15 frontera; typecheck 0; 2 fallos exigidos sin Horizon | 4ee1f6b |

Este registro se actualiza al cerrar las hojas restantes. No representa todavía
aceptación de la demo completa.

## Límites de las propiedades

`signApprovedEnvelope` exige approval confiable y cuerpo exacto antes de firmar;
no protege frente a un administrador con ambas seeds que eluda el helper.
La recuperación restaura copias operativas perdidas usando backups y passphrases
separados; no añade un tercer voto ni recupera pérdida de todos los respaldos.
La limpieza de buffers no promete borrar strings JS de memoria.

El bundle vincula preimágenes e integridad. Su manifest no autentica un bundle
malicioso recalculado; el MEMO_HASH del ledger es la referencia independiente.
El descriptor QVAC guardado es la preimagen de requestHash, con prompt/schema/
parámetros; no contiene headers de transporte ni acredita inferencia.

Orquestación, worktrees y handoffs están ignorados por la configuración existente
de git. Sus correcciones y evidencias persisten en el workspace local. Los commits
de paquetes se integran localmente; no se realizó push ni publicación.

## Verificación pendiente

Reanudar Qwen solo tras instrucción explícita del usuario y con memoria suficiente.
Recuperar Docker sin reset de datos; levantar únicamente Quickstart standalone.
La prueba real completa debe demostrar control allow, negativos semánticos,
umbrales/pesos 2-de-2, rechazo de una firma y de alteraciones, restauración y
MEMO_HASH/bundle reconstruido desde el ledger. Ningún skip ni doble cierra esto.
