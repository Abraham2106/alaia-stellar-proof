import { describe, expect, it } from "vitest";
import { authorize, fromBudgetPolicy } from "../src/layers.js";
import type { BudgetPolicy, CanonicalPayment } from "../src/types.js";

const DEST = "GCKFBEIYTKP6XCBT3DDPMLLKZZ7HKDMFFUEKTEIN55UUZ4CKZVMXVWM";

const policy = (): BudgetPolicy => ({
  maxAmountStroops: 10_000_000n,
  allowedDestinations: [DEST],
  allowedAssets: [{ kind: "native" }],
  maxFeeStroops: 100_000n,
});

const payment = (): CanonicalPayment => ({
  destination: DEST,
  asset: { kind: "native" },
  amount: 5_000_000n,
  feeStroops: 10_000n,
  operations: ["payment"],
});

describe("authorization layers", () => {
  it("splits signers, context, and spending limits", () => {
    const layers = fromBudgetPolicy(policy());
    expect(layers.signers).toEqual([
      { id: "signerA", weight: 1 },
      { id: "signerB", weight: 1 },
    ]);
    expect(layers.context.allowedDestinations).toEqual([DEST]);
    expect(layers.spending).toEqual({
      threshold: 2,
      maxAmountStroops: 10_000_000n,
      maxFeeStroops: 100_000n,
    });
  });

  it("allows when context matches, both signers meet the threshold, and the spend is inside the cap", () => {
    expect(authorize(payment(), fromBudgetPolicy(policy()))).toEqual({
      decision: "allow",
      reasons: [],
    });
  });

  it("denies a context miss without treating it as a spending-cap failure", () => {
    const result = authorize(
      { ...payment(), destination: "GBBO4ZDDZTSM2IUKQYBAST3CFHNPFXECGELS2MN6IMUONQSBSY2B7LC" },
      fromBudgetPolicy(policy()),
    );
    expect(result.reasons).toEqual(["destination_denied"]);
  });

  it("denies a spend over the cap when the context and the signers are valid", () => {
    const result = authorize(
      { ...payment(), amount: 10_000_001n },
      fromBudgetPolicy(policy()),
    );
    expect(result.reasons).toEqual(["over_cap"]);
  });

  it("denies when signer weight is under the threshold", () => {
    const layers = fromBudgetPolicy(policy());
    const result = authorize(payment(), {
      ...layers,
      signers: [{ id: "signerA", weight: 1 }],
    });
    expect(result).toEqual({ decision: "deny", reasons: ["threshold_unmet"] });
  });
});
