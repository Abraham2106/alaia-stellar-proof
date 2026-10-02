import { contextReasons } from "./context.js";
import { BUDGET_SIGNERS, thresholdReasons } from "./signers.js";
import { spendingReasons } from "./spending.js";
import type {
  AuthorizationLayers,
  BudgetPolicy,
  CanonicalPayment,
  EvaluateResult,
} from "./types.js";

/** Split a budget policy into signers, context, and spending limits. */
export function fromBudgetPolicy(policy: BudgetPolicy): AuthorizationLayers {
  return {
    signers: BUDGET_SIGNERS,
    context: {
      allowedDestinations: policy.allowedDestinations,
      allowedAssets: policy.allowedAssets,
    },
    spending: {
      threshold: 2,
      maxAmountStroops: policy.maxAmountStroops,
      maxFeeStroops: policy.maxFeeStroops,
    },
  };
}

/**
 * Run the three layers in the order evaluate() has always reported:
 * empty ops, amount, destination, asset, fee, admin op, then signer threshold.
 */
export function authorize(
  payment: CanonicalPayment,
  layers: AuthorizationLayers,
): EvaluateResult {
  const context = contextReasons(payment, layers.context);
  const spending = spendingReasons(payment, layers.spending);
  const signers = thresholdReasons(layers.signers, layers.spending.threshold);

  const reasons = [
    ...context.filter((reason) => reason === "empty_operations"),
    ...spending.filter((reason) => reason === "non_positive_amount" || reason === "over_cap"),
    ...context.filter((reason) => reason === "destination_denied" || reason === "asset_denied"),
    ...spending.filter((reason) => reason === "fee_over_cap"),
    ...context.filter((reason) => reason === "admin_operation"),
    ...signers,
  ];

  if (reasons.length === 0) {
    return { decision: "allow", reasons: [] };
  }

  return { decision: "deny", reasons };
}
