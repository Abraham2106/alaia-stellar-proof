export type QvacJudgeRequest = {
  model: "Qwen3-4B";
  responseFormat: "json_schema";
  temperature: 0;
  seed: 42;
  prompt: string;
};

// The runtime adapter is not called in tests.
export function qvacJudgeRequest(prompt: string): QvacJudgeRequest {
  return {
    model: "Qwen3-4B",
    responseFormat: "json_schema",
    temperature: 0,
    seed: 42,
    prompt,
  };
}
