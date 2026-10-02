import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evaluate, gateToolCall, grantHash } from "../src/index.js";
import type { BudgetPolicy, CanonicalPayment, Grant } from "../src/index.js";

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

const baseGrant = (overrides: Partial<Grant> = {}): Grant => ({
  walletClass: "human",
  destination: DEST,
  asset: "native",
  maxAmountStroops: "10000000",
  policyVersion: "verify-1",
  ...overrides,
});

describe("grantHash", () => {
  it("matches SHA-256 of key-sorted JSON with lowercase hex", () => {
    const grant = baseGrant();
    const canonical = JSON.stringify({
      asset: "native",
      destination: DEST,
      maxAmountStroops: "10000000",
      policyVersion: "verify-1",
      walletClass: "human",
    });
    const expected = createHash("sha256").update(canonical, "utf8").digest("hex");
    expect(grantHash(grant)).toBe(expected);
    expect(grantHash(grant)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable regardless of object field declaration order", () => {
    const a: Grant = {
      policyVersion: "v1",
      maxAmountStroops: "1",
      asset: "native",
      destination: DEST,
      walletClass: "human",
    };
    const b: Grant = {
      walletClass: "human",
      destination: DEST,
      asset: "native",
      maxAmountStroops: "1",
      policyVersion: "v1",
    };
    expect(grantHash(a)).toBe(grantHash(b));
  });
});

describe("evaluate agent scope", () => {
  it("denies grant_required when agent has no grant", () => {
    const result = evaluate(basePayment(), basePolicy(), {
      walletClass: "agent",
    });
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("grant_required");
  });

  it("denies grant_mismatch when destination differs", () => {
    const result = evaluate(
      basePayment({ destination: OTHER_DEST }),
      {
        ...basePolicy(),
        allowedDestinations: [OTHER_DEST],
      },
      { walletClass: "agent", grant: baseGrant() },
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("grant_mismatch");
  });

  it("denies grant_mismatch when asset differs", () => {
    const issuer =
      "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    const policy: BudgetPolicy = {
      ...basePolicy(),
      allowedAssets: [{ kind: "credit", code: "USDC", issuer }],
    };
    const result = evaluate(
      basePayment({ asset: { kind: "credit", code: "USDC", issuer } }),
      policy,
      {
        walletClass: "agent",
        grant: baseGrant({ asset: "native" }),
      },
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("grant_mismatch");
  });

  it("denies grant_mismatch when amount exceeds grant cap", () => {
    const result = evaluate(
      basePayment({ amount: 6_000_000n }),
      basePolicy(),
      {
        walletClass: "agent",
        grant: baseGrant({ maxAmountStroops: "5000000" }),
      },
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("grant_mismatch");
  });

  it("does not allow a matching grant to override policy deny", () => {
    const result = evaluate(
      basePayment({ amount: 99_000_000n }),
      basePolicy(),
      { walletClass: "agent", grant: baseGrant({ maxAmountStroops: "100000000" }) },
    );
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("over_cap");
    expect(result.reasons).not.toContain("grant_mismatch");
  });

  it("allows agent payment when policy and grant align", () => {
    const result = evaluate(basePayment(), basePolicy(), {
      walletClass: "agent",
      grant: baseGrant(),
    });
    expect(result).toEqual({ decision: "allow", reasons: [] });
  });
});

describe("gateToolCall", () => {
  it("denies setOptions with signer_change_denied and no questions", () => {
    expect(gateToolCall({ tool: "setOptions" })).toEqual({
      decision: "deny",
      reasons: ["signer_change_denied"],
      questions: false,
    });
  });

  it("denies invokeContract with contract_rail_closed and no questions", () => {
    expect(gateToolCall({ tool: "invokeContract" })).toEqual({
      decision: "deny",
      reasons: ["contract_rail_closed"],
      questions: false,
    });
  });

  it("denies changeTrust with trustline_closed and no questions", () => {
    expect(gateToolCall({ tool: "changeTrust" })).toEqual({
      decision: "deny",
      reasons: ["trustline_closed"],
      questions: false,
    });
  });

  it("allows human payment with questions true when policy allows", () => {
    const result = gateToolCall({
      tool: "payment",
      payment: basePayment(),
      policy: basePolicy(),
    });
    expect(result).toEqual({
      decision: "allow",
      reasons: [],
      questions: true,
    });
  });

  it("sets questions false when payment is denied", () => {
    const result = gateToolCall({
      tool: "payment",
      payment: basePayment({ amount: 0n }),
      policy: basePolicy(),
    });
    expect(result.decision).toBe("deny");
    expect(result.questions).toBe(false);
  });

  it("sets questions false for agent without grant", () => {
    const result = gateToolCall({
      tool: "payment",
      payment: basePayment(),
      policy: basePolicy(),
      scope: { walletClass: "agent" },
    });
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("grant_required");
    expect(result.questions).toBe(false);
  });
});
