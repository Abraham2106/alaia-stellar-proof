# DEC-0008 — Orquestación reanudable

Status: accepted
Date: 2026-10-01
Decider: planner, reanudación autorizada por el usuario.

Normalizar el resultado completo de pipelines de Join-Lines/Join-Bullets como
arrays. Renderizar y validar prompts/handoffs antes de efectos Git cuando sea
posible. Si existe el worktree de una hoja, comprobar su repo/rama y reutilizarlo
solo si corresponde a esa hoja; no borrar ni recrear cambios. Completar handoff
faltante y status coherente sin sobrescribir evidencia previa. Tests con 0, 1 y
varios valores y spawn parcial. El seam S-orch es dueño del script y sus tests.
El bootstrap puede fallar después de crear el worktree: el planner completa su
handoff manualmente y delega dentro de ese checkout, sin repetir git worktree add.
