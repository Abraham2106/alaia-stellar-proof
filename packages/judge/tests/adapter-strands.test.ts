import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { strandsCliAdapter } from "../src/adapters/strands-cli.js";
import { parseStrandsDeciderJson } from "../src/strands-parse.js";
import { strandsJudgeRequest } from "../src/strands-request.js";

const fixtureExecutable = fileURLToPath(
  new URL("./fixtures/strands-decider-stdout.mjs", import.meta.url),
);

describe("strands-decider System One adapter", () => {
  const previousAdapter = process.env.ALAIA_JUDGE_ADAPTER;
  const previousDecider = process.env.ALAIA_STRANDS_DECIDER;
  const previousMode = process.env.ALAIA_STRANDS_FIXTURE_MODE;

  afterEach(() => {
    if (previousAdapter === undefined) delete process.env.ALAIA_JUDGE_ADAPTER;
    else process.env.ALAIA_JUDGE_ADAPTER = previousAdapter;
    if (previousDecider === undefined) delete process.env.ALAIA_STRANDS_DECIDER;
    else process.env.ALAIA_STRANDS_DECIDER = previousDecider;
    if (previousMode === undefined) delete process.env.ALAIA_STRANDS_FIXTURE_MODE;
    else process.env.ALAIA_STRANDS_FIXTURE_MODE = previousMode;
  });

  it("runs fixture CLI and parses allow/ok with 2B checkpoint ids", async () => {
    process.env.ALAIA_JUDGE_ADAPTER = "strands-decider";
    process.env.ALAIA_STRANDS_DECIDER = fixtureExecutable;
    process.env.ALAIA_STRANDS_FIXTURE_MODE = "allow";

    expect(strandsCliAdapter.id).toBe("strands-decider");
    expect(strandsCliAdapter.modelId).toBe("strands-decider-2B-hobson-v19");
    expect(strandsCliAdapter.checkpoint).toBe("StrandsAgents/strands-decider-2B-hobson-v19");

    const request = strandsJudgeRequest("synthetic payment state");
    expect(request.checkpoint).toBe("StrandsAgents/strands-decider-2B-hobson-v19");

    const text = await strandsCliAdapter.ask(request);
    expect(parseStrandsDeciderJson(text)).toEqual({
      label: "allow",
      codes: ["ok"],
    });
  });
});
