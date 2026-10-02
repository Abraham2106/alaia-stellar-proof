# Prompt para los agentes que repararán el núcleo de ALAIA

Entregar este archivo al agente coordinador cuando se quiera reanudar la implementación. Su creación no ha iniciado agentes nuevos. El usuario pidió detener cambios de código en la sesión que produjo este documento.

---

Trabaja en `C:\Users\solan\Documents\Personal\Startup\ALAIA`. Tu objetivo es corregir los hallazgos del diagnóstico, demostrar cada corrección y dejar explícitos los bloqueos reales. Alcance: núcleo y pruebas; no modificar `ALAIA-site`, `ALAIA-wallets` ni construir web.

## 1. Fuentes y estado que debes recuperar

Lee antes de implementar:

- `AGENTS.md` y `orchestration/autonomy.md`.
- `docs/DIAGNOSTICO-NUCLEO-2026-10-01.md`: inventario de errores, causas y aceptación por ID.
- `FEATURE-PREPARATION.md`, `TASK-PLAN.md`, `orchestration/task-tree.json`.
- `docs/design/REQ-0001-product.md`, `docs/design/DECISIONS.md`, DEC-0004, DEC-0006 y DEC-0007.
- `docs/contracts/module-seams.md`, `docs/graders/runner.md`, `docs/judge-quickstart.md`.

No asumas que las líneas o estados del diagnóstico siguen vigentes: comprueba HEAD, status, worktrees y cambios locales. Si existe `.codegraph/`, usa CodeGraph antes de buscar código; no indexes un repo que no lo tiene.

Estado al entregar:

- Main en `d056424`; base de código auditado `5d0a1ab`.
- Worktree existente `orchestration/worktrees/T-005`, rama `agent/T-005`. Contiene corrección no integrada y no commiteada de gateway y sus tests.
- Ese worker ya terminó. Reportó 26 pruebas de gateway y build correctos; no hay todavía aceptación independiente ni merge.
- Main tiene documentos modificados. `docs/landing.md` y `docs/design/website-plan.md` son material anterior ajeno al núcleo. No sobrescribir, limpiar ni incluirlos por accidente.
- Preparación local existente: `orchestration/runtime/node_modules/.bin/qvac.cmd`, CLI 0.14.0, y modelo en `models/Qwen3-4B-Q4_K_M.gguf`. No imprimir secretos ni commitear runtime/modelos.
- El modelo tiene SHA-256 `7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5`; comprobar antes de usarlo.

## 2. Roles y disciplina

Actúa como coordinador/planner: no implementes código de dominio. Redacta decisiones faltantes, hojas y criterios. Delega al worker Composer 2.5 en su worktree; reviewer distinto; judge acepta o reabre. Si el modelo/herramienta no está disponible, registra el bloqueo y no inventes una ejecución.

Ejecución secuencial, una hoja y un seam por worker. Tarea ready y preparación válida antes de implementar. Dos rondas de review como máximo; después el judge decide. No mezcles implementación de un seam con otro para ahorrar un handoff.

Para ERR-001/002 inspecciona el trabajo existente T-005; no vuelvas a crear su rama o checkout. Para otros workers usa el mecanismo de spawn del repo después de resolver ERR-011. Si spawn falla parcialmente, conserva el worktree y reconcilia explícitamente su estado; no lo borres ni repitas a ciegas.

No hagas preguntas de diseño a mitad del worker. Detén esa hoja y devuelve la decisión al planner. Si falta una decisión de producto que no se deduce de los requisitos, registra BLOCKED con el hecho exacto y el criterio para continuar. No inventes APIs, recuperación, custodias, graders ni red pública.

Los mocks de QVAC admitidos por DEC-0006 son exclusivamente dobles explícitos para tests unitarios. No sirven para certificar integración, robustez ni inferencia. Mantén goldens fuera de prompts/acceso del worker; `.cursorignore` no es control de acceso suficiente por sí solo.

