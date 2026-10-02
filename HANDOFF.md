task_id: T-023
from_role: planner
to_role: worker
base_ref: 4ee1f6b249a21fc8652d1f62fc898e9401949cb5
worktree: orchestration/worktrees/T-023
branch: agent/T-023
seams: [S-gateway]
decisions: [DEC-0015, DEC-0006]
resume_from: |
  No spawnear hasta que T-020, T-021 y T-022 esten done. Solo packages/gateway/.
done_when:
- Wallet agent sin grant no emite envelope
- Tests de gateway pasan
stop_when:
- Seam extra
- Cargar modelo
- Allow sin grant en wallet agent
verification:
  planned: []
  run:
    - "packages/gateway: npm test — 4 files, 36 passed"
    - "packages/gateway: npm run build — ok"
goldens_exposed: false
alarms: []
