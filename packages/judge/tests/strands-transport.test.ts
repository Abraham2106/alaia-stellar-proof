// DEC-0016: fixture executable prints CLI --json; not live inference.
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildStrandsAskArgv,
  runJudge,
  strandsJudgeRequest,
  STRANDS_CHECKPOINT,
  STRANDS_JUDGE_QUESTIONS,
} from "../src/index.js";

const fixtureExecutable = fileURLToPath(
  new URL("./fixtures/strands-decider-stdout.mjs", import.meta.url),
);

describe("strands-decider transport contract (fixture executable)", () => {
  const previousStrands = process.env.ALAIA_STRANDS;
  const previousDecider = process.env.ALAIA_STRANDS_DECIDER;
  const previousMode = process.env.ALAIA_STRANDS_FIXTURE_MODE;
  const previousTimeout = process.env.ALAIA_STRANDS_TIMEOUT_MS;

  afterEach(() => {
    vi.unstubAllEnvs();
    if (previousStrands === undefined) delete process.env.ALAIA_STRANDS;
    else process.env.ALAIA_STRANDS = previousStrands;
    if (previousDecider === undefined) delete process.env.ALAIA_STRANDS_DECIDER;
    else process.env.ALAIA_STRANDS_DECIDER = previousDecider;
    if (previousMode === undefined) delete process.env.ALAIA_STRANDS_FIXTURE_MODE;
    else process.env.ALAIA_STRANDS_FIXTURE_MODE = previousMode;
    if (previousTimeout === undefined) delete process.env.ALAIA_STRANDS_TIMEOUT_MS;
    else process.env.ALAIA_STRANDS_TIMEOUT_MS = previousTimeout;
  });

  it("maps fixture allow JSON to label and codes per DEC-0016", async () => {
    process.env.ALAIA_STRANDS = "1";
    process.env.ALAIA_STRANDS_DECIDER = fixtureExecutable;
    process.env.ALAIA_STRANDS_FIXTURE_MODE = "allow";
    const verdict = await runJudge("payment state");
    expect(verdict).toEqual({ label: "allow", codes: ["ok"] });
  });

  it("maps fixture deny JSON to recipient_mismatch", async () => {
    process.env.ALAIA_STRANDS = "1";
    process.env.ALAIA_STRANDS_DECIDER = fixtureExecutable;
    process.env.ALAIA_STRANDS_FIXTURE_MODE = "deny_mismatch";
    const verdict = await runJudge("payment state");
    expect(verdict).toEqual({
      label: "deny",
      codes: ["recipient_mismatch"],
    });
  });

  it("escalates schema_invalid when fixture JSON breaks noul argmax", async () => {
    process.env.ALAIA_STRANDS = "1";
    process.env.ALAIA_STRANDS_DECIDER = fixtureExecutable;
    process.env.ALAIA_STRANDS_FIXTURE_MODE = "invalid_schema";
    const verdict = await runJudge("payment state");
    expect(verdict).toEqual({ label: "escalate", codes: ["schema_invalid"] });
  });

  it("builds pinned ask argv for the frozen question set", () => {
    const request = strandsJudgeRequest("pay office");
    const argv = buildStrandsAskArgv(request);
    expect(argv[0]).toBe("ask");
    expect(argv[1]).toBe(STRANDS_CHECKPOINT);
    expect(argv).toContain("--state");
    expect(argv).toContain("pay office");
    expect(argv.filter((entry) => entry === "--noul")).toHaveLength(3);
    expect(argv).toContain("--choice");
    expect(argv).toContain("--score");
    expect(argv.at(-1)).toBe("--json");
    const noulTexts = STRANDS_JUDGE_QUESTIONS.filter((q) => q.type === "noul").map(
      (q) => q.text,
    );
    expect(noulTexts).toHaveLength(3);
    for (const text of noulTexts) {
      expect(argv).toContain(text);
    }
    expect(argv.some((entry) => entry.startsWith("recipient_match:"))).toBe(false);
  });

  it("escalates runtime_unavailable when the fixture exits with error", async () => {
    process.env.ALAIA_STRANDS = "1";
    process.env.ALAIA_STRANDS_DECIDER = fixtureExecutable;
    process.env.ALAIA_STRANDS_FIXTURE_MODE = "exit-error";
    const verdict = await runJudge("payment state");
    expect(verdict).toEqual({
      label: "escalate",
      codes: ["runtime_unavailable"],
    });
  });

  it("escalates runtime_unavailable when the fixture hangs past timeout", async () => {
    process.env.ALAIA_STRANDS = "1";
    process.env.ALAIA_STRANDS_DECIDER = fixtureExecutable;
    process.env.ALAIA_STRANDS_FIXTURE_MODE = "hang";
    process.env.ALAIA_STRANDS_TIMEOUT_MS = "50";
    const verdict = await runJudge("payment state");
    expect(verdict).toEqual({
      label: "escalate",
      codes: ["runtime_unavailable"],
    });
  });
});
