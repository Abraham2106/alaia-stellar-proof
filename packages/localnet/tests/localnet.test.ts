import { describe, expect, it } from "vitest";
import {
  LOCAL_HORIZON,
  STANDALONE_PASSPHRASE,
  assertLocalHorizon,
  quickstartPlan,
} from "../src/index.js";

describe("@alaia/localnet", () => {
  it("uses the standalone Quickstart passphrase exactly", () => {
    expect(STANDALONE_PASSPHRASE).toBe("Standalone Network ; February 2017");
  });

  it("quickstartPlan keeps publicInternet false", () => {
    const plan = quickstartPlan();
    expect(plan.publicInternet).toBe(false);
    expect(plan.image).toBe("stellar/quickstart");
    expect(plan.network).toBe("local");
    expect(plan.horizon).toBe(LOCAL_HORIZON);
    expect(plan.passphrase).toBe(STANDALONE_PASSPHRASE);
  });

  describe("assertLocalHorizon", () => {
    it("accepts 127.0.0.1", () => {
      expect(() => assertLocalHorizon("http://127.0.0.1:8000")).not.toThrow();
      expect(() => assertLocalHorizon(LOCAL_HORIZON)).not.toThrow();
    });

    it("accepts localhost", () => {
      expect(() => assertLocalHorizon("http://localhost:8000")).not.toThrow();
    });

    it("rejects horizon.stellar.org", () => {
      expect(() => assertLocalHorizon("https://horizon.stellar.org")).toThrow();
      expect(() => assertLocalHorizon("http://horizon.stellar.org")).toThrow();
    });

    it("rejects HTTPS public hosts", () => {
      expect(() => assertLocalHorizon("https://example.com/horizon")).toThrow();
      expect(() =>
        assertLocalHorizon("https://horizon-testnet.stellar.org"),
      ).toThrow();
    });
  });
});
