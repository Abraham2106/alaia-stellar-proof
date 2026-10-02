# Website plan — ALAIA (propuesta de planner)

- Status: `draft` — propuesta, no decisión. No hay `DEC-*` del sitio todavía.
- Date: 2026-10-01
- Fuentes: `docs/landing.md`, `README.md`, `Idea.md`, `alaia-proof-context.md` (§1, §10 H.2–H.3, §11, §14, §16), `REQ-0001-product.md`, `DEC-0002`…`DEC-0006`, `docs/judge-quickstart.md`, `docs/contracts/module-seams.md`, código en `packages/policy` y `packages/grader-negative`.
- Referencias visuales: capturas de webs de wallets Stellar (fuera del repo, carpeta temporal `stellar-wallets/`).
- Regla: todo lo que no sale de esas fuentes está marcado `TBD` o `propuesta`.

## 0. Hallazgo que condiciona todo el plan

ALAIA **no es una wallet**. Según `docs/landing.md` y `README.md` es una pasarela de políticas local para pagos que un agente de IA quiere hacer en Stellar Classic: reglas deterministas + grafo sintético + un juez local (Qwen3-4B vía QVAC) deciden; el código firma con una cuenta de presupuesto 2-de-2. `DEC-0004` y `REQ-0001` §5/§7 prohíben **UI de producto** en esta ola y excluyen mainnet y la custodia de una wallet principal.

Consecuencia: el patrón de las webs de wallets (saldo en USD, Send/Swap/Receive, mock de teléfono o extensión) **no aplica** y sería engañoso. No hay app que mostrar en un teléfono ni en una extensión. El visual de producto tiene que ser un artefacto real: el flujo de decisión, la salida de una ejecución local y un recibo.

## 1. Objetivo y audiencia

| Campo | Valor | Fuente |
|---|---|---|
| Qué es | Pasarela de políticas local para pagos de agentes en Stellar Classic; el modelo no firma ni amplía permisos | `landing.md`, `README.md`, `DEC-0006` |
| Contexto | Demo de hackathon (General Track) | `Idea.md`, `DEC-0004` |
| Acción que pide hoy el copy | Abrir el repositorio o levantar el Quickstart local y recorrer el camino feliz | `landing.md` (cierre) |
| Audiencia principal | **Inferida**: jurado del hackathon y desarrolladores Stellar que quieran correr la demo. Confirmar | `Idea.md` + CTA de `landing.md` |
| Audiencia comercial futura | Hipótesis, no hecho: B2B de facturas/procurement con operador identificado | `alaia-proof-context.md` §H.2 ("hipótesis comercial, no forecast") |
| Evento concreto, fecha de entrega, rúbrica | `TBD` | `alaia-proof-context.md` §16.10 |
| Métrica de éxito del sitio | `TBD` (¿visitas al repo? ¿ejecuciones del Quickstart? ¿evaluación del jurado?) | — |

Objetivo propuesto del sitio: que un evaluador entienda en menos de un minuto **qué decide ALAIA, qué rechaza y qué no promete**, y llegue al repositorio o al Quickstart con la evidencia a mano.

## 2. Mapa del sitio (propuesta mínima)

Principio: lo mínimo que sirve a la demo. La documentación técnica ya vive en el repo; el sitio enlaza, no duplica.

| Ruta | Para qué | Fuente del contenido | Prioridad |
|---|---|---|---|
| `/` | Home de una sola página: qué es, cómo pasa un pago, qué se rechaza, cuenta 2-de-2, recibo, todo local | `docs/landing.md` | P0 |
| `/limites` (nombre `TBD`) | "Qué demuestra y qué no": recibo ≠ prueba de inferencia, mismo host para ambas claves, sin mainnet, judge no verificado como robusto | `alaia-proof-context.md` §1/§14, `DEC-0006`, `judge-quickstart.md` | P0 |
| Enlace externo: repositorio | Código, tests, decisiones | `git remote` → `github.com/Abraham2106/alaia-stellar-proof` (¿público? `TBD`) | P0 |
| Enlace externo: Quickstart | Correr la demo local | `docs/judge-quickstart.md` en el repo | P0 |
| `/llms.txt` | Mapa legible por LLM a las páginas y docs canónicos | Mismo contenido visible | P1 |
| `/en/` | Versión en inglés | `TBD` (¿el jurado es hispanohablante?) | `TBD` |
| `/demo` (video o grabación de terminal) | Ver el flujo sin instalar Docker + QVAC + GGUF | `TBD`: no existe grabación en el repo | `TBD` |

Fuera del mapa: precios, registro, login, app web, blog. No hay hechos de producto que los sostengan.

## 3. Home sección por sección

Base: el copy de `docs/landing.md`, que ya está alineado con los límites del repo. Cada afirmación debe pasar el chequeo de la §3.1 antes de publicarse.

