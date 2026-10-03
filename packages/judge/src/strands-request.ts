// DEC-0016: local strands-decider ask; no QVAC
// DEC-0017: argv passed to decider-ask.py (same shape as strands-decider ask)
// DEC-0018: checkpoint comes from the active System One adapter

import { activeAdapterId, getAdapter } from "./adapters/registry.js";
import type { SystemOneRequest } from "./adapters/types.js";
import { STRANDS_JUDGE_QUESTIONS, type StrandsJudgeQuestion } from "./strands-questions.js";

export type StrandsJudgeRequest = {
  checkpoint: string;
  state: string;
  questions: StrandsJudgeQuestion[];
};

export function strandsJudgeRequest(state: string): StrandsJudgeRequest {
  const adapter = getAdapter(activeAdapterId());
  return {
    checkpoint: adapter.checkpoint,
    state,
    questions: STRANDS_JUDGE_QUESTIONS.map((question) => ({ ...question })),
  };
}

export function buildStrandsAskArgv(request: SystemOneRequest | StrandsJudgeRequest): string[] {
  const argv = ["ask", request.checkpoint, "--state", request.state];
  for (const question of request.questions) {
    if (question.type === "noul") {
      argv.push("--noul", question.text);
    } else if (question.type === "choice") {
      argv.push("--choice", question.text);
    } else {
      argv.push("--score", question.text);
    }
  }
  argv.push("--json");
  return argv;
}
