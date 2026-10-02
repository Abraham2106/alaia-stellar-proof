import type { CanonicalPayment, SpendingPolicy } from "./types.js";

/** Spending policy: amount cap and fee cap. Threshold lives with the signers. */
export function spendingReasons(
  payment: CanonicalPayment,
  policy: SpendingPolicy,
): string[] {
  const reasons: string[] = [];

  if (payment.amount <= 0n) {
    reasons.push("non_positive_amount");
  } else if (payment.amount > policy.maxAmountStroops) {
    reasons.push("over_cap");
  }

  if (payment.feeStroops > policy.maxFeeStroops) {
    reasons.push("fee_over_cap");
  }

  return reasons;
}
