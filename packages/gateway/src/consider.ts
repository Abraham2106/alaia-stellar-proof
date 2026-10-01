// DEC-0004: deterministic policy outranks any model; deny yields no envelope.
import { applyJudge } from "@alaia/judge";
import type { JudgeVerdict } from "@alaia/judge";
import { evaluate } from "@alaia/policy";
import type {
  Asset,
  BudgetPolicy,
  CanonicalPayment,
  OperationKind,
  PolicyDecision,
} from "@alaia/policy";
import { receiptMemoHash } from "@alaia/receipt";
import type { Receipt, ReceiptAsset, ReceiptDecision } from "@alaia/receipt";
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
  verdict?: JudgeVerdict;
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
  decision: ReceiptDecision,
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

function judgeBlockReason(verdict: JudgeVerdict): "judge_deny" | "judge_escalate" {
  return verdict.label === "deny" ? "judge_deny" : "judge_escalate";
}

function buildEnvelopeForAllow(
  input: ConsiderInput,
  payment: CanonicalPayment,
  memoHash: string,
): ConsiderEnvelope {
  return buildPaymentEnvelope({
    sourcePublic: input.sourcePublic,
    sequence: input.sequence,
    destination: payment.destination,
    amountStroops: payment.amount,
    feeStroops: Number(payment.feeStroops),
    memoHash32: memoHash,
  });
}

export function considerWithJudge(
  input: ConsiderInput,
  verdict: JudgeVerdict,
): ConsiderResult {
  return consider({ ...input, verdict });
}

export function consider(input: ConsiderInput): ConsiderResult {
  const payment = canonicalPaymentFromInput(input);
  const { decision: policyDecision, reasons: policyReasons } = evaluate(
    payment,
    input.policy,
  );

  if (input.verdict === undefined) {
    const receipt = receiptFromDecision(
      payment,
      input.policyVersion,
      policyDecision,
      policyReasons,
    );
    const memoHash = receiptMemoHash(receipt);

    if (policyDecision === "deny") {
      return { decision: policyDecision, reasons: policyReasons, memoHash, envelope: null };
    }

    const envelope = buildEnvelopeForAllow(input, payment, memoHash);
    return { decision: policyDecision, reasons: policyReasons, memoHash, envelope };
  }

  if (policyDecision === "deny") {
    const receipt = receiptFromDecision(
      payment,
      input.policyVersion,
      policyDecision,
      policyReasons,
    );
    const memoHash = receiptMemoHash(receipt);
    return { decision: policyDecision, reasons: policyReasons, memoHash, envelope: null };
  }

  const judgeOutcome = applyJudge(policyDecision, input.verdict);

  if (judgeOutcome === "allow") {
    const receipt = receiptFromDecision(
      payment,
      input.policyVersion,
      "allow",
      policyReasons,
    );
    const memoHash = receiptMemoHash(receipt);
    const envelope = buildEnvelopeForAllow(input, payment, memoHash);
    return { decision: policyDecision, reasons: policyReasons, memoHash, envelope };
  }

  const reasons = [...policyReasons, judgeBlockReason(input.verdict)];
  // DEC-0004: receipt decision deny when no envelope so memo hash covers refusal (not a policy deny).
  const receipt = receiptFromDecision(
    payment,
    input.policyVersion,
    "deny",
    reasons,
  );
  const memoHash = receiptMemoHash(receipt);
  return { decision: policyDecision, reasons, memoHash, envelope: null };
}
