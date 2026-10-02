// DEC-0004: deterministic policy outranks any model; this module has no judge path.
// Signers, context rules, and spending policies (threshold and caps) are separate layers.
// DEC-0015: agent spend requires a human grant; policy closes non-payment tools
import type { Grant } from "./grant.js";
import { grantCoversPayment } from "./grant-match.js";
import { authorize, fromBudgetPolicy } from "./layers.js";
import type { BudgetPolicy, CanonicalPayment, EvaluateResult } from "./types.js";

export type EvaluateScope = {
  walletClass?: "human" | "agent";
  grant?: Grant;
};

export function evaluate(
  payment: CanonicalPayment,
  policy: BudgetPolicy,
  scope?: EvaluateScope,
): EvaluateResult {
  const base = authorize(payment, fromBudgetPolicy(policy));
  const walletClass = scope?.walletClass ?? "human";

  if (walletClass === "human") {
    return base;
  }

  const reasons = [...base.reasons];

  if (scope?.grant === undefined) {
    reasons.push("grant_required");
  } else if (!grantCoversPayment(payment, scope.grant)) {
    reasons.push("grant_mismatch");
  }

  if (reasons.length === 0) {
    return { decision: "allow", reasons: [] };
  }

  return { decision: "deny", reasons };
}
