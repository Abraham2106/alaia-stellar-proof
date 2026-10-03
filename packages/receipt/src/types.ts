export type ReceiptDecision = "allow" | "deny" | "escalate";

/** `native` or `credit:<code>:<issuer>`. */
export type ReceiptAsset = "native" | `credit:${string}:${string}`;

export interface Receipt {
  policyVersion: string;
  destination: string;
  asset: ReceiptAsset;
  amountStroops: string;
  feeStroops: string;
  decision: ReceiptDecision;
  reasons: string[];
  /** Integrity evidence only, not an attestation of model execution. */
  judge?: {
    // DEC-0017: new receipts use decider-0.8b; historical bundles keep prior ids.
    model: "decider-0.8b" | "strands-decider-2B-hobson-v19" | "Qwen3-4B";
    requestHash: string;
    label: "allow" | "deny" | "escalate";
    codes: string[];
  };
}
