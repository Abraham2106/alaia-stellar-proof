task_id: T-022
from_role: planner
to_role: worker
base_ref: 4ee1f6b249a21fc8652d1f62fc898e9401949cb5
worktree: orchestration/worktrees/T-022
branch: agent/T-022
seams: [S-laya]
decisions: [DEC-0015, DEC-0014]
resume_from: |
  Crear packages/laya copiando tsconfig y vitest de packages/policy. Corpus JSON en corpus/payments/confirm. Sin fetch. Citar DEC-0015.
done_when:
- corpus/payments/confirm tiene casos human allow, agent sin grant con disposition deny, sustitucion de destinatario, instruccion no confiable, setOptions con disposition deny
- confirmAnswers usa banda 0.15 y falla si neighborIds contiene el id del caso
- npm test y npm run build de packages/laya pasan
stop_when:
- Seam extra
- Descargar pesos o abrir red
- Importar @alaia/policy, receipt, gateway o judge
verification:
  planned: []
  run:
    - packages/laya: npm test (4 passed)
    - packages/laya: npm run build (ok)
goldens_exposed: false
alarms: []
