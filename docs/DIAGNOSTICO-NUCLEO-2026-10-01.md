# Diagnóstico del núcleo y las pruebas de ALAIA

Fecha: 2026-10-01, America/Costa_Rica. Alcance: núcleo, pruebas y ejecución local; web excluida.

**Registro histórico anterior a la reanudación.** El usuario después autorizó
reparaciones con Composer headless. El estado actualizado y su evidencia se
registran en `ESTADO-REPARACION-NUCLEO-2026-10-01.md`; los snapshots siguientes
describen el diagnóstico original, no el HEAD posterior a las reparaciones.

Este documento registra los hallazgos de la revisión, sus causas y su solución. No es una certificación de seguridad ni un resultado de integración completa. El usuario detuvo la implementación y pidió entregar diagnóstico y prompt para otros agentes.

## Estado exacto de entrega

- Código revisado inicialmente: `5d0a1ab`. HEAD actual de main: `d056424`, que agrega documentación de reparación y `.cursorignore`; no integra la corrección del gateway.
- Existe trabajo previo sin commit en `orchestration/worktrees/T-005`, rama `agent/T-005`: `packages/gateway/src/considerWithGraph.ts` y su test. Ese worker terminó; no debe tratarse como una tarea todavía ejecutándose ni como una corrección integrada.
- El worker reportó 26 pruebas de gateway aprobadas y build correcto. Es evidencia del worker, pendiente de revisión independiente e integración.
- Main conserva modificaciones documentales en `README.md`, `docs/graders/README.md` y `docs/judge-quickstart.md`. `docs/landing.md` y `docs/design/website-plan.md` ya existían sin seguimiento; no forman parte de esta reparación.
- No se realizó push ni merge del worktree de reparación. No iniciar nuevas implementaciones por el mero hecho de leer este diagnóstico.

## Evidencia ejecutada

| Paquete | Pruebas aprobadas en main | Omitidas | Build inicial |
|---|---:|---:|---|
| policy | 11 | 0 | correcto |
| receipt | 9 | 0 | correcto |
| judge | 21 | 1 | correcto |
| stellar-classic | 8 | 0 | falló por tipos Node ausentes |
| rag-graph | 6 | 0 | correcto |
| gateway | 19 | 0 | falló por tipos Node ausentes |
| localnet | 6 | 0 | correcto |
| grader-negative | 5 | 0 | correcto |
| live | 0 | 4 | no declara script build |

Total inicial: **85 aprobadas y 5 omitidas**. Después de `npm ci` en gateway y stellar-classic, ambas compilaciones pasaron. No fue necesario modificar TypeScript ni lockfiles. El conjunto completo de ocho builds quedó comprobado, pero no todos en una única ejecución posterior.

Referencia local adicional: `orchestration/runs/BASELINE-2026-10-01.md`. Las integraciones omitidas no son pruebas aprobadas y no demuestran inferencia ni pagos en ledger.

## Clasificación

- **P1:** impide confiar en una propiedad de autorización, en la aceptación del MVP o en la integración real.
- **P2:** inconsistencia de verificación, documentación, entorno o mantenimiento que debe corregirse antes del cierre.
- **Inspección:** el defecto se observa en el código; no implica que se haya ejecutado un exploit ni una prueba live.
- **Requisito pendiente:** falta implementación o evidencia; no se atribuye un comportamiento inexistente al sistema.

## Errores y requisitos pendientes

### ERR-001 — El grafo valida cuentas distintas de las del pago

- **Tipo / prioridad / estado:** autorización, P1, confirmado por inspección en main; parche aislado sin integrar.
- **Dónde:** `packages/gateway/src/considerWithGraph.ts:53`; `assess(candidate, policyAllows)` en línea 71 y `consider(input)` en 79.
- **Por qué:** `candidate` e `input` son entradas independientes. Una arista conocida puede acompañar un pago real con otros extremos. La policy y Qwen todavía deben permitirlo; el defecto evita únicamente la comprobación del grafo.
- **Solución:** exigir igualdad de `candidate.from` con `input.sourcePublic` y de `candidate.to` con `input.destination`. Tras policy allow, una discrepancia produce `deny`, `graph_candidate_mismatch`, sin llamar al judge ni construir envelope. DEC-0007 ya lo especifica.
- **Cierre:** regresiones para cada extremo y para una arista conocida ajena al pago real; control positivo con extremos coincidentes y judge obligatorio. Revisar primero el parche T-005 para no duplicarlo.

### ERR-002 — Un bloqueo del grafo devuelve autorización final allow

