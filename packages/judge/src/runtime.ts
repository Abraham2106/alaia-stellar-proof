// DEC-0016: local strands-decider ask; no QVAC

import { parseStrandsDeciderJson } from "./strands-parse.js";
import { runStrandsDecider } from "./strands-runner.js";
import { strandsJudgeRequest } from "./strands-request.js";
import type { JudgeVerdict } from "./types.js";

function runtimeUnavailableVerdict(): JudgeVerdict {
  return { label: "escalate", codes: ["runtime_unavailable"] };
}

function strandsEnabled(): boolean {
  return process.env.ALAIA_STRANDS === "1";
}

export async function runJudge(state: string): Promise<JudgeVerdict> {
  if (!strandsEnabled()) {
    return runtimeUnavailableVerdict();
  }

  try {
    const request = strandsJudgeRequest(state);
    const text = await runStrandsDecider(request);
    return parseStrandsDeciderJson(text);
  } catch {
    return runtimeUnavailableVerdict();
  }
}
