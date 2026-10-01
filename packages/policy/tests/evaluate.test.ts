import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate.js";
import type { BudgetPolicy, CanonicalPayment } from "../src/types.js";

const DEST =
  "GCKFBEIYTKP6XCBT3DDPMLLKZZ7HKDMFFUEKTEIN55UUZ4CKZVMXVWM";
const OTHER_DEST =
  "GBBO4ZDDZTSM2IUKQYBAST3CFHNPFXECGELS2MN6IMUONQSBSY2B7LC";

const basePolicy = (): BudgetPolicy => ({
  maxAmountStroops: 10_000_000n,
  allowedDestinations: [DEST],
  allowedAssets: [{ kind: "native" }],
  maxFeeStroops: 100_000n,
});

const basePayment = (overrides: Partial<CanonicalPayment> = {}): CanonicalPayment => ({
  destination: DEST,
  asset: { kind: "native" },
  amount: 5_000_000n,
  feeStroops: 10_000n,
  operations: ["payment"],
  ...overrides,
});

describe("evaluate", () => {
  it("allows a payment that satisfies every rule", () => {
    const result = evaluate(basePayment(), basePolicy());
    expect(result).toEqual({ decision: "allow", reasons: [] });
  });

  it("denies over_cap when amount exceeds maxAmountStroops", () => {
    const result = evaluate(
      basePayment({ amount: 10_000_001n }),
      basePolicy(),
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("over_cap");
  });

  it("denies non_positive_amount for zero amount", () => {
    const result = evaluate(basePayment({ amount: 0n }), basePolicy());
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("non_positive_amount");
    expect(result.reasons).not.toContain("over_cap");
  });

  it("denies destination_denied when destination is not allowlisted", () => {
    const result = evaluate(
      basePayment({ destination: OTHER_DEST }),
      basePolicy(),
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("destination_denied");
  });

  it("denies asset_denied when asset is not allowlisted", () => {
    const policy = basePolicy();
    const result = evaluate(
      basePayment({
        asset: {
          kind: "credit",
          code: "USDC",
          issuer:
            "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        },
      }),
      policy,
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("asset_denied");
  });

  it("allows credit asset when code and issuer match allowlist", () => {
    const issuer =
      "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    const policy: BudgetPolicy = {
      ...basePolicy(),
      allowedAssets: [{ kind: "credit", code: "USDC", issuer }],
    };
    const result = evaluate(
      basePayment({ asset: { kind: "credit", code: "USDC", issuer } }),
      policy,
    );
    expect(result).toEqual({ decision: "allow", reasons: [] });
  });

  it("denies fee_over_cap when fee exceeds maxFeeStroops", () => {
    const result = evaluate(
      basePayment({ feeStroops: 100_001n }),
      basePolicy(),
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("fee_over_cap");
  });

  it("denies empty_operations when operation list is empty", () => {
    const result = evaluate(basePayment({ operations: [] }), basePolicy());
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("empty_operations");
  });

  it("denies admin_operation for each non-payment operation kind", () => {
    const kinds = [
      "setOptions",
      "accountMerge",
      "manageData",
      "pathPayment",
      "changeTrust",
      "createAccount",
      "other",
    ] as const;

    for (const kind of kinds) {
      const result = evaluate(
        basePayment({ operations: ["payment", kind] }),
        basePolicy(),
      );
      expect(result.decision).toBe("deny");
      expect(result.reasons).toContain("admin_operation");
    }
  });

  it("denies admin_operation when amount is under cap but setOptions is present", () => {
    const result = evaluate(
      basePayment({
        amount: 1n,
        operations: ["payment", "setOptions"],
      }),
      basePolicy(),
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toEqual(["admin_operation"]);
  });

  it("accumulates every failing reason without stopping at the first", () => {
    const result = evaluate(
      basePayment({
        destination: OTHER_DEST,
        amount: 0n,
        feeStroops: 999_999n,
        operations: ["setOptions"],
        asset: {
          kind: "credit",
          code: "NOPE",
          issuer:
            "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        },
      }),
      basePolicy(),
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "non_positive_amount",
        "destination_denied",
        "asset_denied",
        "fee_over_cap",
        "admin_operation",
      ]),
    );
    expect(result.reasons).toHaveLength(5);
  });
});
