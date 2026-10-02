# Runner local

DEC-0004, DEC-0006 y DEC-0007. Desde la raíz, en PowerShell:

Para cada paquete: npm.cmd --prefix packages/<nombre> ci,
npm.cmd --prefix packages/<nombre> test y, si lo declara,
npm.cmd --prefix packages/<nombre> run build.
Orden: policy, receipt, judge, stellar-classic, rag-graph, gateway, localnet,
grader-negative, live. La preparación puede necesitar internet.

## Integración real

Seguir docs/judge-quickstart.md. Preparar Quickstart standalone, QVAC y
Qwen3-4B antes del ensayo offline.

```powershell
$env:ALAIA_QVAC = '1'
$env:ALAIA_QVAC_LIVE = '1'
npm.cmd --prefix packages/judge test -- tests/qvac.live.test.ts
$env:ALAIA_HORIZON = 'http://127.0.0.1:8000'
$env:ALAIA_LIVE = '1'
npm.cmd --prefix packages/live test
```

Exit no cero o pruebas requeridas omitidas impiden aceptar la demo.
Guardar comandos, exits y límites en orchestration/runs/, sin seeds ni tokens.

## Alcance de la evidencia

El runtime sustituido del gateway y el fixture HTTP del judge son dobles
explícitos; no prueban inferencia. grader-negative cubre únicamente policy.
No existe corpus oculto aprobado: los tests públicos no lo reemplazan.
Futuros answers: docs/graders/goldens/, fuera de prompts e indexación.
La ausencia del corpus bloquea aceptación completa, no reparaciones DEC-0007.

