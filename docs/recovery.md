# Recuperación local por respaldo

DEC-0009 cubre pérdida de las copias operativas de las seeds A/B de la cuenta
de presupuesto de la demo. Cada signer conserva un backup cifrado independiente
producido por `createSignerBackup(seed, passphrase)`. El operador debe guardar
backups fuera de git, separados de las seeds operativas, y conservar sus
passphrases por separado. La API no persiste secretos automáticamente.

Para recuperar: cargar el JSON de cada backup y usar
`restoreSignerBackup(backup, passphrase, expectedPublicKey)`. El publicKey esperado
procede de la configuración confiable y debe compararse con el signer del ledger.
La API valida formato, parámetros fijos y autenticación; rechaza alteraciones,
contraseña incorrecta y clave esperada distinta. Nunca registrar seed/passphrase.
Después firmar el pago con `signApprovedEnvelope` y ambas claves restauradas.

El formato v1 usa scrypt N=32768/r=8/p=1 con salt aleatorio de 16 bytes y
AES-256-GCM con IV de 12 bytes/tag de 16. AAD vincula versión/publicKey/KDF;
passphrase mínima de 12 caracteres no garantiza resistencia de una contraseña
elegida por el usuario. Se limpian buffers cuando es práctico, sin garantía de
borrado de strings JS o del estado de SDK.

El ledger conserva masterWeight 0, A/B peso 1 y los tres umbrales 2. No hay
tercer voto. `recoverySigner` legacy es eliminación de signer con peso 0,
no recuperación. Este procedimiento no resuelve compromiso de ambas claves ni
pérdida simultánea de todas las seeds, backups y passphrases.

Evidencia actual: 33 tests unitarios de stellar-classic y build aprobados tras
revisión independiente. Restauración y gasto en ledger local quedan pendientes
de integración real; no se sustituyen con pruebas unitarias ni modelos simulados.
