// DEC-0004: deterministic policy outranks any model; this module has no judge path.
import { assetAllowed } from "./assets.js";
import type {
  BudgetPolicy,
  CanonicalPayment,
  EvaluateResult,
  OperationKind,
} from "./types.js";

function isAdminOperation(kind: OperationKind): boolean {
  return kind !== "payment";
}

export function evaluate(
  payment: CanonicalPayment,
  policy: BudgetPolicy,
): EvaluateResult {
  const reasons: string[] = [];

  if (payment.operations.length === 0) {
    reasons.push("empty_operations");
  }

  if (payment.amount <= 0n) {
    reasons.push("non_positive_amount");
  } else if (payment.amount > policy.maxAmountStroops) {
    reasons.push("over_cap");
  }

  if (!policy.allowedDestinations.includes(payment.destination)) {
    reasons.push("destination_denied");
  }

  if (!assetAllowed(payment.asset, policy.allowedAssets)) {
    reasons.push("asset_denied");
  }

  if (payment.feeStroops > policy.maxFeeStroops) {
    reasons.push("fee_over_cap");
  }

  const hasAdminOperation = payment.operations.some(isAdminOperation);
  if (hasAdminOperation) {
    reasons.push("admin_operation");
  }

  if (reasons.length === 0) {
    return { decision: "allow", reasons: [] };
  }

  return { decision: "deny", reasons };
}
