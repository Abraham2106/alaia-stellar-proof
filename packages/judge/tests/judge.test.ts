import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyJudge,
  parseJudgeVerdict,
  qvacJudgeRequest,
  runJudge,
} from "../src/index.js";

describe("parseJudgeVerdict", () => {
  it("parses valid allow JSON", () => {
    const verdict = parseJudgeVerdict(
      JSON.stringify({ label: "allow", codes: ["ok"] }),
    );
    expect(verdict).toEqual({ label: "allow", codes: ["ok"] });
  });

  it("escalates on garbage text", () => {
    const verdict = parseJudgeVerdict("not json at all");
    expect(verdict).toEqual({ label: "escalate", codes: ["schema_invalid"] });
  });

  it("escalates on unknown code", () => {
    const verdict = parseJudgeVerdict(
      JSON.stringify({ label: "allow", codes: ["totally_unknown"] }),
    );
    expect(verdict).toEqual({ label: "escalate", codes: ["schema_invalid"] });
  });
});

describe("applyJudge", () => {
  it("keeps policy deny when judge allows", () => {
    const result = applyJudge("deny", { label: "allow", codes: ["ok"] });
    expect(result).toBe("deny");
  });

  it("allows when policy and judge agree with ok", () => {
    const result = applyJudge("allow", { label: "allow", codes: ["ok"] });
    expect(result).toBe("allow");
  });

  it("denies when policy allows but judge denies", () => {
    const result = applyJudge("allow", {
      label: "deny",
      codes: ["recipient_mismatch"],
    });
    expect(result).toBe("deny");
  });
});

describe("runJudge", () => {
  const previousQvac = process.env.ALAIA_QVAC;

  afterEach(() => {
    vi.unstubAllEnvs();
    if (previousQvac === undefined) {
      delete process.env.ALAIA_QVAC;
    } else {
      process.env.ALAIA_QVAC = previousQvac;
    }
  });

  it("escalates when ALAIA_QVAC is unset", async () => {
    delete process.env.ALAIA_QVAC;
    const verdict = await runJudge("pay office");
    expect(verdict).toEqual({
      label: "escalate",
      codes: ["runtime_unavailable"],
    });
  });

  it("escalates when ALAIA_QVAC=1 but the local server is unavailable", async () => {
    process.env.ALAIA_QVAC = "1";
    vi.stubEnv("ALAIA_QVAC_URL", "http://127.0.0.1:1/v1");
    const verdict = await runJudge("pay office");
    expect(verdict).toEqual({
      label: "escalate",
      codes: ["runtime_unavailable"],
    });
  });
});

describe("qvacJudgeRequest", () => {
  it("pins model, temperature 0, and seed 42", () => {
    const req = qvacJudgeRequest("review this payment");
    expect(req).toMatchObject({
      model: "Qwen3-4B",
      responseFormat: "json_schema",
      temperature: 0,
      seed: 42,
      prompt: "review this payment",
    });
  });
});
