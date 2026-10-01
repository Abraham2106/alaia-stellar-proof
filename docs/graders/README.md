# Graders

Equivalente operativo de sqllogictest: un corpus con respuestas conocidas que **no** se entrega al worker.

## Layout (cuando exista)

```text
docs/graders/
  README.md          ← esto; el worker SÍ puede leer la mecánica, no los answers
  fixtures/          ← inputs públicos (enunciados, XDR de request, scripts)
  goldens/           ← answers; .cursorignore + git-crypt o repo privado de grader
  runner.md          ← cómo se invoca en local
```

Hoy: **vacío a propósito**. El planner, con los requisitos, define:

1. Qué se compara (hash de ledger, result XDR, evento de contrato, saldo).
2. Cómo se levanta el Stellar local (un comando, reproducible).
3. Qué fracción del corpus es el score.
4. Qué paths están en `.cursorignore` para que Composer no los indexe.

Hasta entonces ningún worker de implementación es `ready`.
