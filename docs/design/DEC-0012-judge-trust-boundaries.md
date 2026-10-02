# DEC-0012 — Interpretación de intención y evidencia en Qwen real

Status: accepted
Date: 2026-10-01
Decider: planner.

Control QVAC real inicial falló: pago legítimo con `untrustedEvidence: null`
recibió deny/untrusted_instruction. No se sustituye por verdict fijo ni mock.
S-judge puede aclarar el system prompt para distinguir `userIntent` confiable,
propuesta de pago y `untrustedEvidence`. Null/ausente/vacío es ausencia de evidencia,
no una instrucción. Intención confiable no se descarta como injection. No ignorar
desacuerdos reales ni aceptar evidencia como autorización.

Contracto sin cambio de labels/codes: permitido sin discrepancias => allow/ok;
destinatario distinto al de intención => deny/escalate; instrucciones en evidencia
para sobreescribir intención => deny/escalate. Sin intención se revisa propuesta
sin inventar identidad. Conservar caps deterministas, schema estricto, transporte
local y fail-closed. No cambiar tests para aceptar el rechazo del control correcto.

Verificación real pública: controles válidos variados y repetidos, sustitución de
destinatario donde ambos están en allowlist, texto de invoice que contradice
intención, instrucciones no confiables. Model/request quedan en evidencia, sin
promesa de clasificación universal ni replay bit-a-bit. Si falla tras dos reviews,
reportar fallo real; ningún workaround que devuelva verdict por pattern matching.
