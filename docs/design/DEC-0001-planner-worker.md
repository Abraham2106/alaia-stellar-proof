# DEC-0001 — Separación planner / worker

- Status: `accepted`
- Decider: planner (bootstrap)
- Date: 2026-10-01

## Decision

Los planners descomponen, deciden diseño y escriben `DEC-*`. No implementan. Los workers ejecutan una hoja del task tree en un git worktree y no abren nuevas decisiones de diseño.

## Why

Un solo agente o pierde el panorama o codea peor. Split-brain aparece cuando dos subárboles deciden el mismo concepto. Esto es el análogo operable del swarm de Cursor sin su VCS interno.

## Consequences

- Prompts de planner: Plan Mode, `force` de no-edit o disciplina de no tocar `src/`.
- Prompts de worker: Composer 2.5, un `task-id`, seams listados.
- Toda pregunta de diseño en un worker es stop condition.

## Forbidden

Agentes peer coordinándose por un TODO.md con locks. Un chat que planea y codea el crate graph a la vez.

## Cite in code

```text
// DEC-0001: this module does not own cross-cutting design
```