- **Tipo / prioridad / estado:** contrato de resultado y recibo, P1, confirmado por inspección en main; parche aislado sin integrar.
- **Dónde:** `packages/gateway/src/considerWithGraph.ts:14`, especialmente línea 31; expectativa incorrecta en `packages/live/tests/classic-payment.live.test.ts:428`.
- **Por qué:** el helper copia la decisión de policy al resultado final aunque el grafo retenga el envelope. El receipt también declara allow.
- **Solución:** para policy allow y arista desconocida, conservar `policyDecision: allow`, pero devolver `decision: escalate`, receipt equivalente, `graph_unknown` y envelope nulo. Una negativa de policy conserva precedencia.
- **Cierre:** test de coherencia resultado/receipt y actualización de consumidores y tests live. La ausencia de envelope ya impedía el envío en el flujo que lo comprueba; no afirmar que este error por sí solo envía fondos.

### ERR-003 — La prueba «sin QVAC» depende de QVAC apagado fuera del test

- **Tipo / prioridad / estado:** aislamiento de pruebas, P1, confirmado por inspección; falta reproducción con infraestructura real.
- **Dónde:** último test de `packages/live/tests/classic-payment.live.test.ts`, desde línea 439; espera `escalate` y `runtime_unavailable` en líneas 490–492.
- **Por qué:** invoca el runtime real sin desactivar QVAC. El comando documentado de la suite establece `ALAIA_QVAC=1`, por lo que el resultado depende del modelo en vez de probar ausencia del runtime.
- **Solución:** desactivar QVAC exclusivamente durante ese control y restaurar el valor anterior incluso si falla. Evitar interferencia entre pruebas concurrentes.
- **Cierre:** la suite debe pasar con QVAC activo; el control sin runtime no debe hacer inferencia ni enviar transacciones.

### ERR-004 — La suite live hace I/O sin opt-in y omite pruebas solicitadas

- **Tipo / prioridad / estado:** ejecución de tests, P1, confirmado por inspección.
- **Dónde:** `packages/live/tests/classic-payment.live.test.ts:56`, `:253`, `:257`, `:313`, `:385`, `:440`.
- **Por qué:** el descubrimiento de Horizon ocurre durante la importación. Si existe Horizon, los tests pueden financiar y configurar cuentas sin `ALAIA_LIVE=1`. Las dos pruebas del grafo omiten si falta Horizon sin comprobar el opt-in, aunque las dos primeras sí fallan.
- **Solución:** aplicar una única entrada explícita al modo live antes de cualquier fetch. Sin opt-in, omitir integraciones sin red. Con opt-in, fallar ante dependencias requeridas ausentes; no reemplazar el fallo por skip.
- **Cierre:** comprobar cero llamadas de red sin opt-in; ejecución explícita sin servicios devuelve exit no cero; con servicios se ejecutan todas las integraciones requeridas.

### ERR-005 — El runner puede salir de loopback por redirects o Friendbot

- **Tipo / prioridad / estado:** frontera de red, P1, confirmado por inspección; no se ejecutó salida a red pública.
- **Dónde:** fetch de `packages/live/tests/classic-payment.live.test.ts:19`, `:70`, `:72`, `:78`, `:96`, `:112`, `:148`, `:173`, `:196`; `packages/localnet/src/assertLocalHorizon.ts`.
- **Por qué:** validar la URL inicial no valida el destino de una redirección. Los fetch no la prohíben. Además, el enlace alternativo de Friendbot se toma del header y se consulta sin validar loopback. El validador compartido solo comprueba hostname.
- **Solución:** validar cada URL realmente solicitada y prohibir redirects. Validar también el enlace descubierto; rechazar esquemas y credenciales no admitidos. Si se cambia el validador compartido, crear una hoja separada S-local con contrato explícito.
- **Cierre:** fixtures HTTP locales explícitos para redirect y enlace externo; confirmar que el destino externo nunca recibe una petición. Mantener la integración real separada de esos fixtures.

### ERR-006 — recoverySigner no implementa recuperación

