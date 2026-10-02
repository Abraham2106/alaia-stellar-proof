// Explicit HTTP fixture: these tests do not run or claim to run Qwen.
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runJudge } from "../src/index.js";
let server: Server | undefined;
afterEach(async () => {
  vi.unstubAllEnvs(); vi.unstubAllGlobals();
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server!.close(e => e ? reject(e) : resolve()));
    server = undefined;
  }
});
async function fixture(options: { status?: number; finish?: string; content?: string; hang?: boolean; redirect?: boolean } = {}) {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  server = createServer(async (req, res) => {
    let text = ""; for await (const chunk of req) text += chunk;
    calls.push({ url: req.url!, body: JSON.parse(text) });
    if (options.hang) return;
    if (options.redirect) { res.writeHead(302, { Location: "https://example.com/" }); res.end(); return; }
    res.writeHead(options.status ?? 200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ finish_reason: options.finish ?? "stop", message: { content: options.content ?? '{"label":"allow","codes":["ok"]}' } }] }));
  });
  await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  vi.stubEnv("ALAIA_QVAC", "1");
  vi.stubEnv("ALAIA_QVAC_URL", `http://127.0.0.1:${address.port}/v1`);
  return calls;
}
describe("QVAC transport contract (fixture, not inference)", () => {
  it("sends pinned parameters and a closed schema over loopback", async () => {
    const calls = await fixture();
    expect(await runJudge("payment data")).toEqual({ label: "allow", codes: ["ok"] });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/v1/chat/completions");
    expect(calls[0].body).toMatchObject({ model: "Qwen3-4B", temperature: 0, seed: 42, reasoning_budget: false,
      response_format: { type: "json_schema", json_schema: { strict: true, schema: { additionalProperties: false, required: ["label", "codes"] } } } });
    expect(calls[0].body).not.toHaveProperty("tools");
    expect(calls[0].body.messages).toEqual([expect.objectContaining({ role: "system" }), { role: "user", content: "payment data" }]);
  });
  it.each([503, 404, 401])("escalates HTTP %i without fallback", async status => {
    await fixture({ status });
    expect(await runJudge("payment")).toEqual({ label: "escalate", codes: ["runtime_unavailable"] });
  });
  it("does not follow redirects", async () => {
    const calls = await fixture({ redirect: true });
    expect((await runJudge("payment")).codes).toEqual(["runtime_unavailable"]);
    expect(calls).toHaveLength(1);
  });
  it("rejects truncated responses even when JSON parses", async () => {
    await fixture({ finish: "length" });
    expect((await runJudge("payment")).codes).toEqual(["runtime_unavailable"]);
  });
  it("validates output even if the server ignores its schema", async () => {
    await fixture({ content: '{"label":"allow","codes":[],"override":true}' });
    expect((await runJudge("payment")).codes).toEqual(["schema_invalid"]);
  });
  it("cancels a hung request", async () => {
    await fixture({ hang: true }); vi.stubEnv("ALAIA_QVAC_TIMEOUT_MS", "25");
    expect((await runJudge("payment")).codes).toEqual(["runtime_unavailable"]);
  });
  it.each(["https://example.com/v1", "http://192.168.1.1/v1", "http://user:secret@127.0.0.1/v1", "http://127.0.0.1/other"])("rejects endpoint %s before fetch", async url => {
    vi.stubEnv("ALAIA_QVAC", "1"); vi.stubEnv("ALAIA_QVAC_URL", url);
    const network = vi.fn(); vi.stubGlobal("fetch", network);
    expect((await runJudge("payment")).codes).toEqual(["runtime_unavailable"]);
    expect(network).not.toHaveBeenCalled();
  });
});
