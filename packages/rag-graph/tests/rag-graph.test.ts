import { describe, expect, it } from "vitest";
import {
  CORPUS_PAYMENTS,
  assess,
  edgeCount,
  retrieve,
} from "../src/index.js";

describe("@alaia/rag-graph (DEC-0004)", () => {
  it("retrieval finds the office-supplies row for query office supplies", () => {
    const hits = retrieve("office supplies", 3);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0]!.memo).toBe("invoice office supplies");
  });

  it("a candidate between two corpus endpoints is known", () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const result = assess(
      { from: edge.from, to: edge.to },
      true,
    );
    expect(result.graph).toBe("known");
  });

  it("a new destination is unknown and accept is false even if policyAllows", () => {
    const edge = CORPUS_PAYMENTS[0]!;
    const result = assess(
      {
        from: edge.from,
        to: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      },
      true,
    );
    expect(result.graph).toBe("unknown");
    expect(result.accept).toBe(false);
  });

  it("known edge + policyAllows false => accept false", () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const result = assess(
      { from: edge.from, to: edge.to },
      false,
    );
    expect(result.graph).toBe("known");
    expect(result.accept).toBe(false);
  });

  it("known edge + policyAllows true => accept true", () => {
    const edge = CORPUS_PAYMENTS[2]!;
    const result = assess(
      { from: edge.from, to: edge.to },
      true,
    );
    expect(result.graph).toBe("known");
    expect(result.accept).toBe(true);
  });

  it("exposes a non-empty synthetic graph", () => {
    expect(edgeCount()).toBeGreaterThanOrEqual(8);
  });
});
