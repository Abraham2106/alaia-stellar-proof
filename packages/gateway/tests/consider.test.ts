import { beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair, MemoHash, Transaction } from "@stellar/stellar-sdk";
import { runJudge } from "@alaia/judge";
import type { JudgeVerdict } from "@alaia/judge";
import { receiptMemoHash } from "@alaia/receipt";
import { STANDALONE_PASSPHRASE } from "@alaia/stellar-classic";
import { consider, type ConsiderInput } from "../src/consider.js";

// Explicit unit-test substitute; the production gateway has no verdict/stub argument.
vi.mock("@alaia/judge", async importOriginal => ({
  ...await importOriginal<typeof import("@alaia/judge")>(), runJudge: vi.fn(),
}));
const judge = vi.mocked(runJudge);
const DEST = Keypair.random().publicKey();
const OTHER_DEST = Keypair.random().publicKey();
function baseInput(overrides: Partial<ConsiderInput> = {}): ConsiderInput {
  return {
    policyVersion: "budget-v1",
    policy: { maxAmountStroops: 10_000_000n, allowedDestinations: [DEST], allowedAssets: [{ kind: "native" }], maxFeeStroops: 100_000n },
    sourcePublic: Keypair.random().publicKey(), sequence: "1", destination: DEST,
    asset: { kind: "native" }, amount: 5_000_000n, feeStroops: 10_000n,
    operations: ["payment"], userIntent: "Pay the approved office supplier", ...overrides,
  };
}
beforeEach(() => { judge.mockReset(); judge.mockResolvedValue({ label: "allow", codes: ["ok"] }); });

describe("consider: required judge authorization", () => {
  it("runs the judge and anchors its request/result in the payment memo", async () => {
    const input = baseInput();
    const result = await consider(input);
    expect(judge).toHaveBeenCalledTimes(1);
    const prompt = JSON.parse(judge.mock.calls[0][0]);
    expect(prompt.payment.destination).toBe(input.destination);
    expect(prompt.payment.amount).toBe("5000000");
    expect(prompt.sourcePublic).toBe(input.sourcePublic);
    expect(result.decision).toBe("allow");
    expect(result.policyDecision).toBe("allow");
    expect(result.receipt.judge).toMatchObject({ model: "decider-0.8b", label: "allow", codes: ["ok"] });
    expect(result.receipt.judge?.requestHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.memoHash).toBe(receiptMemoHash(result.receipt));
    const tx = new Transaction(result.envelope!.xdr, STANDALONE_PASSPHRASE);
    expect(tx.memo.type).toBe(MemoHash);
    expect((tx.memo.value as Buffer).toString("hex")).toBe(result.memoHash);
    expect(tx.hash().toString("hex")).toBe(result.envelope!.hash);
  });

  it.each([
    [{ operations: ["payment", "setOptions"] }, "admin_operation"],
    [{ amount: 10_000_001n }, "over_cap"],
    [{ destination: OTHER_DEST }, "destination_denied"],
  ] as const)("rejects deterministic violations before running inference: %s", async (overrides, reason) => {
    const result = await consider(baseInput(overrides as Partial<ConsiderInput>));
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain(reason);
    expect(result.envelope).toBeNull();
    expect(result.receipt.judge).toBeUndefined();
    expect(judge).not.toHaveBeenCalled();
  });

  it.each([
    [{ label: "escalate", codes: ["runtime_unavailable"] }, "escalate", "runtime_unavailable"],
    [{ label: "escalate", codes: ["intent_ambiguous"] }, "escalate", "intent_ambiguous"],
    [{ label: "deny", codes: ["recipient_mismatch"] }, "deny", "recipient_mismatch"],
    [{ label: "allow", codes: ["untrusted_instruction"] }, "escalate", "untrusted_instruction"],
    [{ label: "allow", codes: [] }, "escalate", "judge_escalate"],
    [{ label: "allow", codes: ["recipient_mismatch"] }, "escalate", "recipient_mismatch"],
  ])("does not build an envelope for an unsafe judge result: %s", async (verdict, decision, reason) => {
    judge.mockResolvedValue(verdict as JudgeVerdict);
    const result = await consider(baseInput());
    expect(result.policyDecision).toBe("allow");
    expect(result.decision).toBe(decision);
    expect(result.receipt.decision).toBe(decision);
    expect(result.reasons).toContain(reason);
    expect(result.envelope).toBeNull();
  });

  it("fails closed if the runtime throws", async () => {
    judge.mockRejectedValue(new Error("worker died"));
    const result = await consider(baseInput());
    expect(result.decision).toBe("escalate");
    expect(result.reasons).toContain("runtime_unavailable");
    expect(result.envelope).toBeNull();
  });

  it("ignores a caller-supplied allow verdict", async () => {
    judge.mockResolvedValue({ label: "escalate", codes: ["runtime_unavailable"] });
    const input = { ...baseInput(), verdict: { label: "allow", codes: ["ok"] } };
    const result = await consider(input);
    expect(judge).toHaveBeenCalledTimes(1);
    expect(result.envelope).toBeNull();
  });

  it("does not substitute XLM for a policy-approved credit asset", async () => {
    const asset = { kind: "credit" as const, code: "USDC", issuer: DEST };
    const input = baseInput({ asset });
    input.policy.allowedAssets = [asset];
    const result = await consider(input);
    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("unsupported_asset");
    expect(result.envelope).toBeNull();
    expect(judge).not.toHaveBeenCalled();
  });

  it("signable bytes retain the snapshot reviewed before an asynchronous mutation", async () => {
    let resolve!: (v: JudgeVerdict) => void;
    judge.mockReturnValue(new Promise(r => { resolve = r; }));
    const input = baseInput();
    const pending = consider(input);
    input.destination = OTHER_DEST;
    input.amount = 99_000_000n;
    input.operations.push("setOptions");
    input.policy.allowedDestinations = [OTHER_DEST];
    resolve({ label: "allow", codes: ["ok"] });
    const result = await pending;
    const tx = new Transaction(result.envelope!.xdr, STANDALONE_PASSPHRASE);
    expect(tx.operations[0]).toMatchObject({ type: "payment", destination: DEST, amount: "0.5000000" });
    expect(result.receipt.destination).toBe(DEST);
    expect(result.receipt.amountStroops).toBe("5000000");
  });

  it("agent scope without grant denies before judge and emits no envelope", async () => {
    const result = await consider(baseInput({ walletClass: "agent" }));
    expect(result.decision).toBe("deny");
    expect(result.policyDecision).toBe("deny");
    expect(result.reasons).toContain("grant_required");
    expect(result.envelope).toBeNull();
    expect(result.receipt.judge).toBeUndefined();
    expect(judge).not.toHaveBeenCalled();
  });

  it("different evidence changes the anchored request even with the same verdict", async () => {
    const input = baseInput();
    const a = await consider({ ...input, evidence: "invoice A" });
    const b = await consider({ ...input, evidence: "invoice B" });
    expect(a.receipt.judge?.requestHash).not.toBe(b.receipt.judge?.requestHash);
    expect(a.memoHash).not.toBe(b.memoHash);
  });
});
