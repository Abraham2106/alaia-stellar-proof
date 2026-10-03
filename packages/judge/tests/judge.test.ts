import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyJudge,
  parseJudgeVerdict,
  runJudge,
  strandsJudgeRequest,
  STRANDS_CHECKPOINT,
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
  const previousStrands = process.env.ALAIA_STRANDS;

  afterEach(() => {
    vi.unstubAllEnvs();
    if (previousStrands === undefined) {
      delete process.env.ALAIA_STRANDS;
    } else {
      process.env.ALAIA_STRANDS = previousStrands;
    }
  });

  it("escalates when ALAIA_STRANDS is unset", async () => {
    delete process.env.ALAIA_STRANDS;
    const verdict = await runJudge("pay office");
    expect(verdict).toEqual({
      label: "escalate",
      codes: ["runtime_unavailable"],
    });
  });
});

describe("strandsJudgeRequest", () => {
  it("pins checkpoint and five frozen questions", () => {
    const req = strandsJudgeRequest("review this payment");
    expect(req.checkpoint).toBe(STRANDS_CHECKPOINT);
    expect(req.state).toBe("review this payment");
    expect(req.questions).toHaveLength(5);
    expect(req.questions[0]).toMatchObject({
      type: "noul",
      id: "recipient_match",
    });
  });
});