**1. Hero (primer viewport)**
- Titular: "Un agente puede pedir un pago. Las reglas locales deciden si sale." (`landing.md`)
- Mensaje: la frase de una línea de `landing.md`: pasarela local, el modelo devuelve solo un veredicto JSON, el código permite, escala o rechaza; nadie delega la firma al modelo.
- CTA principal (propuesta): **Ver el repositorio**. Es la acción con menos fricción; el Quickstart exige Docker, `@qvac/cli`, un GGUF verificado y Node 22+ (`judge-quickstart.md`).
- CTA secundario: **Correr la demo local** → Quickstart.
- Visual: diagrama del flujo real (agente → reglas → grafo → juez Qwen local → firma 2-de-2 → Quickstart local) **o** captura real de la salida de `ALAIA_LIVE=1 npm test` con commit y fecha. **No** mock de teléfono ni de extensión: no hay UI de producto (`DEC-0004`).
- Línea de alcance visible bajo los CTA: "Demo local sobre Stellar Quickstart. No usa mainnet." (`REQ-0001` §2/§7).

**2. Así pasa un pago**: cuatro pasos numerados (propone → reglas + grafo → juez local → firma y envío local). Si el runtime QVAC no corre, el pago no sale (`DEC-0006`). Visual: el mismo diagrama, expandido. Sin CTA.

**3. Lo que se rechaza**: la lista de ocho casos de `landing.md`, como tarjetas "caso → resultado: no hay envelope". Visual: código de razón real (`over_cap`, `destination_denied`, `asset_denied`, `fee_over_cap`, `admin_operation`) en tipografía mono. CTA terciario: "Ver los tests".

**4. Dos firmas y una llave que no gasta**: 2-de-2, `masterWeight = 0`, llave de recuperación que no mueve fondos (`landing.md`, `DEC-0004`). Visual: tabla de firmantes y umbrales tal como queda en el ledger local. Mostrar el límite: las dos claves viven en el mismo host (`judge-quickstart.md`).

**5. Cada pago permitido deja un recibo**: hash en `MEMO_HASH`; texto literal de `landing.md`: el enlace "no demuestra que el juez se ejecutó". Visual: recibo JSON real (modelo declarado, hash de la solicitud, veredicto) junto al memo visto en Horizon local.

**6. Todo ocurre en local**: pasarela, juez QVAC y Quickstart en tu entorno; camino feliz sin internet (`landing.md`, `REQ-0001` §3). Nota: la preparación sí descarga dependencias (`judge-quickstart.md`).

**7. Qué no es**: bloque corto con enlace a `/limites`: no es prueba de inferencia, no es wallet principal, no usa mainnet, no es x402 ni Soroban en esta ola, el juez no tiene robustez medida.

**8. Trabajo relacionado**: Soneso Stellar Agent Wallet y OpenZeppelin smart accounts como contexto y diferencia (aprobación humana frente a juez local), como recomienda `Idea.md` §5 y `alaia-proof-context.md` §11. Redactar sin superlativos ni "el primero".

**9. CTA final**: repetir el par del hero (`landing.md` cierre).

Prueba social: **no hay** logos, testimonios ni métricas en el repo. No inventarlos. La prueba disponible es técnica: tests nombrados, commit, salida de ejecución.

### 3.1 Chequeo de afirmaciones de `landing.md` contra el código

| Afirmación | Evidencia encontrada | Estado |
|---|---|---|
| Monto sobre el tope | `over_cap` en `packages/policy/src/evaluate.ts` | respaldada |
| Destino no permitido / fuera del grafo | `destination_denied`; `considerWithGraph`; test live "unknown graph destination is not submitted" | respaldada |
| Activo no permitido | `asset_denied`; el SDK Classic solo construye XLM (`DEC-0006`) | respaldada |
| Comisión sobre el tope | `fee_over_cap` | respaldada |
| Operaciones que no son pago | `admin_operation` | respaldada |
| Destino sustituido respecto a lo aprobado | `grader-negative` prueba un destino fuera de la allowlist, no una mutación posterior a la aprobación | **verificar** |
| Factura que no coincide | `grader-negative` lo modela como sustituto con `admin_operation` | **verificar** |
| Firmas no autorizadas | test live: recuperación con peso 0 → `tx_bad_auth`; en `grader-negative` el caso "signature bypass" es un sustituto con `fee_over_cap` | **parcial** |
| "El juez emite el veredicto cuando hace falta" | `DEC-0006`: se invoca siempre que la política permite | **precisar redacción** |

## 4. Referencias de wallets Stellar: qué tomar y qué evitar

