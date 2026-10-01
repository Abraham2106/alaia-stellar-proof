import { parseJudgeVerdict } from "./parse.js";
import { qvacJudgeRequest, type QvacJudgeRequest } from "./qvac.js";
import type { JudgeVerdict } from "./types.js";

type QvacRunnerModule = {
  runQvacJudge: (request: QvacJudgeRequest) => Promise<string>;
};

function runtimeUnavailableVerdict(): JudgeVerdict {
  // DEC-0004: missing runtime escalates; it does not allow
  return { label: "escalate", codes: ["runtime_unavailable"] };
}

function qvacEnabled(): boolean {
  return process.env.ALAIA_QVAC === "1";
}

export async function runJudge(prompt: string): Promise<JudgeVerdict> {
  if (!qvacEnabled()) {
    return runtimeUnavailableVerdict();
  }

  try {
    const request = qvacJudgeRequest(prompt);
    const runner = (await import("./qvac-runner.js")) as Partial<QvacRunnerModule>;
    if (typeof runner.runQvacJudge !== "function") {
      return runtimeUnavailableVerdict();
    }
    const text = await runner.runQvacJudge(request);
    return parseJudgeVerdict(text);
  } catch {
    return runtimeUnavailableVerdict();
  }
}
