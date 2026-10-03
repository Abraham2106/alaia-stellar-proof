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
    // DEC-0016: new receipts use strands-decider; Qwen3-4B for historical bundles.
    model: "strands-decider-2B-hobson-v19" | "Qwen3-4B";
    requestHash: string;
    label: "allow" | "deny" | "escalate";
    codes: string[];
  };
}
