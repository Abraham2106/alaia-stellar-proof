import { describe, expect, it } from "vitest";
import {
  Keypair,
  MemoHash,
  Transaction,
} from "@stellar/stellar-sdk";
import { receiptMemoHash } from "@alaia/receipt";
import type { Receipt } from "@alaia/receipt";
import { STANDALONE_PASSPHRASE } from "@alaia/stellar-classic";
import { consider, type ConsiderInput } from "../src/consider.js";

const DEST = Keypair.random().publicKey();
const OTHER_DEST = Keypair.random().publicKey();
const POLICY_VERSION = "budget-v1";

function memoHashFromEnvelope(xdrBase64: string): string {
  const tx = new Transaction(xdrBase64, STANDALONE_PASSPHRASE);
  const memo = tx.memo;
  if (memo.type !== MemoHash) {
    throw new Error(`expected MEMO_HASH, got ${memo.type}`);
  }
  return (memo.value as Buffer).toString("hex");
}

function baseInput(overrides: Partial<ConsiderInput> = {}): ConsiderInput {
  const source = Keypair.random();
  return {
    policyVersion: POLICY_VERSION,
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

function allowReceiptFromInput(input: ConsiderInput): Receipt {
  return {
    policyVersion: input.policyVersion,
    destination: input.destination,
    asset: "native",
    amountStroops: input.amount.toString(),
    feeStroops: input.feeStroops.toString(),
    decision: "allow",
    reasons: [],
  };
}

describe("consider", () => {
  it("allows a valid payment and binds MEMO_HASH to the allow receipt", () => {
    const input = baseInput();
    const result = consider(input);

    expect(result.decision).toBe("allow");
    expect(result.reasons).toEqual([]);
    expect(result.envelope).not.toBeNull();
    expect(result.memoHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.memoHash).toBe(receiptMemoHash(allowReceiptFromInput(input)));
    expect(memoHashFromEnvelope(result.envelope!.xdr)).toBe(result.memoHash);
  });

  it("denies setOptions with null envelope but still emits a receipt memo hash", () => {
    const result = consider(
      baseInput({ operations: ["payment", "setOptions"] }),
    );

    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("admin_operation");
    expect(result.envelope).toBeNull();
    expect(result.memoHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("denies over cap with null envelope but still emits a receipt memo hash", () => {
    const result = consider(baseInput({ amount: 10_000_001n }));

    expect(result.decision).toBe("deny");
    expect(result.reasons).toContain("over_cap");
    expect(result.envelope).toBeNull();
    expect(result.memoHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes memoHash when destination changes", () => {
    const a = consider(baseInput());
    const b = consider(baseInput({ destination: OTHER_DEST }));

    expect(a.memoHash).not.toBe(b.memoHash);
  });
});
