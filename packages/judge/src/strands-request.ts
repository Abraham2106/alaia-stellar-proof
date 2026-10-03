// DEC-0016: local strands-decider ask; no QVAC

import {
  STRANDS_CHECKPOINT,
  STRANDS_JUDGE_QUESTIONS,
  type StrandsJudgeQuestion,
} from "./strands-questions.js";

export type StrandsJudgeRequest = {
  checkpoint: typeof STRANDS_CHECKPOINT;
  state: string;
  questions: StrandsJudgeQuestion[];
};

export function strandsJudgeRequest(state: string): StrandsJudgeRequest {
  return {
    checkpoint: STRANDS_CHECKPOINT,
    state,
    questions: STRANDS_JUDGE_QUESTIONS.map((question) => ({ ...question })),
  };
}

export function buildStrandsAskArgv(request: StrandsJudgeRequest): string[] {
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
