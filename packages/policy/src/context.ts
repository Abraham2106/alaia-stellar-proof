import { assetAllowed } from "./assets.js";
import type { CanonicalPayment, ContextRule, OperationKind } from "./types.js";

function isAdminOperation(kind: OperationKind): boolean {
  return kind !== "payment";
}

/** Context of the payment: who receives it, which asset, and that every op is a payment. */
export function contextReasons(
  payment: CanonicalPayment,
  rule: ContextRule,
): string[] {
  const reasons: string[] = [];

  if (payment.operations.length === 0) {
    reasons.push("empty_operations");
  }

  if (!rule.allowedDestinations.includes(payment.destination)) {
    reasons.push("destination_denied");
  }

  if (!assetAllowed(payment.asset, rule.allowedAssets)) {
    reasons.push("asset_denied");
  }

  if (payment.operations.some(isAdminOperation)) {
    reasons.push("admin_operation");
  }

  return reasons;
}
