// DEC-0004: graph gate before the judge; a known edge cannot override a policy deny
import { assess } from "@alaia/rag-graph";
import type { PaymentCandidate } from "@alaia/rag-graph";
import { evaluate } from "@alaia/policy";
import type { CanonicalPayment } from "@alaia/policy";
import { receiptMemoHash } from "@alaia/receipt";
import type { Receipt, ReceiptAsset, ReceiptDecision } from "@alaia/receipt";
import { consider, type ConsiderInput, type ConsiderResult } from "./consider.js";

function receiptAsset(asset: ConsiderInput["asset"]): ReceiptAsset {
  return asset.kind === "native" ? "native" : `credit:${asset.code}:${asset.issuer}`;
}

function policyGateResult(
  input: ConsiderInput,
  extraReasons: string[] = [],
): ConsiderResult {
  const payment: CanonicalPayment = {
    destination: input.destination,
    asset: input.asset,
    amount: input.amount,
    feeStroops: input.feeStroops,
    operations: input.operations,
    ...(input.memoHash === undefined ? {} : { memoHash: input.memoHash }),
  };
  const policy = evaluate(payment, input.policy);
  if (payment.asset.kind !== "native") {
    policy.decision = "deny";
    policy.reasons.push("unsupported_asset");
  }
  const decision: ReceiptDecision = policy.decision;
  const reasons = [...policy.reasons, ...extraReasons];
  const receipt: Receipt = {
    policyVersion: input.policyVersion,
    destination: payment.destination,
    asset: receiptAsset(payment.asset),
    amountStroops: payment.amount.toString(),
    feeStroops: payment.feeStroops.toString(),
    decision,
    reasons,
  };
  const memoHash = receiptMemoHash(receipt);
  return {
    decision,
    policyDecision: policy.decision,
    reasons,
    receipt,
    memoHash,
    envelope: null,
  };
}

export async function considerWithGraph(
  input: ConsiderInput,
  candidate: PaymentCandidate,
): Promise<ConsiderResult> {
  const payment: CanonicalPayment = {
    destination: input.destination,
    asset: input.asset,
    amount: input.amount,
    feeStroops: input.feeStroops,
    operations: input.operations,
    ...(input.memoHash === undefined ? {} : { memoHash: input.memoHash }),
  };
  const policy = evaluate(payment, input.policy);
  if (payment.asset.kind !== "native") {
    policy.decision = "deny";
    policy.reasons.push("unsupported_asset");
  }
  const policyAllows = policy.decision === "allow";
  const assessment = assess(candidate, policyAllows);

  if (!policyAllows || !assessment.accept) {
    const extraReasons =
      policyAllows && assessment.graph === "unknown" ? ["graph_unknown"] : [];
    return policyGateResult(input, extraReasons);
  }

  return await consider(input);
}
