// DEC-0004: deterministic policy outranks any model; this module has no judge path.
// Signers, context rules, and spending policies (threshold and caps) are separate layers.
import { authorize, fromBudgetPolicy } from "./layers.js";
import type { BudgetPolicy, CanonicalPayment, EvaluateResult } from "./types.js";

export function evaluate(
  payment: CanonicalPayment,
  policy: BudgetPolicy,
): EvaluateResult {
  return authorize(payment, fromBudgetPolicy(policy));
}
