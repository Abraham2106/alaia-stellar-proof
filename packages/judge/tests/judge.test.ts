import { describe, expect, it } from "vitest";
import { applyJudge, parseJudgeVerdict, qvacJudgeRequest } from "../src/index.js";

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
});

describe("qvacJudgeRequest", () => {
  it("pins model, temperature 0, and seed 42", () => {
    const req = qvacJudgeRequest("review this payment");
    expect(req).toEqual({
      model: "Qwen3-4B",
      responseFormat: "json_schema",
      temperature: 0,
      seed: 42,
      prompt: "review this payment",
    });
  });
});
