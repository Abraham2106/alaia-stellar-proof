ALAIA proof
Fuentes y panorama de Stellar: wallets de agentes y verificación
Investigación de apoyo para el hackathon General Track · 1 de octubre de 2026
Resumen de la investigación sobre cómo maneja Stellar los pagos de agentes de IA, las wallets con políticas y la verificación, con las implicaciones para el diseño de ALAIA proof. Hay un hallazgo importante: ya existe un proyecto muy cercano a la idea en Stellar (sección 5).
1. x402 y pagos de agentes en Stellar
•	Cómo funciona. En Stellar, x402 funciona con la autorización de Soroban: el cliente paga por solicitud firmando "auth entries", y la wallet debe soportar esa firma. Es un flujo distinto al de un pago clásico con multifirma. Para el MVP conviene usar pagos clásicos; x402 sería un extra opcional.
•	Facilitadores oficiales. El de Coinbase soporta Stellar en testnet con comisiones patrocinadas. El de Build on Stellar, basado en el Relayer de OpenZeppelin, es público y gratuito, con finalidad de unos 5 segundos y comisiones patrocinadas.
•	Postura de la Fundación. La Fundación Stellar plantea que Soroban permite políticas de pago programables (límites de gasto, reglas de aprobación, controles de cumplimiento) como guardarraíles para agentes con presupuesto.
2. Smart accounts con políticas (OpenZeppelin)
•	Modelo. Separan la autenticación (quién firma), el alcance (reglas de contexto) y la aplicación de restricciones (políticas como límites de gasto). Los límites son 15 reglas por cuenta, 15 firmantes y 5 políticas por regla.
•	Herramientas. Existe un SDK en TypeScript (smart-account-kit) con passkeys, multi-firmantes, políticas y transacciones con comisión patrocinada.
•	Precaución. La auditoría de la versión RC 0.7.0 reportó problemas de severidad alta, como la posibilidad de degradar la regla seleccionada tras recolectar firmas y un bypass del límite de gasto con montos negativos. Conviene revisar si ya fueron corregidos antes de apoyarse en esto. Es otra razón para que el MVP use multifirma clásica.
3. Multifirma nativa (diseño 2 de 2)
•	Umbrales. Cada operación cae en un umbral bajo, medio o alto (0 a 255). Un error de configuración puede dejarte bloqueado de forma permanente.
•	Aplicación al proyecto. Un pago es una operación de umbral medio y la transacción debe llevar firmas cuyo peso combinado alcance ese umbral. Con dos jueces de peso 1 y umbral medio en 2, se necesitan ambas firmas.
•	Detalle de diseño. Para que el 2 de 2 sea real, la llave maestra debe tener peso 0; de lo contrario, un juez más la maestra podrían alcanzar el umbral. También hay que definir quién puede cambiar firmantes (operación de umbral alto). Esto es inferencia de diseño, no proviene de la documentación.
4. Anclaje en el memo
•	Tipos. Los memos pueden ser texto (hasta 28 bytes), un ID, o un hash de 32 bytes (MEMO_HASH).
•	Respaldo. Existe una convención de Stellar que propone justo el patrón del proyecto: poner el hash del mensaje largo en MEMO_HASH y ofrecer una forma de recuperar el contenido original. El Merkle root de los compromisos de los jueces encaja ahí.
5. Lo más cercano a la idea: Stellar Agent Wallet (Soneso)
Es una wallet para agentes de IA (alpha) que transacciona dentro de reglas definidas, con aprobaciones y un registro de auditoría verificable, con CLI y servidor MCP. Además:
•	Delega autoridad acotada: reglas de contexto, límites de gasto con ventana móvil y un firmante Ed25519 externo para que el agente tenga su propia llave dentro de límites aplicados on-chain.
•	Permite que un operador apruebe o rechace acciones pendientes desde otro dispositivo con passkey.
•	Su flujo es simular, aprobar y confirmar vía MCP, y la aprobación devuelve una atestación.
Lectura para el proyecto: su paso de aprobación depende de un humano. El aporte de ALAIA proof es sustituirlo o complementarlo con un panel de jueces locales reproducibles. Dos caminos: (a) construir una capa independiente, o (b) presentarse como la "approval layer" que se acopla a wallets como esta. Conviene citarlos como trabajo relacionado: da credibilidad y marca la diferencia.
6. Verificación de agentes (referencia fuera de Stellar)
•	ERC-8004. Define tres registros on-chain (identidad, reputación y validación) que enlazan agentes con validación por reputación, validadores cripto-económicos o atestaciones TEE/ZK. Sigue en estado Draft.
•	Relación con el proyecto. Su "Validation Registry" es el precedente conceptual del Replay de ALAIA proof. No se encontró un equivalente en Stellar, lo que puede ser un hueco a favor del proyecto, pero conviene buscarlo de nuevo antes de afirmarlo como "el primero".
7. Conclusiones para el diseño
1.	MVP simple. Mantener pagos clásicos con multifirma para el MVP; x402 y smart accounts quedan como trabajo futuro.
2.	Anclaje. Usar MEMO_HASH para el compromiso, respaldado por la convención de Stellar.
3.	Diferenciación. Soneso es la referencia y la diferenciación principal: aprobación humana frente a panel local reproducible.
4.	Inspiración. Citar ERC-8004 como inspiración de la capa de validación.
Enlaces
•	x402 en Stellar: https://developers.stellar.org/docs/build/agentic-payments/x402
•	Stellar Agent Wallet: https://github.com/Soneso/stellar-agent-wallet
•	Smart accounts (OpenZeppelin): https://docs.openzeppelin.com/stellar-contracts/accounts/context-rules
•	Multifirma: https://developers.stellar.org/docs/learn/fundamentals/transactions/signatures-multisig
•	Memos: https://developers.stellar.org/docs/encyclopedia/memos
•	Auditoría OpenZeppelin: https://www.openzeppelin.com/news/stellar-contracts-rc-v0.7.0-audit
•	ERC-8004: https://github.com/erc-8004/erc-8004-contracts
