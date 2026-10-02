# DEC-0007 — Reanudar fronteras y verificación

- Status: accepted
- Date: 2026-10-01
- Decider: planner; reparación dentro de REQ-0001 y DEC-0004/DEC-0006.

## Decisión

El preflight está respondido; el registro local quedó anterior al código de main
(base 5d0a1ab). Reabrir verificaciones no certifica retrospectivamente la demo.

1. Conservar los nueve paquetes. No añadir APIs de producto ni UI.
2. considerWithGraph conserva su firma pero exige candidate.from igual a
   input.sourcePublic y candidate.to igual a input.destination. Discrepancia:
   deny, graph_candidate_mismatch, sin judge ni envelope. Policy deny precede.
3. Policy allow con arista real desconocida: decision y receipt.decision
   escalate, graph_unknown, envelope nulo. policyDecision conserva allow.
   Solo una arista coincidente y conocida puede pasar al judge obligatorio.
4. Tests públicos con QVAC sustituido prueban fronteras, no inferencia.
   Las integraciones reales requieren opt-in ALAIA_LIVE=1, fallan si falta
   infraestructura y no hacen I/O de red sin opt-in. Todo fetch de Horizon/
   Friendbot valida loopback y usa redirect:error, incluso enlaces descubiertos.
5. El control live sin QVAC fija ALAIA_QVAC=0 y restaura el valor en finally.
6. El grader público nombra las reglas ejercidas: operación administrativa,
   destino fuera de allowlist y comisión excesiva. No demuestra factura falsa
   ni bypass de firma.
7. Reparaciones de compilación conservan exports TypeScript y versiones.
   Primero reinstalar dependencias fijadas en lockfiles; solo cambiar tsconfig
   si persiste un fallo real. Ninguna modificación del código de dominio
   pertenece al seam de configuración de build.

## Verificación

Gateway: ambos extremos, desconocido, policy deny y los tres resultados del judge.
Live: opt-in, fallos explícitos, loopback y redirects; integración sin mocks.
Grader: nombres y assertions corresponden a las reglas ejercidas.
Build: ejecutar todos los builds declarados después de npm ci.

## Límites

La clave recovery de peso cero no recupera por sí sola la cuenta. Recuperación
real, corpus oculto y negativos semánticos de Qwen continúan pendientes; no se
cierran con pruebas unitarias. Sitio excluido por selección del usuario.

