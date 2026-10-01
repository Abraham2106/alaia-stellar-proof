export type ReceiptDecision = "allow" | "deny";

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
}
