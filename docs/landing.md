# ALAIA

## Una persona deja un grant. El agente solo gasta dentro de ese grant.

ALAIA verifica el mismo pago Classic para una wallet humana y para una wallet de agente. La policy corre primero. El modelo devuelve solo un veredicto en JSON. El código permite, escala o rechaza. Nadie delega la firma al modelo. Un pago de agente sin el hash del grant no tiene envelope.

## Así pasa un pago por la pasarela

El agente propone un pago. Las reglas y un grafo sintético de destinos válidos se evalúan antes de cualquier envío. Si el destino no está en ese grafo, no hay transacción. Si el par origen–destino es conocido pero una regla dice no, tampoco.

Un juez local — strands-decider 2B, por el comando `strands-decider ask` — emite el veredicto cuando hace falta. Si ese runtime no está en marcha, el pago no sale.

## Así se autoriza

La persona verifica el presupuesto. El grant fija destino, activo y monto máximo, y se identifica por su hash. El agente propone un pago que cita ese hash. Si falta, o si el destino, el activo o el monto no caben, la policy niega con `grant_required` o `grant_mismatch` y no hay envelope.

## Qué tools llegan al modelo

Solo un payment que la policy ya permitió abre las preguntas. Cambiar firmantes se niega con `signer_change_denied`. Abrir un trustline se niega con `trustline_closed`. Llamar un contrato se niega con `contract_rail_closed`. Esas tres no consultan al modelo. El modelo que eligió la tool no autoriza.

## Conformidad

Cinco casos publicados comparan respuestas contra un oro fijo, con banda de 0,15: pago alineado, agente sin grant, destinatario sustituido, instrucción dentro de la factura, y cambio de firmantes. Si el caso aparece como su propio vecino, no conforma. El registro `alaia-verify-1` cita el hash del grant, el del artefacto, el del corpus y los ids de vecinos. Ese registro reconstruye qué se comparó. No afirma que un modelo de decisión haya corrido: los pesos no están cargados.

Cuando todo encaja, el código firma y envía. El camino feliz no depende de la red pública: corre contra un Stellar Quickstart local.

## La cuenta exige dos firmas y una llave que no gasta

La cuenta está configurada para que dos firmantes autoricen cada gasto y el peso del master sea cero. Hay una llave de recuperación que no puede mover fondos. Si falta una de las dos firmas de gasto, o aparece una firma que no corresponde a esos dos gastadores, la transacción no pasa.

## Esto se rechaza en lenguaje llano

- Monto por encima del tope permitido.
- Destino no permitido por política o por el grafo.
- Activo no permitido.
- Comisión por encima del tope.
- Operaciones que no son un pago.
- Un destino sustituido respecto a lo que se aprobó.
- Una factura que no coincide con la operación real.
- Firmas que no son las de los dos gastadores autorizados.

## Cada pago permitido deja un recibo

El recibo acompaña al pago autorizado. Su hash va en el memo de la transacción y enlaza el recibo con lo que quedó en el ledger. Ese enlace no demuestra que el juez se ejecutó; demuestra qué recibo se asoció a ese envío.

## Todo ocurre en local

La pasarela, el juez strands-decider y el Quickstart de Stellar viven en tu entorno. Probar el flujo completo no requiere abrir el camino por internet.

---

Abre el repositorio para leer cómo está armado, o levanta el Quickstart local y recorre el camino feliz tú mismo.
