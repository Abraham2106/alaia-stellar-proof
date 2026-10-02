import type { QvacJudgeRequest } from "./qvac.js";

// DEC-0004: only a local QVAC server, never a cloud fallback.
function completionUrl(): URL {
  const url = new URL(process.env.ALAIA_QVAC_URL ?? "http://127.0.0.1:11434/v1");
  if (url.protocol !== "http:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash ||
      !/^\/v1\/?$/.test(url.pathname)) {
    throw new Error("QVAC must use a loopback HTTP /v1 endpoint");
  }
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  url.pathname = "/v1/chat/completions";
  return url;
}

function timeoutMs(): number {
  const value = Number(process.env.ALAIA_QVAC_TIMEOUT_MS ?? "30000");
  if (!Number.isInteger(value) || value < 1 || value > 120_000) throw new Error("invalid QVAC timeout");
  return value;
}

/** Real transport to `qvac serve --openai`; no signing or Horizon access. */
export async function runQvacJudge(request: QvacJudgeRequest): Promise<string> {
  const url = completionUrl();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ALAIA_QVAC_API_KEY) headers.Authorization = `Bearer ${process.env.ALAIA_QVAC_API_KEY}`;
  const response = await fetch(url, {
    method: "POST", headers, redirect: "error",
    signal: AbortSignal.timeout(timeoutMs()),
    body: JSON.stringify({
      model: request.model,
      messages: [{ role: "system", content: request.systemPrompt }, { role: "user", content: request.prompt }],
      temperature: request.temperature, seed: request.seed,
      max_tokens: request.maxTokens, stream: false, reasoning_budget: request.reasoningBudget,
      response_format: { type: request.responseFormat, json_schema: { name: "alaia_judge", strict: true, schema: request.schema } },
    }),
  });
  if (!response.ok) throw new Error("QVAC inference unavailable");
  const body = await response.json() as {
    choices?: Array<{ finish_reason?: string; message?: { content?: unknown } }>;
  };
  const choice = body.choices?.[0];
  const content = choice?.message?.content;
  // Truncation is not approval, even when the partial JSON parses.
  if (choice?.finish_reason !== "stop" || typeof content !== "string" || content.length > 4096) {
    throw new Error("incomplete QVAC response");
  }
  return content;
}
