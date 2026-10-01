import { parseJudgeVerdict } from "./parse.js";
import { qvacJudgeRequest } from "./qvac.js";
import { runQvacJudge } from "./qvac-runner.js";
import type { JudgeVerdict } from "./types.js";

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
    const text = await runQvacJudge(request);
    return parseJudgeVerdict(text);
  } catch {
    return runtimeUnavailableVerdict();
  }
}
