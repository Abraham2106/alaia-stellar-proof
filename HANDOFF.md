task_id: T-020
from_role: planner
to_role: worker
base_ref: 4ee1f6b249a21fc8652d1f62fc898e9401949cb5
worktree: orchestration/worktrees/T-020
branch: agent/T-020
seams: [S-policy]
decisions: [DEC-0015]
resume_from: |
  Solo packages/policy/. evaluate(payment, policy) sin scope sigue human. Scope opcional walletClass agent y grant. gateToolCall segun DEC-0015. Hash canonico SHA-256 de JSON con claves ordenadas. No tocar gateway, receipt ni laya.
done_when:
- Agent sin grant niega grant_required
- Grant con destino, activo o monto distinto niega grant_mismatch
- setOptions niega signer_change_denied y questions false
- invokeContract niega contract_rail_closed y questions false
- changeTrust niega trustline_closed y questions false
- Payment ya permitido con wallet human conserva allow y questions true
- npm test y npm run build de packages/policy pasan
stop_when:
- Seam extra
- Abrir preguntas para setOptions, changeTrust o invokeContract
- Red o modelo
verification:
  planned: []
  run:
    - cmd: npm install (packages/policy)
      result: ok
    - cmd: npm test (packages/policy)
      result: ok — 3 files, 30 tests passed
    - cmd: npm run build (packages/policy)
      result: ok
goldens_exposed: false
alarms: []