## 3. Trabajo, en orden

### A. Gobierno y orquestación — S-orch

Resuelve ERR-011/012. Reconcilia los estados históricos con la ejecución detenida y con cambios realmente integrados. No declares T-005 done por el relato del worker. No permitas que README anuncie un fix ausente en main.

El worker de orquestación normaliza colecciones del renderer de PowerShell y maneja un spawn parcial sin perder cambios. Prueba entradas vacías, singulares y múltiples, además de creación y reanudación coherente de handoffs. El planner registra esa reparación antes de delegarla.

### B. Gateway — S-gateway

Revisa y completa T-005 para ERR-001/002 según DEC-0007:

- Policy deny conserva precedencia y no llama al judge.
- Arista conocida que pertenece a otro pago: deny con `graph_candidate_mismatch`, sin judge/envelope.
- Cubrir discrepancias de source y destination por separado.
- Policy allow y arista desconocida: final/receipt escalate, `policyDecision` allow, `graph_unknown`, envelope nulo.
- Arista coincidente y conocida: judge obligatorio; allow válido genera envelope; deny/escalate no lo generan.
- Decodificar un envelope del control positivo con cuentas válidas y comprobar memo/hash.

Verifica diff, tests y build independientemente antes de aceptar. No amplíes la API de forma implícita.

### C. Runner live — S-live

Resuelve ERR-003/004/005/009/013 y actualiza la expectativa live afectada por ERR-002:

- Opt-in antes de cualquier acceso a red, incluso durante imports.
- Sin opt-in, cero I/O de integración. Con opt-in, dependencias faltantes fallan, nunca se ocultan como skips.
- Aislar y restaurar entorno del control QVAC deshabilitado; no contaminar las otras pruebas.
- Todas las peticiones y enlaces descubiertos permanecen en loopback; redirects prohibidos. Fixtures locales explícitos prueban esta frontera; las integraciones conservan servicios reales.
- Verificar en ledger los tres umbrales, master y pesos de firmantes; rechazo con una firma y control válido con ambas.
- Dividir el test de 511 líneas en helpers y escenarios dentro del mismo seam, sin introducir efectos al importar.

Si necesitas cambiar `packages/localnet/`, el planner debe separar S-local y especificar su contrato URL antes de delegar. No edites ese paquete desde el worker S-live.

### D. Grader público — S-grader

Resuelve la parte de etiquetado de ERR-007: `invoice_lie` -> `admin_operation`, `signature_bypass_stand_in` -> `fee_over_cap`, `destination_swap` -> `destination_denied`; conserva `allowed_control`. Actualiza tests y consumidores comprobados.

Esto solo corrige honestidad del reporte. Los negativos semánticos, post-aprobación y criptográficos permanecen abiertos hasta ser implementados y ejecutados en sus respectivas tareas.

### E. Contratos pendientes — planner primero

Para ERR-006/008/010/014 escribe DEC adicionales antes de cualquier implementación:

- Recuperación: define incidente recuperable, autoridad, custodia y procedimiento. Peso cero elimina el signer adicional; asignar peso suficiente para firmar pagos cambia el modelo de autoridad y no es un arreglo trivial.
- Firma: asigna un dueño a la comprobación entre aprobación y payload firmado. Explica el límite del host con ambas seeds. Prueba mutación antes de firma y después de firma como propiedades distintas.
- Evidencia: define persistencia y reconstrucción desde artefactos reales, con preimages y hashes necesarios, sin secretos ni promesas de proof of inference.
- Grader oculto: define corpus y runner independiente a partir de contratos cerrados; respuestas reservadas fuera del contexto del worker.

No marques ninguna de estas tareas ready con un contrato crítico sin cerrar. Descompón cada implementación en su seam y worktree. Si no se puede derivar el contrato de los requisitos disponibles, entrega el bloqueo exacto al coordinador; no lo completes con una hipótesis presentada como hecho.

