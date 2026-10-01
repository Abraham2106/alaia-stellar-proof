// DEC-0004: deterministic policy outranks any model; deny yields no envelope.
import { evaluate } from "@alaia/policy";
import type {
  Asset,
  BudgetPolicy,
  CanonicalPayment,
  OperationKind,
  PolicyDecision,
} from "@alaia/policy";
import { receiptMemoHash } from "@alaia/receipt";
import type { Receipt, ReceiptAsset } from "@alaia/receipt";
import { buildPaymentEnvelope } from "@alaia/stellar-classic";

export interface ConsiderInput {
  policyVersion: string;
  policy: BudgetPolicy;
  sourcePublic: string;
  sequence: string | number;
  destination: string;
  asset: Asset;
  amount: bigint;
  feeStroops: bigint;
  operations: OperationKind[];
  memoHash?: string;
}

export interface ConsiderEnvelope {
  xdr: string;
  hash: string;
}

export interface ConsiderResult {
  decision: PolicyDecision;
  reasons: string[];
  memoHash: string;
  envelope: ConsiderEnvelope | null;
}

function toReceiptAsset(asset: Asset): ReceiptAsset {
  if (asset.kind === "native") {
    return "native";
  }
  return `credit:${asset.code}:${asset.issuer}`;
}

function canonicalPaymentFromInput(input: ConsiderInput): CanonicalPayment {
  const payment: CanonicalPayment = {
    destination: input.destination,
    asset: input.asset,
    amount: input.amount,
    feeStroops: input.feeStroops,
    operations: input.operations,
  };
  if (input.memoHash !== undefined) {
    payment.memoHash = input.memoHash;
  }
  return payment;
}

function receiptFromDecision(
  payment: CanonicalPayment,
  policyVersion: string,
  decision: PolicyDecision,
  reasons: string[],
): Receipt {
  return {
    policyVersion,
    destination: payment.destination,
    asset: toReceiptAsset(payment.asset),
    amountStroops: payment.amount.toString(),
    feeStroops: payment.feeStroops.toString(),
    decision,
    reasons,
  };
}

export function consider(input: ConsiderInput): ConsiderResult {
  const payment = canonicalPaymentFromInput(input);
  const { decision, reasons } = evaluate(payment, input.policy);
  const receipt = receiptFromDecision(
    payment,
    input.policyVersion,
    decision,
    reasons,
  );
  const memoHash = receiptMemoHash(receipt);

  if (decision === "deny") {
    return { decision, reasons, memoHash, envelope: null };
  }

  const envelope = buildPaymentEnvelope({
    sourcePublic: input.sourcePublic,
    sequence: input.sequence,
    destination: payment.destination,
    amountStroops: payment.amount,
    feeStroops: Number(payment.feeStroops),
    memoHash32: memoHash,
  });

  return { decision, reasons, memoHash, envelope };
}