**Tomar**
- `albedo.png`: titular corto que explica el rol en el ecosistema ("permite a otras apps pedir firma sin exponer la clave") y el selector Usuarios / Desarrolladores. Es el análogo más cercano: ALAIA también es una capa entre quien pide y quien firma.
- `lobstr-trade.png`: es la única referencia con algo real y verificable en la web. Equivalente para ALAIA: salida real de ejecución y recibo real, no ilustraciones.
- `decaf-personal.png`: jerarquía de CTA limpia (un primario sólido y un secundario "See how it works"). Copiar la jerarquía, no el contenido.
- Patrón común: decir la propiedad de seguridad en el copy. Para ALAIA, la propiedad es "el modelo no firma ni amplía permisos" (`DEC-0006`).

**Evitar**
- Saldo grande en USD y botones Send/Swap/Receive (`freighter.png`, `decaf-personal.png`, `lobstr.png`): ALAIA no muestra balances ni hace swaps; sugeriría una wallet que no existe.
- Mock de teléfono o ventana de extensión (`decaf-personal.png`, `freighter.png`, `xbull.png`, `rabet.png`): no hay UI de producto (`DEC-0004`).
- Lista de assets con stablecoins y fiat (`freighter.png`, `beans.png`): esta ola solo construye XLM.
- Swap o tipo de cambio como widget principal (`lobstr-trade.png`, `solar.png`): fuera de alcance.
- La etiqueta "non-custodial" (varias capturas): `alaia-proof-context.md` §B.1 indica que la custodia es una configuración, no una etiqueta. Describir la configuración (quién tiene qué clave), no la etiqueta.
- Gradientes cripto saturados (fondo de `freighter.png`): restan credibilidad a un mensaje de control y límites.

## 5. Dirección visual — **propuesta**, pendiente de validación

- **Tono**: sobrio, técnico, literal. Frases cortas en voz activa, como en `landing.md`. Cero superlativos ("el más seguro", "garantiza"). Cada promesa con su límite al lado.
- **Concepto**: "veredicto". El sitio se lee como un registro de decisiones: entrada → regla → resultado.
- **Tipografía (propuesta)**: una grotesca neutra para titulares y texto, y una monoespaciada para hashes, códigos de razón y recibos. Las familias concretas quedan `TBD` (verificar licencia web).
- **Color (propuesta)**: base neutra (claro u oscuro, `TBD`) y tres colores semánticos reservados para los estados reales `allow` / `escalate` / `deny`, usados solo en ese sentido. Contraste AA mínimo.
- **Imágenes**: diagramas propios y capturas reales de terminal o recibo con commit y fecha. Sin fotos de stock ni ilustraciones de robots.
- **Marca Stellar**: uso de logo o de "Built on Stellar" `TBD` hasta revisar las guías de marca de Stellar.
- **Nombre público**: el repo usa "ALAIA proof"; `alaia-proof-context.md` §14 recomienda cambiar el significado público de "proof". `landing.md` ya usa solo "ALAIA". Propuesta: usar "ALAIA" en el sitio; decisión `TBD`.

## 6. Confianza y cumplimiento (solo afirmaciones respaldadas)

Se puede decir, con fuente:
- El camino feliz corre contra Stellar Quickstart local; el grader no usa testnet, futurenet ni mainnet (`REQ-0001` §2/§3).
- El modelo no firma ni escribe en el ledger; un ALLOW del modelo no amplía permisos (`DEC-0004`, `DEC-0006`).
- Sin runtime QVAC, con timeout o con salida inválida: no hay envelope (`DEC-0006`).
- Cuenta de presupuesto 2-de-2, `masterWeight = 0`, recuperación documentada; no es la wallet principal (`DEC-0004`).
- Las claves se generan en local y no se commitean (`REQ-0001` §8).
- `MEMO_HASH` ancla la integridad del recibo, **no** prueba que el modelo se ejecutó (`README.md`, `DEC-0006`).

Límites que el sitio debe mostrar (página `/limites`):
- Ambas claves de firma viven en el mismo host: no protege frente a un administrador del host con las dos seeds (`judge-quickstart.md`).
- El gateway aún no verifica el hash del GGUF (`judge-quickstart.md`).
- Sin robustez medida del juez frente a prompt injection ni tasa de falsos positivos (`alaia-proof-context.md` §15/§16.3).
- Los tests unitarios con runtime sustituido no prueban inferencia (`README.md`).

No decir: "proof of inference", "reproducible en cualquier máquina", "non-custodial" sin explicar, "seguro" sin calificar, "el primero en Stellar" (`alaia-proof-context.md` §1/§14, `Idea.md` §6).

Avisos legales `TBD`: licencia del código (no hay `LICENSE` en el repo), aviso de "demo sin fondos reales" con redacción revisada, política de privacidad si hay analítica, autoría o entidad responsable. `alaia-proof-context.md` §H aclara que su análisis regulatorio no es asesoría legal.

## 7. SEO y metadata básicos

