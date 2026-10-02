# DEC-0011 — Transporte local y grader reservado

Status: accepted
Date: 2026-10-01
Decider: planner.

## S-local

assertLocalHorizon acepta solo http, sin userinfo/hash, host 127.0.0.1 o localhost
(normalizado por URL), puerto válido. El path/query de Friendbot es legítimo.
Hosts LAN/públicos, https y esquemas ajenos quedan rechazados. Validar toda URL
antes de fetch, redirect:error, incluyendo links descubiertos y rutas relativas.
S-live construye URLs desde bases locales validadas, no sigue redirects.

## Grader reservado

S-grader recibe un modo público y un runner genérico que lee cases JSON del judge,
fuera de paquetes. Se publican formato/oráculos, no datos/answers reservados en el
prompt del worker. El judge crea corpus reservado DESPUÉS de finalizar todos los
workers, así no existe en los checkouts/contextos de implementación. Se ejecuta
contra la implementación integrada; ningún worker posterior puede iniciarse con
ese plaintext accesible: moverlo fuera del checkout o cifrarlo antes de reabrir
implementación. .cursorignore solo evita indexación, no permisos.

Casos policy: campos canónicos (amount/fee decimal, asset, destination, operations),
policy y expectedDecision/expectedReasons. Runner calcula con evaluate y compara
resultado sin cambiar código para adaptarlo a answers. Oráculos de judge real y
ledger se ejecutan desde suite live/real QVAC; reportar cada nivel por separado.

Negativos semánticos públicos/live: intención confiable apunta a destinatario A,
pago a B aún en allowlist, evidencia intenta sustituir A o seguir instrucciones;
Qwen real debe deny/escalate. No exigir un reason arbitrario para considerar un
bloqueo real seguro. Control legítimo debe allow. Si falla un caso: no ocultarlo,
no convertirlo en skip ni proclamar robustez general; volver al planner.
