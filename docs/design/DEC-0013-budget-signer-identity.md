# DEC-0013 — Identidades distintas al configurar 2-de-2

Status: accepted
Date: 2026-10-01
Decider: planner, revisión del contrato DEC-0009.

El builder de presupuesto aceptaba A=B y recoverySigner=A/B. Dos nombres con
la misma clave no son dos votos; eliminar un signer legacy que coincide con A/B
puede dejar un solo voto frente a umbrales 2 y masterWeight 0. Es un defecto de
validación de configuración observado en el builder, no una prueba de gasto live.

S-stellar exige sourcePublic, signerA y signerB G-public keys válidas (validación
SDK/checksum), pairwise distintas. Si recoverySigner existe, también es G válido
y distinto de todos ellos. Rechazar antes de construir el envelope; nunca emitir
setup que retire A/B ni reinterpretar roles. No añadir autoridad ni cambiar
pesos/umbrales. Seeds no son inputs de setup.

Tests: A=B, A/source o B/source, recovery igual A/B/source, StrKey inválida y seed
en lugar de public key; configuraciones válidas con/sin legacy siguen funcionando.
Unitarios/build sin modelo y sin red. Ledger continúa pendiente de integración.
