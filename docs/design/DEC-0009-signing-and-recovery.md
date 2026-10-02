# DEC-0009 — Firma vinculada y recuperación por respaldo

Status: accepted
Date: 2026-10-01
Decider: planner, reparación del MVP solicitada por el usuario.

## Firma

S-stellar añade `signApprovedEnvelope(xdr, approval, seed)`. Approval procede de
la superficie local de confianza y contiene decision, envelopeHash, sourcePublic,
destination, amountStroops, feeStroops y memoHash. Se requiere allow, hash de la
transacción exacto, una única operación payment XLM, source/destination/amount/fee
y MEMO_HASH coincidentes, red standalone. Firmar el mismo cuerpo por A y después
B sigue permitido; cambiar firmas no cambia el hash del cuerpo. Rechazar mismatch
antes de invocar transaction.sign. El helper raw signEnvelope queda reservado
para setup/negativos explícitos; el camino permitido live usa el helper aprobado.
Esto protege contra sustitución dentro del flujo correcto, no contra un admin
del host que eluda el helper con ambas seeds o fabrique una approval.

## Recuperación

Incidente recuperable: pérdida de las copias operativas de A y/o B, manteniendo
respaldos y sus passphrases. Custodio: operador local de esta demo, mismo trust
domain que las claves actuales. No se recupera un compromiso de ambas claves ni
la pérdida simultánea de todas las copias/passphrases. No se añade autoridad al
ledger: masterWeight=0, A/B weight=1 y umbrales 2 permanecen iguales.

S-stellar ofrece `createSignerBackup(seed, passphrase)` y
`restoreSignerBackup(backup, passphrase, expectedPublicKey)`, un respaldo por seed.
Formato v1: publicKey, scrypt N=32768/r=8/p=1, salt aleatorio 16 bytes, AES-256-GCM,
IV aleatorio 12 bytes, tag 16 bytes, ciphertext. Parámetros fijos y payload acotado;
authTag y AAD vinculan versión/publicKey/KDF. Rechazar contraseña vacía o demasiado
corta (mínimo 12 caracteres), formato no canónico, versión/algoritmo desconocido,
alteración y clave pública distinta; nunca loggear seed/passphrase. Buffers de
clave derivados se limpian cuando es práctico, sin promesa de borrado de strings JS.
Caller persiste backups fuera de git, separado de las copias operativas; la API no
escribe secrets automáticamente. Los tests usan claves efímeras y directorio temporal.

`recoverySigner` de peso 0 no es una llave de recuperación: conservar compatibilidad
del parámetro como eliminación opcional del signer legacy, quitarlo del listado de
autoridades activas de spec y documentarlo deprecated. No subirle peso.

## Verificación

Unitarios: mutation de destination/monto/memo/source/fee después de aprobación,
decision no allow, firmas A+B válidas sobre cuerpo exacto, alteración post-firma.
Backup: roundtrip, contraseña errónea, tampering, clave esperada distinta, copias
con salts/IV diferentes. Live posterior restaura A y B, mantiene pesos/umbrales,
rechaza una firma y permite dos sobre pago aprobado por Qwen.

Fuentes: [Stellar multisig](https://developers.stellar.org/docs/learn/fundamentals/transactions/signatures-multisig)
y [Node 22 crypto](https://nodejs.org/download/release/v22.17.0/docs/api/crypto.html).
