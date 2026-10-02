task_id: T-021
from_role: planner
to_role: worker
base_ref: 4ee1f6b249a21fc8652d1f62fc898e9401949cb5
worktree: orchestration/worktrees/T-021
branch: agent/T-021
seams: [S-receipt]
decisions: [DEC-0015, DEC-0010]
resume_from: |
  Solo packages/receipt/. Tipo nuevo, no mezclar campos en Receipt. Citar DEC-0015.
done_when:
- VerifyRecord valida standard, walletClass, hashes hex64, neighborIds unicos max 8
- Agent y decision allow sin grantHash se rechaza
- verifyRecordHash es SHA-256 canonico
- Tests de receipt v1 existentes siguen pasando
- npm test y npm run build de packages/receipt pasan
stop_when:
- Seam extra
- Cambiar receiptMemoHash o el JSON del receipt v1
- Depender de policy, gateway o SDK
verification:
  planned: []
  run:
    - cmd: npm test (packages/receipt)
      result: 42 passed (3 files)
    - cmd: npm run build (packages/receipt)
      result: ok
goldens_exposed: false
alarms: []
