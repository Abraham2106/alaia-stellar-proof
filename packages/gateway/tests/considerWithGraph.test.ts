import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { CORPUS_PAYMENTS } from "@alaia/rag-graph";
import { considerWithGraph, type ConsiderInput } from "../src/index.js";

const DEST = Keypair.random().publicKey();

function baseInput(overrides: Partial<ConsiderInput> = {}): ConsiderInput {
  const source = Keypair.random();
  return {
    policyVersion: "budget-v1",
    policy: {
      maxAmountStroops: 10_000_000n,
      allowedDestinations: [DEST],
      allowedAssets: [{ kind: "native" }],
      maxFeeStroops: 100_000n,
    },
    sourcePublic: source.publicKey(),
    sequence: "1",
    destination: DEST,
    asset: { kind: "native" },
    amount: 5_000_000n,
    feeStroops: 10_000n,
    operations: ["payment"],
    ...overrides,
  };
}

describe("considerWithGraph", () => {
  it("policy deny => envelope null even for a known graph edge", () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const result = considerWithGraph(
      baseInput({ amount: 10_000_001n }),
      { from: edge.from, to: edge.to },
    );

    expect(result.decision).toBe("deny");
    expect(result.envelope).toBeNull();
    expect(result.reasons).not.toContain("graph_unknown");
  });

  it("policy allow + unknown destination => envelope null and graph_unknown", () => {
    const edge = CORPUS_PAYMENTS[0]!;
    const result = considerWithGraph(baseInput(), {
      from: edge.from,
      to: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    });

    expect(result.decision).toBe("allow");
    expect(result.envelope).toBeNull();
    expect(result.reasons).toContain("graph_unknown");
  });

  it("policy allow + known corpus edge => non-null envelope", () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const result = considerWithGraph(baseInput(), {
      from: edge.from,
      to: edge.to,
    });

    expect(result.decision).toBe("allow");
    expect(result.envelope).not.toBeNull();
    expect(result.reasons).not.toContain("graph_unknown");
  });
});
