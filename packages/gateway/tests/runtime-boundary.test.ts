import { afterEach, expect, it, vi } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { consider } from "../src/consider.js";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("real gateway with disabled QVAC rejects a policy-allowed payment without any network call", async () => {
  vi.stubEnv("ALAIA_QVAC", "0");
  const network = vi.fn().mockRejectedValue(new Error("network forbidden"));
  vi.stubGlobal("fetch", network);
  const destination = Keypair.random().publicKey();
  const result = await consider({
    policyVersion: "budget-v1", sourcePublic: Keypair.random().publicKey(), sequence: "1",
    policy: { allowedDestinations: [destination], allowedAssets: [{ kind: "native" }], maxAmountStroops: 10_000_000n, maxFeeStroops: 100_000n },
    destination, asset: { kind: "native" }, amount: 5_000_000n, feeStroops: 10_000n, operations: ["payment"],
  });
  expect(result.policyDecision).toBe("allow");
  expect(result.decision).toBe("escalate");
  expect(result.envelope).toBeNull();
  expect(result.reasons).toContain("runtime_unavailable");
  expect(network).not.toHaveBeenCalled();
});
