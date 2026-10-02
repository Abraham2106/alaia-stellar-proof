import { expect, it } from "vitest";
import { runJudge } from "../src/index.js";

// No mocks: explicit opt-in and a real preloaded local QVAC/Qwen server are required.
it.skipIf(process.env.ALAIA_QVAC_LIVE !== "1")("real QVAC/Qwen evaluates a permitted synthetic payment", async () => {
  expect(process.env.ALAIA_QVAC).toBe("1");
  const destination = "GCKFBEIYTKP6XCBT3DDPMLLKZZ7HKDMFFUEKTEIN55UUZ4CKZVMXVWM";
  const verdict = await runJudge(JSON.stringify({
    userIntent: `Pay 0.5 XLM to ${destination}`,
    payment: { destination, asset: { kind: "native" }, amount: "5000000", feeStroops: "10000", operations: ["payment"] },
    policy: { maxAmountStroops: "10000000", allowedDestinations: [destination], allowedAssets: [{ kind: "native" }], maxFeeStroops: "100000" },
    untrustedEvidence: null,
  }));
  expect(verdict).toEqual({ label: "allow", codes: ["ok"] });
}, 120_000);
