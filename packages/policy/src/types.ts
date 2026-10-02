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

/** Who may authorize a spend, and with what weight. Keys stay outside this package. */
export type SignerWeight = {
  id: "signerA" | "signerB";
  weight: number;
};

/** Where a payment is allowed to apply: destination, asset, and payment-only operations. */
export type ContextRule = {
  allowedDestinations: readonly string[];
  allowedAssets: readonly Asset[];
};

/** Threshold plus spending caps. Separate from who signs and from where the payment applies. */
export type SpendingPolicy = {
  threshold: number;
  maxAmountStroops: bigint;
  maxFeeStroops: bigint;
};

export type AuthorizationLayers = {
  signers: readonly SignerWeight[];
  context: ContextRule;
  spending: SpendingPolicy;
};

export type PolicyDecision = "allow" | "deny";

export interface EvaluateResult {
  decision: PolicyDecision;
  reasons: string[];
}