### F. Infraestructura y aceptación real — tester/judge

Resuelve INF-001/002 por diagnóstico, sin reemplazar sistemas:

- QVAC falló por timeout de inicialización del worker. Vulkan no detectado y poca memoria son hipótesis a comprobar, no causa raíz establecida.
- Docker estaba starting y no exponía el pipe. Comprueba estado actual y logs; no resetees Docker ni borres volúmenes/contenedores ajenos.
- Mantén Quickstart standalone y endpoints loopback. Descarga o prepara dependencias antes del ensayo offline.
- No sustituyas QVAC por llama.cpp, otro modelo, mock o cloud para declarar éxito del requisito QVAC/Qwen.
- No eludas la revisión de aprobaciones. La última consulta adicional de Docker fue bloqueada por límite del revisor automático, sin llegar a ejecutarse.

## 4. Verificación requerida

La base fue 85 pruebas aprobadas y 5 integraciones omitidas. Son números históricos, no un objetivo al que ajustar las pruebas. Las dos compilaciones fallidas se resolvieron con dependencias fijadas, sin cambios de código.

Ejecuta tests y builds según los scripts reales, instalando con `npm ci` cada paquete y sus dependencias locales cuando corresponda. Paquetes: policy, receipt, judge, stellar-classic, rag-graph, gateway, localnet, grader-negative y live. Live no declara build; revisa su tsconfig si añades chequeo de tipos y no lo confundas con un script existente.

Para integración QVAC: habilita `ALAIA_QVAC=1` y `ALAIA_QVAC_LIVE=1`, y ejecuta el test real de judge. Para ledger: Horizon standalone preparado, `ALAIA_QVAC=1`, `ALAIA_LIVE=1`, y suite live. Revisa los comandos canónicos en `docs/graders/runner.md`.

Pruebas mínimas de aceptación:

1. Gateway: policy y grafo no son ampliados por el judge; identidad del candidato vinculada al pago; resultados coherentes.
2. Transporte: cero red sin opt-in y ninguna salida pública por redirects/enlaces. Fallos explícitos si falta infraestructura solicitada.
3. Ledger: configuración completa, una firma insuficiente, dos firmas válidas, pago aprobado realmente por Qwen y MEMO_HASH correspondiente.
4. Negativos reales: factura/intent conflictivo, sustitución después de aprobación y firmas no autorizadas, separados de reglas de policy.
5. Recuperación y reconstrucción: procedimientos aprobados por DEC, ejercidos con artefactos reales y sin ampliar autoridad de gasto.
6. Grader reservado: ejecutado por judge con evidencia independiente; no suministrado al worker.

No afirmes aislamiento offline solo porque una constante dice `publicInternet: false`. Explica qué se inspeccionó y qué control de red o evidencia se usó realmente. No pruebes fallos externos haciendo peticiones a servicios públicos.

## 5. Entrega y criterios de cierre

Por cada ID entrega: estado anterior, causa confirmada, solución, archivos/commit, comandos y exits, resultado del reviewer, evidencia y rollback. Distingue ejecutado de planeado y reporte del worker de verificación independiente.

Estados permitidos en el informe: corregido y verificado; corregido pendiente de integración; bloqueado por hecho externo; requiere decisión de diseño. No cierres con «done» una prueba omitida, un mock o un archivo documental que describe código inexistente.

Actualiza TASK-PLAN y JSON sin contradicciones; captura lecciones en field-guide. Conserva cambios ajenos. No hagas push o publicación sin autorización aplicable. Si una hoja falla, conserva el worktree y revierte solo cambios identificados de esa hoja mediante el mecanismo acordado; no uses limpiezas destructivas para recuperar estado.

El objetivo es una reparación demostrable del núcleo. Si la integración sigue bloqueada, entrega el núcleo verificado y un BLOCKED preciso sin anunciar que la demo completa funciona.