- Render estático o en servidor: titular, texto, enlaces y JSON-LD en el HTML inicial.
- `<html lang="es">`; `hreflang` solo si se hace `/en/` (`TBD`).
- Title (propuesta, ≤ 60 caracteres): "ALAIA — reglas locales para pagos de agentes en Stellar".
- Meta description (propuesta, ≤ 155): pasarela local; reglas y un juez local deciden si un pago Classic sale; recibo anclado en `MEMO_HASH`.
- Canonical: dominio `TBD`. Política de barra final y de www fija desde el día uno.
- Open Graph / Twitter: imagen = diagrama del flujo con el titular; `og:locale es_ES` (o `es_419`, `TBD`).
- JSON-LD: `WebSite` + `WebPage` + `SoftwareSourceCode` (repo, `programmingLanguage: TypeScript` según `DEC-0003`, `license` solo cuando exista). Sin `AggregateRating`, `Offer` ni `Organization` hasta que haya hechos visibles.
- Un `h1` por página; los `h2` iguales a los títulos de sección de `landing.md`.
- `/llms.txt`: resumen de una línea y enlaces a la home, `/limites`, `README.md`, `docs/judge-quickstart.md` y `docs/design/DECISIONS.md`. Nada que no sea público.
- `robots.txt` y `sitemap.xml` solo con URLs canónicas. Sin promesas de posicionamiento ni de citas en asistentes.

## 8. Decisiones candidatas a `DEC-*` (no editadas en `DECISIONS.md`)

| Candidata | Propuesta | Por qué ahora |
|---|---|---|
| DEC-cand-A | El sitio es una página de demo técnica para jurado y desarrolladores, no una web de wallet: sin saldo, sin swap, sin mock de app | Evita contradecir `DEC-0004` ("UI de producto" prohibida) |
| DEC-cand-B | El visual de producto solo usa artefactos reales (diagrama del flujo, salida de test, recibo) con commit y fecha | Coherencia con la regla no-fiction del repo |
| DEC-cand-C | La página de límites es obligatoria y se enlaza desde el hero; lista cerrada de términos prohibidos (§6) | `alaia-proof-context.md` §14 ("proof" → cambiar significado público) |
| DEC-cand-D | El sitio sería un seam nuevo (`S-site`, ruta `TBD`) que solo consume docs y no toca `packages/` | `module-seams.md` no tiene dueño para el sitio; un worker no puede tocar más de un seam |

## 9. Preguntas abiertas / TBD (antes de diseñar o construir)

1. **Audiencia y objetivo**: ¿el sitio es para el jurado de un hackathon concreto (cuál, fecha de entrega, rúbrica), para desarrolladores o para clientes B2B futuros? Define el CTA primario.
2. **Visual del hero**: ¿habrá grabación de terminal o video de la demo? ¿Se acepta un diagrama como visual principal, dado que no hay UI de producto?
3. **Nombre y dominio**: ¿"ALAIA" o "ALAIA proof"? ¿Qué dominio y qué URL canónica?
4. **Repositorio y licencia**: ¿el repo es público? ¿Qué licencia? Sin licencia no se puede invitar a usar el código.
5. **Afirmaciones por verificar**: ¿están implementados de verdad "destino sustituido tras la aprobación", "factura que no coincide" y "firmas no autorizadas", o solo como sustitutos? Si no, se retiran del sitio.
6. **Idioma**: ¿solo español o también inglés?
7. **Autoría y contacto**: ¿quién firma el proyecto (personas, equipo, entidad)? ¿Hay canal de contacto?
8. **Hosting, stack y analítica**: dónde se publica, con qué, y si se mide algo (implica política de privacidad).
9. **Marca Stellar**: ¿se usa el logo o un distintivo "Built on Stellar"? Requiere revisar las guías de marca.
10. **Gate del repo**: `FEATURE-PREPARATION.md` está `blocked` y no existe seam para el sitio. ¿El sitio entra en esta ola o después?

## 10. Siguientes pasos sugeridos (sin implementar)

1. Responder las preguntas 1–5 de la §9; cerrar las candidatas A–D como `DEC-*` (planner/judge).
2. Verificar las filas "verificar" y "parcial" de la §3.1 contra los tests; ajustar `landing.md` si hace falta.
3. Copy: derivar la home de `landing.md` y redactar `/limites` desde la §6. Revisión con la lente "¿hay una fuente en el repo?".
4. Wireframe de baja fidelidad (desktop y móvil) de la home y de `/limites`, con el primer viewport mostrando titular, CTA y diagrama.
5. Producir los artefactos visuales reales: diagrama del flujo, captura de `ALAIA_LIVE=1 npm test`, recibo JSON y memo en Horizon local, con commit y fecha.
6. Prototipo estático navegable; después metadata, `llms.txt` y una revisión de responsive y accesibilidad.
7. Solo entonces: hoja `S-site` en `orchestration/task-tree.json` para un worker.
