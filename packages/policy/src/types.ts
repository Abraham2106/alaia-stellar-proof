/** Native lumens (XLM). */
export type NativeAsset = { kind: "native" };

/** Classic credit asset (code + issuing G-account). */
export type CreditAsset = { kind: "credit"; code: string; issuer: string };

export type Asset = NativeAsset | CreditAsset;

export type OperationKind =
  | "payment"
  | "setOptions"
  | "accountMerge"
  | "manageData"
  | "pathPayment"
  | "changeTrust"
  | "createAccount"
  | "other";

export interface CanonicalPayment {
  destination: string;
  asset: Asset;
  /** Payment amount in stroops. */
  amount: bigint;
  feeStroops: bigint;
  /** Optional 32-byte memo hash as hex (64 hex chars). */
  memoHash?: string;
  operations: OperationKind[];
}

export interface BudgetPolicy {
  maxAmountStroops: bigint;
  allowedDestinations: readonly string[];
  allowedAssets: readonly Asset[];
  maxFeeStroops: bigint;
}

export type PolicyDecision = "allow" | "deny";

export interface EvaluateResult {
  decision: PolicyDecision;
  reasons: string[];
}
