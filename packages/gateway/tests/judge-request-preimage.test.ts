// DEC-0010: judgeRequestJson is the exact UTF-8 preimage of receipt.judge.requestHash.
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { qvacJudgeRequest, runJudge } from "@alaia/judge";
import {
  CORPUS_PAYMENTS,
  QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
  QUICKSTART_FIXTURE_SOURCE_PUBLIC,
} from "@alaia/rag-graph";
import { consider, type ConsiderInput } from "../src/consider.js";
import { considerWithGraph } from "../src/considerWithGraph.js";

vi.mock("@alaia/judge", async importOriginal => ({
  ...await importOriginal<typeof import("@alaia/judge")>(),
  runJudge: vi.fn(),
}));
const judge = vi.mocked(runJudge);

const DEST = Keypair.random().publicKey();
const OTHER_DEST = Keypair.random().publicKey();

function baseInput(overrides: Partial<ConsiderInput> = {}): ConsiderInput {
  return {
    policyVersion: "budget-v1",
    policy: {
      maxAmountStroops: 10_000_000n,
      allowedDestinations: [DEST],
      allowedAssets: [{ kind: "native" }],
      maxFeeStroops: 100_000n,
    },
    sourcePublic: Keypair.random().publicKey(),
    sequence: "1",
    destination: DEST,
    asset: { kind: "native" },
    amount: 5_000_000n,
    feeStroops: 10_000n,
    operations: ["payment"],
    userIntent: "Pay the approved office supplier",
    ...overrides,
  };
}

beforeEach(() => {
  judge.mockReset();
  judge.mockResolvedValue({ label: "allow", codes: ["ok"] });
});

describe("DEC-0010 judgeRequestJson preimage", () => {
  it("SHA256(judgeRequestJson) equals receipt.judge.requestHash", async () => {
    const result = await consider(baseInput());
    expect(result.judgeRequestJson).toBeDefined();
    const hash = createHash("sha256").update(result.judgeRequestJson!).digest("hex");
    expect(hash).toBe(result.receipt.judge?.requestHash);
  });

  it("judgeRequestJson matches JSON.stringify(qvacJudgeRequest(prompt)) from runJudge", async () => {
    const input = baseInput({ evidence: "invoice café ☕" });
    const result = await consider(input);
    const prompt = judge.mock.calls[0]![0] as string;
    expect(result.judgeRequestJson).toBe(JSON.stringify(qvacJudgeRequest(prompt)));
  });

  it("embeds system prompt, user intent, policy, and Unicode evidence in the descriptor", async () => {
    const intent = "Pagar proveedor — ñoño 日本語";
    const evidence = "Factura #42 — €500";
    const result = await consider(baseInput({ userIntent: intent, evidence }));
    const parsed = JSON.parse(result.judgeRequestJson!) as ReturnType<typeof qvacJudgeRequest>;
    expect(parsed.systemPrompt).toContain("payment reviewer");
    const inner = JSON.parse(parsed.prompt);
    expect(inner.userIntent).toBe(intent);
    expect(inner.untrustedEvidence).toBe(evidence);
    expect(inner.policy.maxAmountStroops).toBe("10000000");
    expect(inner.payment.destination).toBe(DEST);
  });

  it("does not add api keys, credentials, or URLs beyond the QVAC descriptor", async () => {
    const result = await consider(baseInput());
    const parsed = JSON.parse(result.judgeRequestJson!) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty("apiKey");
    expect(parsed).not.toHaveProperty("credentials");
    expect(parsed).not.toHaveProperty("url");
    expect(parsed).not.toHaveProperty("api_key");
    expect(Object.keys(parsed).sort()).toEqual(
      ["maxTokens", "model", "prompt", "reasoningBudget", "responseFormat", "schema", "seed", "systemPrompt", "temperature"].sort(),
    );
    expect(parsed.seed).toBe(42);
  });

  it("includes judgeRequestJson when judge escalates (runtime unavailable)", async () => {
    judge.mockResolvedValue({ label: "escalate", codes: ["runtime_unavailable"] });
    const result = await consider(baseInput());
    expect(result.judgeRequestJson).toBeDefined();
    expect(createHash("sha256").update(result.judgeRequestJson!).digest("hex"))
      .toBe(result.receipt.judge?.requestHash);
  });

  it("omits judgeRequestJson when policy denies before the judge", async () => {
    const result = await consider(baseInput({ destination: OTHER_DEST }));
    expect(result.receipt.judge).toBeUndefined();
    expect(result.judgeRequestJson).toBeUndefined();
    expect(judge).not.toHaveBeenCalled();
  });

  it("omits judgeRequestJson on graph_unknown without running the judge", async () => {
    const edge = CORPUS_PAYMENTS[0]!;
    const unknownDest = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const result = await considerWithGraph(
      baseInput({
        sourcePublic: edge.from,
        destination: unknownDest,
        policy: {
          maxAmountStroops: 10_000_000n,
          allowedDestinations: [unknownDest],
          allowedAssets: [{ kind: "native" }],
          maxFeeStroops: 100_000n,
        },
      }),
      { from: edge.from, to: unknownDest },
    );
    expect(result.judgeRequestJson).toBeUndefined();
    expect(judge).not.toHaveBeenCalled();
  });

  it("omits judgeRequestJson on graph_candidate_mismatch without running the judge", async () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const result = await considerWithGraph(
      baseInput({
        sourcePublic: edge.from,
        destination: edge.to,
        policy: {
          maxAmountStroops: 10_000_000n,
          allowedDestinations: [edge.to],
          allowedAssets: [{ kind: "native" }],
          maxFeeStroops: 100_000n,
        },
      }),
      { from: Keypair.random().publicKey(), to: edge.to },
    );
    expect(result.judgeRequestJson).toBeUndefined();
    expect(judge).not.toHaveBeenCalled();
  });

  it("includes judgeRequestJson when graph path runs the judge", async () => {
    const result = await considerWithGraph(
      baseInput({
        sourcePublic: QUICKSTART_FIXTURE_SOURCE_PUBLIC,
        destination: QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
        policy: {
          maxAmountStroops: 10_000_000n,
          allowedDestinations: [QUICKSTART_FIXTURE_DESTINATION_PUBLIC],
          allowedAssets: [{ kind: "native" }],
          maxFeeStroops: 100_000n,
        },
      }),
      {
        from: QUICKSTART_FIXTURE_SOURCE_PUBLIC,
        to: QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
      },
    );
    expect(result.judgeRequestJson).toBeDefined();
    expect(createHash("sha256").update(result.judgeRequestJson!).digest("hex"))
      .toBe(result.receipt.judge?.requestHash);
  });
});