- **Tipo / prioridad / estado:** requisito de custodia sin implementar, P1, confirmado en código; solución requiere decisión de diseño.
- **Dónde:** `packages/stellar-classic/src/budget.ts:43` y `:74`; DEC-0004, punto 2; test live desde línea 256.
- **Por qué:** recovery se configura con peso cero. Stellar elimina un signer adicional con ese peso; no queda una llave especial capaz de recuperar la cuenta. El test solo demuestra rechazo de su firma. [Semántica oficial de Set Options](https://developers.stellar.org/docs/learn/fundamentals/transactions/list-of-operations).
- **Solución:** el planner debe definir qué pérdida se recupera, quién autoriza, qué secretos se conservan y cómo se mantiene 2-de-2 para pagos. Registrar una DEC antes de implementar. No «arreglar» elevando recovery a peso 2: con umbral de pago 2 eso le daría autoridad unilateral. [Autorización por pesos y umbrales](https://developers.stellar.org/docs/learn/fundamentals/transactions/signatures-multisig).
- **Cierre:** recuperación real probada en standalone y casos negativos que demuestren que no se concedió un bypass de gasto. Hasta entonces, describirla como pendiente.

### ERR-007 — Los nombres del grader prometen pruebas que no ejecutan

- **Tipo / prioridad / estado:** validez de evidencia, P1, confirmado por inspección.
- **Dónde:** `packages/grader-negative/src/runNegativeCases.ts:18` y casos desde línea 33; sus tests.
- **Por qué:** `invoice_lie` agrega `setOptions`; `signature_bypass_stand_in` excede la comisión; `destination_swap` usa un destino fuera de allowlist. Solo se ejecuta policy, sin factura semántica, firma ni aprobación previa.
- **Solución:** renombrar a `admin_operation`, `fee_over_cap`, `destination_denied` y conservar `allowed_control`. Después crear tareas distintas para negativos semánticos con Qwen real y firmas/mutaciones con SDK/ledger. Renombrar no satisface esos requisitos faltantes.
- **Cierre:** cada etiqueta corresponde al mecanismo ejercido y los reportes separan policy, inferencia y ledger.

### ERR-008 — No está demostrada la protección entre aprobación y firma

- **Tipo / prioridad / estado:** requisito y contrato de integración, P1; ausencia de verificación confirmada, no bypass del gateway demostrado.
- **Dónde:** `packages/stellar-classic/src/payment.ts:75`; `packages/stellar-classic/tests/classic.test.ts:53`; REQ-0001, sección 6.
- **Por qué:** `signEnvelope` firma el XDR recibido sin exigir prueba de que sea el envelope aprobado. El test compara hashes de dos transacciones antes de firmar; no verifica rechazo de una mutación en un flujo de aprobación/firma. El snapshot de `consider()` sí protege una mutación durante el await, pero es otra propiedad.
- **Solución:** definir en una DEC el dueño de la frontera de firma y el vínculo con la aprobación original —payload/hash, receipt, red y secuencia—. Preservar el límite de confianza del host; un helper genérico no debe confundirse con un firmante que aplica policy.
- **Cierre:** cambiar destinatario/monto/memo tras aprobación debe impedir la firma autorizada; cambiar el XDR después de firmarlo debe invalidar firmas. Verificar también rechazo de una sola firma frente a éxito de ambas en el ledger local.

### ERR-009 — La configuración 2-de-2 no se comprueba completamente en ledger

- **Tipo / prioridad / estado:** cobertura de aceptación, P2, confirmado por inspección.
- **Dónde:** `packages/live/tests/classic-payment.live.test.ts:287`; pruebas de budget en `packages/stellar-classic/tests/classic.test.ts:135`.
- **Por qué:** la prueba live verifica medThreshold y peso master, pero no los tres umbrales y pesos de A/B como conjunto. Los unitarios inspeccionan la especificación y parte del XDR; eso no confirma el estado completo que aceptó Horizon.
- **Solución:** comprobar low/med/high, master, firmantes A/B y ausencia de autoridades no previstas en la cuenta creada por el test. Verificar una firma rechazada y dos aceptadas.
- **Cierre:** evidencia del ledger correspondiente a la cuenta de prueba y al mismo run; no usar solo el objeto local `spec`.

### ERR-010 — Falta un paquete persistido para reconstruir una disputa

- **Tipo / prioridad / estado:** evidencia de requisito, P2, pendiente; no es fallo del hash.
- **Dónde:** `packages/gateway/src/consider.ts:73`, `:96`, `:102`; `packages/receipt/src/types.ts`; `docs/judge-quickstart.md:78`.
- **Por qué:** se guarda un hash de solicitud y verdict, pero el resultado no conserva el preimage completo del request. El Quickstart pide guardar prompt/GGUF por separado; no existe un procedimiento automatizado verificado de reconstrucción completa desde artefactos persistidos.
- **Solución:** decidir el dueño y formato del paquete de evidencia: solicitud exacta, policy, receipt, XDR, red, transacción y referencia/hash del modelo, sin claves. El hash no permite recuperar el contenido faltante.
- **Cierre:** reconstruir desde archivos guardados y detectar cualquier cambio de receipt/request. Mantener explícito que integridad no demuestra ejecución del modelo ni replay universal.

### ERR-011 — spawn falla después de crear el worktree

- **Tipo / prioridad / estado:** orquestación PowerShell, P2, reproducido.
- **Dónde:** `orchestration/orchestrate.ps1:79`, `:86`, `:225`; worktree creado en línea 241 antes de renderizar el prompt.
- **Por qué:** la salida filtrada de `$items` puede quedar como scalar; con StrictMode, `.Count` falla en la ejecución observada de Windows PowerShell. El error ocurrió después de crear `agent/T-005`, antes de terminar el handoff y actualizar status.
- **Solución:** normalizar el resultado completo del pipeline como array, comprobar/renderizar antes de efectos Git cuando sea posible y definir recuperación segura de un spawn parcial. No borrar ni recrear el worktree existente.
- **Cierre:** entradas vacías, una y varias; spawn deja worktree, prompt, handoff y status coherentes. Reintento identifica el checkout existente y no elimina cambios.

### ERR-012 — Gobierno y documentación mezclan estados distintos

- **Tipo / prioridad / estado:** control de trabajo, P2, confirmado; parte se originó durante esta reanudación incompleta.
- **Dónde:** `TASK-PLAN.md`, `orchestration/task-tree.json`, `FEATURE-PREPARATION.md`, `AGENTS.md`, `docs/design/REQ-0001-product.md:3`, `README.md:12`.
- **Por qué:** el registro original decía que faltaban requisitos ya respondidos. Ahora el gate está acotado a reparaciones, pero sobreviven textos históricos. TASK-PLAN todavía muestra T-005 y T-008 como ready; el JSON registra in_progress y done respectivamente. README describe el fix del grafo, que solo existe en el worktree.
- **Solución:** reconciliar docs con el código efectivamente integrado, distinguir preparación de reparación y aceptación del MVP, y registrar que el usuario detuvo la implementación para entregar diagnóstico. No cerrar T-005 automáticamente por el reporte del worker.
- **Cierre:** estados consistentes, evidencia referenciada y ausencia de afirmaciones de fixes que no están en main.

### ERR-013 — La suite live supera el límite de tamaño del repositorio

- **Tipo / prioridad / estado:** mantenimiento y gobierno, P2, confirmado: 511 líneas.
- **Dónde:** `packages/live/tests/classic-payment.live.test.ts`.
- **Por qué:** mezcla transporte Horizon/Friendbot, fixtures, firma, aserciones de ledger y escenarios. AGENTS.md pide detener un archivo de más de aproximadamente 400 líneas sin dueño del split.
- **Solución:** asignar el split a S-live y extraer helpers cohesionados dentro del mismo paquete, manteniendo semántica y límites de red.
- **Cierre:** archivos bajo el umbral, escenarios legibles y sin efectos de red al importar helpers.

### ERR-014 — El grader oculto requerido no existe

- **Tipo / prioridad / estado:** aceptación incompleta, P1, confirmado.
- **Dónde:** `docs/graders/README.md`, `docs/graders/runner.md`; no hay corpus de goldens aprobado.
- **Por qué:** las pruebas públicas se implementaron sin completar el artefacto independiente que exigía el gobierno. Un runner documentado no sustituye un corpus ni una revisión de resultados.
- **Solución:** planner/judge define inputs, propiedades y resultados reservados según contratos cerrados; worker solo recibe mecánica y criterios públicos. Aislar answers de prompts y acceso del worker; `.cursorignore` por sí solo no es una barrera de permisos.
- **Cierre:** corpus versionado/controlado, runner ejecutable y evidencia independiente contra el entorno local, sin filtración de answers al worker.

## Bloqueos de infraestructura

### INF-001 — QVAC no logra cargar el modelo real

- **Tipo / prioridad / estado:** runtime, P1, reproducido; causa raíz no aislada.
- **Evidencia:** CLI `@qvac/cli@0.14.0` instalado localmente en `orchestration/runtime`. El arranque terminó con `RPC initialization timed out after 30000ms` y `All 1 preload model(s) failed to load; refusing to start`, exit 1.
- **Condiciones observadas:** doctor reportó 15.21 GB RAM total, 1.07 GB disponible y Vulkan ICD no encontrado. Su exit 0 solo cubrió los checks obligatorios, no inferencia. Vulkan y memoria son candidatos a investigar, no causas demostradas del timeout.
- **Solución:** examinar logs del worker y resolución de dependencias, comprobar Vulkan/controladores y memoria disponible, corregir el requisito comprobado y repetir preload. No sustituir QVAC por un mock, otro modelo o un proveedor cloud. [Requisitos oficiales](https://docs.qvac.tether.io/system-requirements/).
- **Cierre:** modelo cargado y `packages/judge/tests/qvac.live.test.ts` aprobado con QVAC real.
- **Modelo preparado:** `models/Qwen3-4B-Q4_K_M.gguf`; SHA-256 verificado `7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5`. [Origen oficial](https://huggingface.co/Qwen/Qwen3-4B-GGUF/blob/main/Qwen3-4B-Q4_K_M.gguf). Evidencia adicional: `orchestration/runs/MODEL-PROVENANCE.md`. No volver a descargarlo sin comprobar primero archivo y hash.

### INF-002 — Docker no expuso el motor local durante la comprobación

- **Tipo / prioridad / estado:** infraestructura, P1, observado; estado actual puede haber cambiado.
- **Evidencia:** Docker Desktop fue iniciado en segundo plano. `docker info` y `docker image ls` fallaron por pipe `dockerDesktopLinuxEngine` ausente; el último status observado fue `starting`. WSL reportó Ubuntu y versión predeterminada 2.
- **Por qué:** el motor no estaba disponible; no se aisló si era demora, bloqueo de WSL u otro fallo. No se verificó disponibilidad de la imagen Quickstart.
- **Solución:** comprobar estado y logs actuales de Docker/WSL, resolver el fallo específico y preparar Quickstart standalone con puertos loopback. No resetear Docker, borrar volúmenes o detener contenedores ajenos como solución automática.
- **Cierre:** Horizon local listo y suite live con todas las dependencias, cero integraciones requeridas omitidas. Preparar descargas antes del ensayo offline.

## Incidencias de entorno: no confundir con bugs de producto

### ENV-001 — Dependencias instaladas incompletas: resuelto localmente

- **Tipo / prioridad / estado:** instalación, P2, resuelto en main.
- **Causa y evidencia:** faltaba `@types/node` en node_modules de gateway y stellar-classic, aunque estaba declarado. Aparecían TS2580 para Buffer/process y TS2307 para node:crypto.
- **Solución ejecutada:** `npm ci --no-audit --no-fund` en ambos paquetes y sus builds: exit 0. No se cambiaron versiones ni código.
- **Para otro checkout:** instalar desde lockfiles también las dependencias locales enlazadas. No editar tsconfig para ocultar una instalación incompleta.

### ENV-002 — Restricciones de sandbox y fallo del revisor automático

- **Tipo / prioridad / estado:** herramientas, P2; no demuestra fallo del producto.
- **Evidencia:** el primer intento de Vitest no pudo iniciar esbuild por acceso a rutas Windows; se ejecutó después fuera del sandbox con revisión autorizada. Git requirió `safe.directory` acotado al repo. Windows PowerShell exigió `-ExecutionPolicy Bypass` para ese proceso.
- **Bloqueo posterior:** una consulta adicional del estado de Docker no se ejecutó porque la revisión automática de aprobación falló por límite de uso. El mensaje aclaró que no era una determinación de acción insegura.
- **Solución:** usar las vías de aprobación disponibles o resolver el límite del revisor; no cambiar herramienta o permisos para eludirlo. No conceder `safe.directory=*` ni desactivar políticas globalmente.
- **Cierre:** registrar las comprobaciones que sí se ejecutaron; no atribuir al último comando denegado ningún resultado de Docker.

## Orden de reparación recomendado

1. Reconciliar estado documental y revisar T-005; no integrar sin verificar ERR-001/002.
2. Corregir el spawn de orquestación y preparar hojas aisladas para S-live/S-grader.
3. Reparar ERR-003/004/005/009/013 en S-live; dividir S-local si se cambia su contrato compartido.
4. Corregir etiquetas de ERR-007 sin declarar satisfechos sus negativos faltantes.
5. Planner cierra contratos de recuperación, firma y evidencia: ERR-006/008/010/014. Cada implementación recibe su propia hoja y seam.
6. Resolver INF-001/002 y ejecutar aceptación real. No convertir skips o mocks en éxito.

Prompt reutilizable: [PROMPT-REPARACION-NUCLEO.md](PROMPT-REPARACION-NUCLEO.md).
