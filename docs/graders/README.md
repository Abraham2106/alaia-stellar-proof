# Graders

La verificación pública actual se ejecuta según [runner.md](runner.md).
Los tests unitarios de gateway sustituyen explícitamente strands-decider; el fixture
del CLI comprueba transporte. Ninguno prueba inferencia ni robustez del modelo.

packages/grader-negative verifica únicamente reglas deterministas: operación
administrativa, destino no permitido, comisión excesiva y un control permitido.
No demuestra una factura mentirosa, sustitución posterior a firma ni bypass
criptográfico. Estos faltantes permanecen en la aceptación del MVP.

## Grader oculto pendiente

No hay corpus oculto aprobado. Los tests públicos no son ese corpus.
Los futuros inputs podrán vivir en fixtures/; answers en goldens/, excluidos por
.cursorignore y nunca incluidos en prompts del worker. No declarar el MVP
completo antes de revisar el corpus y correrlo contra servicios reales locales.
