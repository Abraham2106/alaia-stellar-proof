import { afterEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({
  spawn: spawnMock,
}));

import { runJudge } from "../src/index.js";

describe("System One adapter registry", () => {
  const previousStrands = process.env.ALAIA_STRANDS;
  const previousAdapter = process.env.ALAIA_JUDGE_ADAPTER;

  afterEach(() => {
    spawnMock.mockClear();
    if (previousStrands === undefined) delete process.env.ALAIA_STRANDS;
    else process.env.ALAIA_STRANDS = previousStrands;
    if (previousAdapter === undefined) delete process.env.ALAIA_JUDGE_ADAPTER;
    else process.env.ALAIA_JUDGE_ADAPTER = previousAdapter;
  });

  it("unknown ALAIA_JUDGE_ADAPTER escalates runtime_unavailable and does not spawn", async () => {
    process.env.ALAIA_STRANDS = "1";
    process.env.ALAIA_JUDGE_ADAPTER = "no-such-adapter";

    const verdict = await runJudge("pay office");
    expect(verdict).toEqual({
      label: "escalate",
      codes: ["runtime_unavailable"],
    });
    expect(spawnMock).not.toHaveBeenCalled();
  });
});
