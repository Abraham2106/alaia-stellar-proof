import { beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair, MemoHash, Transaction } from "@stellar/stellar-sdk";
import { runJudge } from "@alaia/judge";
import type { JudgeVerdict } from "@alaia/judge";
import {
  CORPUS_PAYMENTS,
  QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
  QUICKSTART_FIXTURE_SOURCE_PUBLIC,
} from "@alaia/rag-graph";
import { receiptMemoHash } from "@alaia/receipt";
import { STANDALONE_PASSPHRASE } from "@alaia/stellar-classic";
import { considerWithGraph, type ConsiderInput } from "../src/index.js";

vi.mock("@alaia/judge", async importOriginal => ({
  ...await importOriginal<typeof import("@alaia/judge")>(),
  runJudge: vi.fn(),
}));
const judge = vi.mocked(runJudge);

const UNKNOWN_DEST = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

function baseInput(overrides: Partial<ConsiderInput> = {}): ConsiderInput {
  const source = Keypair.random();
  const destination = Keypair.random().publicKey();
  return {
    policyVersion: "budget-v1",
    policy: {
      maxAmountStroops: 10_000_000n,
      allowedDestinations: [destination],
      allowedAssets: [{ kind: "native" }],
      maxFeeStroops: 100_000n,
    },
    sourcePublic: source.publicKey(),
    sequence: "1",
    destination,
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
    const input = baseInput({
      sourcePublic: edge.from,
      destination: edge.to,
      amount: 10_000_001n,
      policy: {
        maxAmountStroops: 10_000_000n,
        allowedDestinations: [edge.to],
        allowedAssets: [{ kind: "native" }],
        maxFeeStroops: 100_000n,
      },
    });
    const result = await considerWithGraph(input, {
      from: edge.from,
      to: edge.to,
    });

    expect(result.decision).toBe("deny");
    expect(result.envelope).toBeNull();
    expect(result.reasons).not.toContain("graph_unknown");
    expect(result.reasons).not.toContain("graph_candidate_mismatch");
    expect(judge).not.toHaveBeenCalled();
  });

  it("policy deny precedes graph_candidate_mismatch", async () => {
    const edge = CORPUS_PAYMENTS[0]!;
    const result = await considerWithGraph(
      baseInput({ amount: 10_000_001n }),
      { from: edge.from, to: edge.to },
    );

    expect(result.decision).toBe("deny");
    expect(result.reasons).not.toContain("graph_candidate_mismatch");
    expect(judge).not.toHaveBeenCalled();
  });

  it("candidate.from mismatch => deny, graph_candidate_mismatch, no judge", async () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const input = baseInput({
      sourcePublic: edge.from,
      destination: edge.to,
      policy: {
        maxAmountStroops: 10_000_000n,
        allowedDestinations: [edge.to],
        allowedAssets: [{ kind: "native" }],
        maxFeeStroops: 100_000n,
      },
    });
    const result = await considerWithGraph(input, {
      from: Keypair.random().publicKey(),
      to: edge.to,
    });

    expect(result.decision).toBe("deny");
    expect(result.policyDecision).toBe("allow");
    expect(result.receipt.decision).toBe("deny");
    expect(result.reasons).toContain("graph_candidate_mismatch");
    expect(result.envelope).toBeNull();
    expect(judge).not.toHaveBeenCalled();
  });

  it("known corpus candidate with different actual payment endpoints => deny without judge (DEC-0007 bypass)", async () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const actualSource = Keypair.random().publicKey();
    const actualDest = Keypair.random().publicKey();
    const input = baseInput({
      sourcePublic: actualSource,
      destination: actualDest,
      policy: {
        maxAmountStroops: 10_000_000n,
        allowedDestinations: [actualDest],
        allowedAssets: [{ kind: "native" }],
        maxFeeStroops: 100_000n,
      },
    });
    const result = await considerWithGraph(input, {
      from: edge.from,
      to: edge.to,
    });

    expect(result.policyDecision).toBe("allow");
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("graph_candidate_mismatch");
    expect(result.envelope).toBeNull();
    expect(judge).not.toHaveBeenCalled();
  });

  it("candidate.to mismatch => deny, graph_candidate_mismatch, no judge", async () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const input = baseInput({
      sourcePublic: edge.from,
      destination: edge.to,
      policy: {
        maxAmountStroops: 10_000_000n,
        allowedDestinations: [edge.to],
        allowedAssets: [{ kind: "native" }],
        maxFeeStroops: 100_000n,
      },
    });
    const result = await considerWithGraph(input, {
      from: edge.from,
      to: Keypair.random().publicKey(),
    });

    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("graph_candidate_mismatch");
    expect(result.envelope).toBeNull();
    expect(judge).not.toHaveBeenCalled();
  });

  it("policy allow + unknown destination => escalate, graph_unknown, envelope null", async () => {
    const edge = CORPUS_PAYMENTS[0]!;
    const input = baseInput({
      sourcePublic: edge.from,
      destination: UNKNOWN_DEST,
      policy: {
        maxAmountStroops: 10_000_000n,
        allowedDestinations: [UNKNOWN_DEST],
        allowedAssets: [{ kind: "native" }],
        maxFeeStroops: 100_000n,
      },
    });
    const result = await considerWithGraph(input, {
      from: edge.from,
      to: UNKNOWN_DEST,
    });

    expect(result.decision).toBe("escalate");
    expect(result.policyDecision).toBe("allow");
    expect(result.receipt.decision).toBe("escalate");
    expect(result.envelope).toBeNull();
    expect(result.reasons).toContain("graph_unknown");
    expect(result.reasons).not.toContain("runtime_unavailable");
    expect(judge).not.toHaveBeenCalled();
  });

  it("policy allow + known matching edge => judge path without strands (fail closed)", async () => {
    const judgeModule = await vi.importActual<typeof import("@alaia/judge")>("@alaia/judge");
    judge.mockImplementation(judgeModule.runJudge);
    const edge = CORPUS_PAYMENTS[2]!;
    const input = baseInput({
      sourcePublic: edge.from,
      destination: edge.to,
      policy: {
        maxAmountStroops: 10_000_000n,
        allowedDestinations: [edge.to],
        allowedAssets: [{ kind: "native" }],
        maxFeeStroops: 100_000n,
      },
    });
    const result = await considerWithGraph(input, {
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

  describe("Quickstart fixture edge with mocked judge (DEC-0007)", () => {
    function quickstartInput(overrides: Partial<ConsiderInput> = {}): ConsiderInput {
      return baseInput({
        sourcePublic: QUICKSTART_FIXTURE_SOURCE_PUBLIC,
        destination: QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
        amount: 5_000_000n,
        feeStroops: 10_000n,
        policy: {
          maxAmountStroops: 10_000_000n,
          allowedDestinations: [QUICKSTART_FIXTURE_DESTINATION_PUBLIC],
          allowedAssets: [{ kind: "native" }],
          maxFeeStroops: 100_000n,
        },
        userIntent: "Pay the approved office supplier",
        ...overrides,
      });
    }

    const quickstartCandidate = {
      from: QUICKSTART_FIXTURE_SOURCE_PUBLIC,
      to: QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
    };

    it("mocked judge allow builds a valid payment envelope", async () => {
      const input = quickstartInput();
      const result = await considerWithGraph(input, quickstartCandidate);

      expect(judge).toHaveBeenCalledTimes(1);
      expect(result.policyDecision).toBe("allow");
      expect(result.decision).toBe("allow");
      expect(result.envelope).not.toBeNull();
      expect(result.memoHash).toBe(receiptMemoHash(result.receipt));
      const tx = new Transaction(result.envelope!.xdr, STANDALONE_PASSPHRASE);
      expect(tx.memo.type).toBe(MemoHash);
      expect((tx.memo.value as Buffer).toString("hex")).toBe(result.memoHash);
      expect(tx.hash().toString("hex")).toBe(result.envelope!.hash);
    });

    it.each([
      [{ label: "deny", codes: ["recipient_mismatch"] }, "deny"],
      [{ label: "escalate", codes: ["intent_ambiguous"] }, "escalate"],
    ] as const)(
      "mocked judge %s => envelope null",
      async (verdict, decision) => {
        judge.mockResolvedValue(verdict as JudgeVerdict);
        const result = await considerWithGraph(quickstartInput(), quickstartCandidate);

        expect(judge).toHaveBeenCalledTimes(1);
        expect(result.policyDecision).toBe("allow");
        expect(result.decision).toBe(decision);
        expect(result.envelope).toBeNull();
      },
    );
  });
});
