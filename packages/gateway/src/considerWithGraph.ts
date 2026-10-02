// DEC-0004: graph gate before the judge; a known edge cannot override a policy deny
// DEC-0007: candidate endpoints must match input; unknown graph => escalate
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
  options: { extraReasons?: string[]; decision?: ReceiptDecision } = {},
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
  const decision: ReceiptDecision = options.decision ?? policy.decision;
  const reasons = [...policy.reasons, ...(options.extraReasons ?? [])];
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

  if (!policyAllows) {
    return policyGateResult(input);
  }

  if (
    candidate.from !== input.sourcePublic ||
    candidate.to !== input.destination
  ) {
    return policyGateResult(input, {
      decision: "deny",
      extraReasons: ["graph_candidate_mismatch"],
    });
  }

  const assessment = assess(candidate, policyAllows);

  if (!assessment.accept) {
    const extraReasons =
      assessment.graph === "unknown" ? ["graph_unknown"] : [];
    const decision: ReceiptDecision =
      assessment.graph === "unknown" ? "escalate" : policy.decision;
    return policyGateResult(input, { decision, extraReasons });
  }

  return await consider(input);
}
