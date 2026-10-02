export type VerifyWalletClass = "human" | "agent";

export type VerifyDecision = "allow" | "deny" | "escalate";

/** ALAIA Verify 1 record; separate from receipt v1 (DEC-0015). */
export interface VerifyRecord {
  standard: "alaia-verify-1";
  walletClass: VerifyWalletClass;
  decision: VerifyDecision;
  artifactSha256: string;
  corpusSha256: string;
  neighborIds: string[];
  grantHash?: string;
}

export interface VerifyRecordAgentAllow extends VerifyRecord {
  walletClass: "agent";
  decision: "allow";
  grantHash: string;
}
