// DEC-0004: negative grader slice — no network, no ledger, no judge.
import { evaluate } from "@alaia/policy";
import type { BudgetPolicy, CanonicalPayment, EvaluateResult } from "@alaia/policy";

const ALLOWED_DEST =
  "GCKFBEIYTKP6XCBT3DDPMLLKZZ7HKDMFFUEKTEIN55UUZ4CKZVMXVWM";
const DENIED_DEST =
  "GBBO4ZDDZTSM2IUKQYBAST3CFHNPFXECGELS2MN6IMUONQSBSY2B7LC";

const slicePolicy = (): BudgetPolicy => ({
  maxAmountStroops: 10_000_000n,
  allowedDestinations: [ALLOWED_DEST],
  allowedAssets: [{ kind: "native" }],
  maxFeeStroops: 100_000n,
});

export type NegativeCaseId =
  | "invoice_lie"
  | "destination_swap"
  | "signature_bypass_stand_in"
  | "allowed_control";

export interface NegativeCaseOutcome {
  id: NegativeCaseId;
  payment: CanonicalPayment;
  result: EvaluateResult;
}

/** Runs the four DEC-0004 policy negative cases against a shared budget policy. */
export function runNegativeCases(): readonly NegativeCaseOutcome[] {
  const policy = slicePolicy();

  const invoiceLiePayment: CanonicalPayment = {
    destination: ALLOWED_DEST,
    asset: { kind: "native" },
    amount: 5_000_000n,
    feeStroops: 10_000n,
    operations: ["payment", "setOptions"],
  };

  const destinationSwapPayment: CanonicalPayment = {
    destination: DENIED_DEST,
    asset: { kind: "native" },
    amount: 5_000_000n,
    feeStroops: 10_000n,
    operations: ["payment"],
  };

  const signatureBypassStandInPayment: CanonicalPayment = {
    destination: ALLOWED_DEST,
    asset: { kind: "native" },
    amount: 5_000_000n,
    feeStroops: 100_001n,
    operations: ["payment"],
  };

  const allowedControlPayment: CanonicalPayment = {
    destination: ALLOWED_DEST,
    asset: { kind: "native" },
    amount: 5_000_000n,
    feeStroops: 10_000n,
    operations: ["payment"],
  };

  return [
    {
      id: "invoice_lie",
      payment: invoiceLiePayment,
      result: evaluate(invoiceLiePayment, policy),
    },
    {
      id: "destination_swap",
      payment: destinationSwapPayment,
      result: evaluate(destinationSwapPayment, policy),
    },
    {
      id: "signature_bypass_stand_in",
      payment: signatureBypassStandInPayment,
      result: evaluate(signatureBypassStandInPayment, policy),
    },
    {
      id: "allowed_control",
      payment: allowedControlPayment,
      result: evaluate(allowedControlPayment, policy),
    },
  ];
}
