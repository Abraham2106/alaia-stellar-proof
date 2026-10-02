# ALAIA

## Un agente puede pedir un pago. Las reglas locales deciden si sale.

ALAIA es una pasarela de políticas en tu máquina para pagos que un agente de IA quiere hacer en Stellar Classic. El modelo devuelve solo un veredicto en JSON. El código permite, escala o rechaza. Nadie delega la firma ni la escritura en el ledger al modelo.

## Así pasa un pago por la pasarela

El agente propone un pago. Las reglas y un grafo sintético de destinos válidos se evalúan antes de cualquier envío. Si el destino no está en ese grafo, no hay transacción. Si el par origen–destino es conocido pero una regla dice no, tampoco.

Un juez local — Qwen3-4B, servido por el núcleo QVAC del repositorio — emite el veredicto cuando hace falta. Si ese runtime no está en marcha, el pago no sale.

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

La pasarela, el juez QVAC y el Quickstart de Stellar viven en tu entorno. Probar el flujo completo no requiere abrir el camino por internet.

---

Abre el repositorio para leer cómo está armado, o levanta el Quickstart local y recorre el camino feliz tú mismo.
