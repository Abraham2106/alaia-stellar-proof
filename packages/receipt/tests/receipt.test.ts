import { describe, expect, it } from "vitest";
import {
  canonicalReceiptBytes,
  receiptMemoHash,
  type Receipt,
} from "../src/index.ts";
import { parseReceiptUnknown } from "../src/parse-receipt.ts";

function sampleReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    policyVersion: "1",
    destination: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    asset: "native",
    amountStroops: "10000000",
    feeStroops: "100",
    decision: "allow",
    reasons: ["within_budget"],
    ...overrides,
  };
}

describe("receiptMemoHash", () => {
  it("is stable for the same logical receipt", () => {
    const receipt = sampleReceipt();
    const a = receiptMemoHash(receipt);
    const b = receiptMemoHash(receipt);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when destination changes", () => {
    const base = sampleReceipt();
    const other = sampleReceipt({
      destination: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    });
    expect(receiptMemoHash(other)).not.toBe(receiptMemoHash(base));
  });

  it("changes when amountStroops changes", () => {
    const base = sampleReceipt();
    const other = sampleReceipt({ amountStroops: "9999999" });
    expect(receiptMemoHash(other)).not.toBe(receiptMemoHash(base));
  });

  it("changes when decision changes", () => {
    const base = sampleReceipt();
    const other = sampleReceipt({ decision: "deny" });
    expect(receiptMemoHash(other)).not.toBe(receiptMemoHash(base));
  });

  it("is independent of reason order (reasons are sorted before hash)", () => {
    const first = sampleReceipt({ reasons: ["z_reason", "a_reason"] });
    const second = sampleReceipt({ reasons: ["a_reason", "z_reason"] });
    expect(receiptMemoHash(first)).toBe(receiptMemoHash(second));
  });

  it("returns lowercase hex of length 64", () => {
    const hash = receiptMemoHash(sampleReceipt());
    expect(hash).toHaveLength(64);
    expect(hash).toBe(hash.toLowerCase());
  });
});

describe("canonicalReceiptBytes", () => {
  it("emits UTF-8 JSON with sorted keys and no whitespace", () => {
    const bytes = canonicalReceiptBytes(
      sampleReceipt({ reasons: ["b", "a"] }),
    );
    const text = new TextDecoder().decode(bytes);
    expect(text).not.toMatch(/\s/);
    expect(text).toBe(
      '{"amountStroops":"10000000","asset":"native","decision":"allow","destination":"GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF","feeStroops":"100","policyVersion":"1","reasons":["a","b"]}',
    );
  });
});

describe("parseReceiptUnknown judge.model", () => {
  const judgeBase = {
    requestHash: "a".repeat(64),
    label: "allow",
    codes: ["ok"],
  };

  it("accepts strands-decider-2B-hobson-v19 (DEC-0016)", () => {
    const parsed = parseReceiptUnknown({
      ...sampleReceipt(),
      judge: { ...judgeBase, model: "strands-decider-2B-hobson-v19" },
    });
    expect(parsed.judge?.model).toBe("strands-decider-2B-hobson-v19");
  });

  it("accepts historical Qwen3-4B", () => {
    const parsed = parseReceiptUnknown({
      ...sampleReceipt(),
      judge: { ...judgeBase, model: "Qwen3-4B" },
    });
    expect(parsed.judge?.model).toBe("Qwen3-4B");
  });

  it("rejects unknown judge models", () => {
    expect(() =>
      parseReceiptUnknown({
        ...sampleReceipt(),
        judge: { ...judgeBase, model: "other-checkpoint" },
      }),
    ).toThrow(/strands-decider-2B-hobson-v19 or Qwen3-4B/);
  });
});

describe("judge evidence", () => {
  it("anchors the judge request and verdict", () => {
    const receipt = sampleReceipt({ judge: { model: "Qwen3-4B", requestHash: "a".repeat(64), label: "allow", codes: ["ok"] } });
    expect(receiptMemoHash(receipt)).not.toBe(receiptMemoHash(sampleReceipt()));
    expect(receiptMemoHash(receipt)).not.toBe(receiptMemoHash({ ...receipt, judge: { ...receipt.judge!, requestHash: "b".repeat(64) } }));
    expect(receiptMemoHash(receipt)).not.toBe(receiptMemoHash({ ...receipt, judge: { ...receipt.judge!, label: "escalate" } }));
  });
  it("preserves escalation explicitly", () => {
    const text = new TextDecoder().decode(canonicalReceiptBytes(sampleReceipt({ decision: "escalate" })));
    expect(JSON.parse(text).decision).toBe("escalate");
  });
});
