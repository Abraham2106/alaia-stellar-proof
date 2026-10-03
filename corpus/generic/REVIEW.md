# Generic corpus review

Stellar MCP (Stella/Raven): **not configured** in this environment. Checks use `@stellar/stellar-sdk (local; Stellar/Raven MCP unavailable)` (checksum validation only, no Horizon RPC).

Cases: 51 (24 allow, 21 deny, 6 escalate). Structural pass: 45/51; all 24 allow cases pass.

No corpus edits were required (keys valid, state ≤900 chars, approved destinations on allowlist).

| id | expected | check | result |
| --- | --- | --- | --- |
| approved-01 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-02 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-03 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-04 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-05 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-06 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-07 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-08 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-09 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-10 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-11 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-12 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-13 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-14 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-15 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-16 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-17 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-18 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-19 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-20 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-21 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-22 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-23 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| approved-24 | allow | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-01 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-02 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-03 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-04 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-05 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-06 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-07 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-08 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-09 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-10 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-11 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | fail: not a single Classic payment op |
| rejected-12 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | fail: not a single Classic payment op |
| rejected-13 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | fail: not a single Classic payment op |
| rejected-14 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | fail: not a single Classic payment op |
| rejected-15 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-16 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-17 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-18 | escalate | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-19 | escalate | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-20 | escalate | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-21 | escalate | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-22 | escalate | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-23 | escalate | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-24 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-25 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | pass: valid keys, native payment, stroops amounts |
| rejected-26 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | fail: non-native asset |
| rejected-27 | deny | @stellar/stellar-sdk (local; Stellar/Raven MCP unavailable) | fail: non-native asset |
