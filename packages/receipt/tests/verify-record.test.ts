import { describe, expect, it } from "vitest";
import {
  parseVerifyRecord,
  verifyRecordHash,
  type VerifyRecord,
} from "../src/index.ts";

const HEX64 = "a".repeat(64);
const GRANT = "b".repeat(64);

function baseRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    standard: "alaia-verify-1",
    walletClass: "human",
    decision: "allow",
    artifactSha256: HEX64,
    corpusSha256: HEX64,
    neighborIds: [],
    ...overrides,
  };
}

describe("parseVerifyRecord", () => {
  it("accepts human allow without grantHash", () => {
    const record = parseVerifyRecord(baseRecord());
    expect(record.walletClass).toBe("human");
    expect(record.decision).toBe("allow");
    expect(record).not.toHaveProperty("grantHash");
  });

  it("accepts agent allow with grantHash", () => {
    const record = parseVerifyRecord(
      baseRecord({ walletClass: "agent", grantHash: GRANT }),
    );
    expect(record.walletClass).toBe("agent");
    expect(record.grantHash).toBe(GRANT);
  });

  it("rejects agent allow without grantHash", () => {
    expect(() =>
      parseVerifyRecord(baseRecord({ walletClass: "agent" })),
    ).toThrow(/grantHash is required/);
  });

  it("rejects duplicate neighbor ids", () => {
    expect(() =>
      parseVerifyRecord(baseRecord({ neighborIds: ["case-a", "case-a"] })),
    ).toThrow(/duplicates/);
  });
});

describe("verifyRecordHash", () => {
  it("is stable for the same logical record", () => {
    const parsed = parseVerifyRecord(baseRecord());
    const a = verifyRecordHash(parsed);
    const b = verifyRecordHash(parsed);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when neighbor order changes", () => {
    const first = parseVerifyRecord(baseRecord({ neighborIds: ["a", "b"] }));
    const second = parseVerifyRecord(baseRecord({ neighborIds: ["b", "a"] }));
    expect(verifyRecordHash(first)).not.toBe(verifyRecordHash(second));
  });

  it("includes grantHash for agent allow in the canonical payload", () => {
    const record = parseVerifyRecord(
      baseRecord({ walletClass: "agent", grantHash: GRANT }),
    ) as VerifyRecord;
    expect(verifyRecordHash(record)).not.toBe(
      verifyRecordHash(parseVerifyRecord(baseRecord({ walletClass: "agent", decision: "deny" }))),
    );
  });
});
