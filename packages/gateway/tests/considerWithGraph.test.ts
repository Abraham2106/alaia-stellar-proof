import { beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { runJudge } from "@alaia/judge";
import { CORPUS_PAYMENTS } from "@alaia/rag-graph";
import { considerWithGraph, type ConsiderInput } from "../src/index.js";

vi.mock("@alaia/judge", async importOriginal => ({
  ...await importOriginal<typeof import("@alaia/judge")>(),
  runJudge: vi.fn(),
}));
const judge = vi.mocked(runJudge);

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

beforeEach(() => {
  judge.mockReset();
  judge.mockResolvedValue({ label: "allow", codes: ["ok"] });
});

describe("considerWithGraph", () => {
  it("policy deny => envelope null even for a known graph edge", async () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const result = await considerWithGraph(
      baseInput({ amount: 10_000_001n }),
      { from: edge.from, to: edge.to },
    );

    expect(result.decision).toBe("deny");
    expect(result.envelope).toBeNull();
    expect(result.reasons).not.toContain("graph_unknown");
    expect(judge).not.toHaveBeenCalled();
  });

  it("policy allow + unknown destination => envelope null and graph_unknown", async () => {
    const edge = CORPUS_PAYMENTS[0]!;
    const result = await considerWithGraph(baseInput(), {
      from: edge.from,
      to: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    });

    expect(result.decision).toBe("allow");
    expect(result.envelope).toBeNull();
    expect(result.reasons).toContain("graph_unknown");
    expect(result.reasons).not.toContain("runtime_unavailable");
    expect(judge).not.toHaveBeenCalled();
  });

  it("policy allow + known corpus edge => judge path without QVAC (fail closed)", async () => {
    const judgeModule = await vi.importActual<typeof import("@alaia/judge")>("@alaia/judge");
    judge.mockImplementation(judgeModule.runJudge);
    const edge = CORPUS_PAYMENTS[2]!;
    const result = await considerWithGraph(baseInput(), {
      from: edge.from,
      to: edge.to,
    });

    expect(judge).toHaveBeenCalledTimes(1);
    expect(result.policyDecision).toBe("allow");
    expect(result.decision).toBe("escalate");
    expect(result.envelope).toBeNull();
    expect(result.reasons).toContain("runtime_unavailable");
    expect(result.reasons).not.toContain("graph_unknown");
  });
});
