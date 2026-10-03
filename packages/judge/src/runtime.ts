// DEC-0016: local strands-decider ask; no QVAC
// DEC-0017: decider-ask.py for Mapika/decider-0.8b
// DEC-0018: active System One adapter performs ask()

import { activeAdapterId, getAdapter } from "./adapters/registry.js";
import { parseStrandsDeciderJson } from "./strands-parse.js";
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
    const adapter = getAdapter(activeAdapterId());
    const request = strandsJudgeRequest(state);
    const text = await adapter.ask(request);
    return parseStrandsDeciderJson(text);
  } catch {
    return runtimeUnavailableVerdict();
  }
}
