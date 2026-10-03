// DEC-0004: one required local judge; deterministic policy outranks the model.
import { createHash } from "node:crypto";
import { applyJudge, runJudge, STRANDS_MODEL, strandsJudgeRequest } from "@alaia/judge";
import type { JudgeVerdict } from "@alaia/judge";
import { evaluate } from "@alaia/policy";
import type { Asset, BudgetPolicy, CanonicalPayment, Grant, OperationKind, PolicyDecision } from "@alaia/policy";
import { receiptMemoHash } from "@alaia/receipt";
import type { Receipt, ReceiptAsset, ReceiptDecision } from "@alaia/receipt";
import { buildPaymentEnvelope, STANDALONE_PASSPHRASE } from "@alaia/stellar-classic";

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
  /** From the operator's trusted approval surface, not merchant evidence. */
  userIntent?: string;
  /** Untrusted invoice/tool data; cannot define policy. */
  evidence?: string;
  walletClass?: "human" | "agent";
  grant?: Grant;
}

export interface ConsiderEnvelope { xdr: string; hash: string }

export interface ConsiderResult {
  /** Final authorization decision, not merely the deterministic policy result. */
  decision: ReceiptDecision;
  policyDecision: PolicyDecision;
  reasons: string[];
  receipt: Receipt;
  memoHash: string;
  envelope: ConsiderEnvelope | null;
  /** DEC-0010: exact JSON preimage of receipt.judge.requestHash when the judge ran. */
  judgeRequestJson?: string;
}

function receiptAsset(asset: Asset): ReceiptAsset {
  return asset.kind === "native" ? "native" : `credit:${asset.code}:${asset.issuer}`;
}

/** Snapshot before awaiting inference: callers cannot mutate the payment under review. */
function snapshot(input: ConsiderInput): ConsiderInput {
  return {
    ...input, asset: { ...input.asset }, operations: [...input.operations],
    policy: {
      ...input.policy, allowedDestinations: [...input.policy.allowedDestinations],
      allowedAssets: input.policy.allowedAssets.map(asset => ({ ...asset })),
    },
  };
}

export async function consider(proposed: ConsiderInput): Promise<ConsiderResult> {
  const input = snapshot(proposed);
  const payment: CanonicalPayment = {
    destination: input.destination, asset: input.asset, amount: input.amount,
    feeStroops: input.feeStroops, operations: input.operations,
    ...(input.memoHash === undefined ? {} : { memoHash: input.memoHash }),
  };
  // DEC-0015: agent spend requires a human grant; policy closes non-payment tools
  const scope =
    input.walletClass === undefined && input.grant === undefined
      ? undefined
      : {
          ...(input.walletClass !== undefined ? { walletClass: input.walletClass } : {}),
          ...(input.grant !== undefined ? { grant: input.grant } : {}),
        };
  const policy =
    scope === undefined
      ? evaluate(payment, input.policy)
      : evaluate(payment, input.policy, scope);
  // The Classic builder currently emits only XLM, even if a caller lists credit assets.
  if (payment.asset.kind !== "native") {
    policy.decision = "deny";
    policy.reasons.push("unsupported_asset");
  }
  let decision: ReceiptDecision = policy.decision;
  const reasons = [...policy.reasons];
  let judge: Receipt["judge"];
  let judgeRequestJson: string | undefined;

  if (policy.decision === "allow") {
    const prompt = JSON.stringify({
      network: STANDALONE_PASSPHRASE, sourcePublic: input.sourcePublic,
      sequence: String(input.sequence), policyVersion: input.policyVersion,
      policy: {
        maxAmountStroops: input.policy.maxAmountStroops.toString(),
        maxFeeStroops: input.policy.maxFeeStroops.toString(),
        allowedDestinations: input.policy.allowedDestinations,
        allowedAssets: input.policy.allowedAssets,
      },
      payment: { ...payment, amount: payment.amount.toString(), feeStroops: payment.feeStroops.toString() },
      userIntent: input.userIntent ?? null, untrustedEvidence: input.evidence ?? null,
    });
    // DEC-0016: preimage is the strands-decider ask body, not a QVAC chat completion.
    const request = strandsJudgeRequest(prompt);
    judgeRequestJson = JSON.stringify(request);
    let verdict: JudgeVerdict;
    try {
      // Never consume caller-provided verdicts. Validate at the authorization boundary.
      verdict = await runJudge(prompt);
    } catch {
      verdict = { label: "escalate", codes: ["runtime_unavailable"] };
    }
    decision = applyJudge(policy.decision, verdict);
    judge = {
      model: STRANDS_MODEL,
      requestHash: createHash("sha256").update(judgeRequestJson).digest("hex"),
      label: verdict.label, codes: [...verdict.codes],
    };
    if (decision !== "allow") reasons.push(decision === "deny" ? "judge_deny" : "judge_escalate", ...verdict.codes);
  }

  const receipt: Receipt = {
    policyVersion: input.policyVersion, destination: payment.destination,
    asset: receiptAsset(payment.asset), amountStroops: payment.amount.toString(),
    feeStroops: payment.feeStroops.toString(), decision, reasons,
    ...(judge ? { judge } : {}),
  };
  const memoHash = receiptMemoHash(receipt);
  const envelope = decision === "allow" ? buildPaymentEnvelope({
    sourcePublic: input.sourcePublic, sequence: input.sequence,
    destination: payment.destination, amountStroops: payment.amount,
    feeStroops: Number(payment.feeStroops), memoHash32: memoHash,
  }) : null;
  return {
    decision, policyDecision: policy.decision, reasons, receipt, memoHash, envelope,
    ...(judgeRequestJson === undefined ? {} : { judgeRequestJson }),
  };
}
