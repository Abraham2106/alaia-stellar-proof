# DEC-0010 — Evidencia persistible para reconstrucción

Status: accepted
Date: 2026-10-01
Decider: planner.

S-gateway devuelve opcional `judgeRequestJson`, los bytes JSON exactos del request
QVAC usados para requestHash; ausencia cuando el judge no corrió. No cambia la
semántica ni hash del receipt. No incluir credenciales ni seeds. El request tiene
policy, intención y evidencia no confiable: puede contener contenido sensible del
caller; se persiste solo por decisión explícita del operador local.

S-receipt ofrece bundle JSON v1 con receipt, memoHash, judgeRequestJson opcional,
networkPassphrase, sourcePublic, sequence (de envelope), envelope XDR/hash opcional,
transactionHash opcional y modelArtifact {sha256, source, runtimeVersion} opcional.
No crea dependencias sobre gateway/judge/SDK; valida receipt hash y hash del request
exacto, presencia/coherencia de request si receipt.judge existe, formato de hashes,
metadatos y contenido acotado. Guardar JSON y recuperar/verificarlo desde archivo
es responsabilidad S-live; validar contra el XDR real es S-stellar/S-live.

Un manifiesto SHA-256 del bundle detecta cambios frente a una referencia confiable;
recalcular el manifiesto de un bundle alterado no lo autentica. MEMO_HASH del ledger
es la referencia independiente del receipt. Request hash vincula su preimage pero
no demuestra inferencia, procedencia autenticada de weights ni replay universal.

Tests: JSON roundtrip, cambios de receipt/request, request ausente, hashes y
metadatos inválidos; live persiste, vuelve a leer y compara memo de Horizon, XDR,
payment/sequence/source y requestHash. No exportar datos privados al sitio.
