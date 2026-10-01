import { describe, expect, it } from "vitest";
import { runNegativeCases } from "../src/runNegativeCases.js";

describe("runNegativeCases (DEC-0004)", () => {
  it("returns exactly four outcomes in stable order", () => {
    const cases = runNegativeCases();
    expect(cases.map((c) => c.id)).toEqual([
      "invoice_lie",
      "destination_swap",
      "signature_bypass_stand_in",
      "allowed_control",
    ]);
  });

  it("invoice lie denies admin_operation when amount is under cap", () => {
    const outcome = runNegativeCases().find((c) => c.id === "invoice_lie");
    expect(outcome).toBeDefined();
    expect(outcome!.result.decision).toBe("deny");
    expect(outcome!.result.reasons).toContain("admin_operation");
    expect(outcome!.result.reasons).toEqual(["admin_operation"]);
  });

  it("destination swap denies destination_denied for non-allowlisted destination", () => {
    const outcome = runNegativeCases().find((c) => c.id === "destination_swap");
    expect(outcome).toBeDefined();
    expect(outcome!.result.decision).toBe("deny");
    expect(outcome!.result.reasons).toContain("destination_denied");
    expect(outcome!.result.reasons).toEqual(["destination_denied"]);
  });

  it("signature bypass stand-in denies fee_over_cap when fee exceeds maxFeeStroops", () => {
    const outcome = runNegativeCases().find(
      (c) => c.id === "signature_bypass_stand_in",
    );
    expect(outcome).toBeDefined();
    expect(outcome!.result.decision).toBe("deny");
    expect(outcome!.result.reasons).toContain("fee_over_cap");
    expect(outcome!.result.reasons).toEqual(["fee_over_cap"]);
  });

  it("allowed control permits a clean native payment with empty reasons", () => {
    const outcome = runNegativeCases().find((c) => c.id === "allowed_control");
    expect(outcome).toBeDefined();
    expect(outcome!.result).toEqual({ decision: "allow", reasons: [] });
  });
});
