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
    it("accepts loopback hosts with path and query", () => {
      expect(() => assertLocalHorizon("http://127.0.0.1:8000")).not.toThrow();
      expect(() => assertLocalHorizon(LOCAL_HORIZON)).not.toThrow();
      expect(() => assertLocalHorizon("http://localhost:8000")).not.toThrow();
      expect(() =>
        assertLocalHorizon(
          "http://127.0.0.1:8000/friendbot?addr=GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        ),
      ).not.toThrow();
      expect(() =>
        assertLocalHorizon("http://LOCALHOST:8000/"),
      ).not.toThrow();
    });

    it("accepts default http port on loopback", () => {
      expect(() => assertLocalHorizon("http://127.0.0.1")).not.toThrow();
      expect(() => assertLocalHorizon("http://localhost")).not.toThrow();
    });

    it("rejects non-http schemes even on loopback", () => {
      expect(() => assertLocalHorizon("https://127.0.0.1:8000")).toThrow(
        /http/,
      );
      expect(() => assertLocalHorizon("file:///127.0.0.1:8000")).toThrow(
        /http/,
      );
      expect(() => assertLocalHorizon("ftp://127.0.0.1:8000")).toThrow(/http/);
    });

    it("rejects public and LAN hosts", () => {
      expect(() => assertLocalHorizon("https://horizon.stellar.org")).toThrow();
      expect(() => assertLocalHorizon("http://horizon.stellar.org")).toThrow();
      expect(() => assertLocalHorizon("https://example.com/horizon")).toThrow();
      expect(() =>
        assertLocalHorizon("https://horizon-testnet.stellar.org"),
      ).toThrow();
      expect(() => assertLocalHorizon("http://192.168.0.1:8000")).toThrow();
      expect(() => assertLocalHorizon("http://[::1]:8000")).toThrow();
    });

    it("rejects credentials in the URL", () => {
      expect(() =>
        assertLocalHorizon("http://user:pass@127.0.0.1:8000"),
      ).toThrow(/credentials/);
      expect(() =>
        assertLocalHorizon("http://user@localhost:8000"),
      ).toThrow(/credentials/);
    });

    it("rejects URL fragments", () => {
      expect(() =>
        assertLocalHorizon("http://127.0.0.1:8000/#anchor"),
      ).toThrow(/fragment/);
    });

    it("rejects invalid ports", () => {
      expect(() => assertLocalHorizon("http://127.0.0.1:0")).toThrow(/port/);
    });

    it("rejects malformed URLs", () => {
      expect(() => assertLocalHorizon("not-a-url")).toThrow(/Invalid horizon URL/);
    });
  });
});
