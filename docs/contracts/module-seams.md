# Module seams

DEC-0007 reconcilia propiedad con los paquetes presentes, sin certificar entrega.
Un worker toca un seam; ninguno edita código de otro.

| id | path | owns | must not own | status |
|---|---|---|---|---|
| S-policy | packages/policy/ | reglas deterministas, pago canónico | red, firmas | accepted |
| S-stellar | packages/stellar-classic/ | envelopes, MEMO_HASH, SetOptions, firma aprobada, backup cifrado DEC-0009 | policy, QVAC, submit | accepted |
| S-receipt | packages/receipt/ | formato canónico, hash, bundle DEC-0010 | autorizar, firmar | accepted |
| S-local | packages/localnet/ | plan Quickstart, URL local | protocolo del pago | accepted |
| S-judge | packages/judge/ | QVAC local, Qwen3-4B, JSON schema | ampliar caps, firmar | accepted |
| S-gateway | packages/gateway/ | policy, identidad del grafo, judge, receipt, envelope | firmar, submit | accepted |
| S-rag | packages/rag-graph/ | corpus sintético, retrieval, grafo | autorizar solo | accepted |
| S-grader | packages/grader-negative/ | casos públicos de policy y runner reservado DEC-0011 | afirmar inferencia o firmas | accepted |
| S-live | packages/live/ | integración real, helpers de transporte | redefinir policy, red pública | accepted |
| S-build | packages/*/tsconfig.json | configuración TypeScript exclusivamente | código de dominio | accepted |
| S-orch | orchestration/ y docs de gobierno | tareas, evidencia, handoffs | código de dominio | accepted |

S-build posee exclusivamente los tsconfig durante esta reparación.
Raven continúa como referencia sin runtime de pago (DEC-0005).
El sitio de worktrees hermanos está fuera del alcance seleccionado.

DEC-0010 autoriza dependencia directa S-live -> @alaia/receipt para persistir y
validar bundle. Las otras dependencias existentes se conservan. No añadir
dependencias de S-receipt sobre SDK/gateway/judge. S-build conserva tsconfig.

