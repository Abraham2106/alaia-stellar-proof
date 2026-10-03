// Explicit HTTP fixture: loopback transport boundaries only (DEC-0007, DEC-0011).
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDALONE_PASSPHRASE } from "@alaia/localnet";
import { assertStandaloneHorizonRoot, isHorizonApi } from "./helpers/horizon.js";
import { fundViaFriendbot, localHorizonFetch, withStrandsDisabled } from "./helpers/transport.js";
import { requireLiveStrands, skipUnlessLive } from "./helpers/context.js";

let server: Server | undefined;

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server!.close((e) => (e ? reject(e) : resolve())),
    );
    server = undefined;
  }
});

async function loopbackFixture(
  handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void,
): Promise<{ baseUrl: string; requests: string[] }> {
  const requests: string[] = [];
  server = createServer((req, res) => {
    requests.push(req.url ?? "");
    handler(req, res);
  });
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  return { baseUrl: `http://127.0.0.1:${address.port}`, requests };
}

describe("Horizon transport boundary (fixture, not Qwen/Horizon integration)", () => {
  it("rejects non-loopback URLs before fetch", async () => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    await expect(localHorizonFetch("https://horizon.stellar.org/")).rejects.toThrow(
      /Horizon must use http/,
    );
    expect(network).not.toHaveBeenCalled();
  });

  it("does not follow redirects on loopback", async () => {
    const { baseUrl } = await loopbackFixture((_req, res) => {
      res.writeHead(302, { Location: "https://example.com/friendbot" });
      res.end();
    });
    await expect(localHorizonFetch(baseUrl, { baseUrl })).rejects.toThrow();
  });

  it("resolves relative friendbot links only against a validated local base", async () => {
    const { baseUrl, requests } = await loopbackFixture((req, res) => {
      if (req.url === "/") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          Link: '</v1/friendbot>; rel="friendbot"',
        });
        res.end(JSON.stringify({ _links: { account: {} } }));
        return;
      }
      if (req.url?.startsWith("/v1/friendbot")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end("{}");
        return;
      }
      if (req.url?.startsWith("/friendbot")) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    });

    const addr = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    await fundViaFriendbot(baseUrl, addr);
    expect(requests.every((u) => u.startsWith("/"))).toBe(true);
    expect(requests).toContainEqual(`/v1/friendbot?addr=${encodeURIComponent(addr)}`);
  });

  it("rejects friendbot discovered on a public host before a second friendbot fetch", async () => {
    const { baseUrl, requests } = await loopbackFixture((req, res) => {
      if (req.url?.startsWith("/friendbot")) {
        res.writeHead(404);
        res.end();
        return;
      }
      if (req.url === "/") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          Link: '<https://horizon.stellar.org/friendbot>; rel="friendbot"',
        });
        res.end(JSON.stringify({ _links: { account: {} } }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await expect(
      fundViaFriendbot(baseUrl, "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"),
    ).rejects.toThrow(/Horizon must use http/);
    expect(requests.filter((u) => u.includes("friendbot"))).toHaveLength(1);
  });

  it("probe rejects wrong network_passphrase before fund/submit paths", async () => {
    const { baseUrl } = await loopbackFixture((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          _links: { account: {} },
          network_passphrase: "Test SDF Network ; September 2015",
        }),
      );
    });

    await expect(isHorizonApi(baseUrl)).rejects.toThrow(/network_passphrase must be standalone/);
  });

  it("assertStandaloneHorizonRoot accepts Quickstart standalone passphrase", () => {
    expect(() =>
      assertStandaloneHorizonRoot({
        _links: { account: {} },
        network_passphrase: STANDALONE_PASSPHRASE,
      }),
    ).not.toThrow();
  });

  it("localHorizonFetch keeps bounded timeout when caller supplies a non-aborting signal", async () => {
    const { baseUrl } = await loopbackFixture((_req, _res) => {
      // never respond
    });
    const neverAbort = new AbortController().signal;
    await expect(
      localHorizonFetch(baseUrl, { baseUrl, timeoutMs: 50, signal: neverAbort }),
    ).rejects.toThrow();
  });

  it("live ledger suites import without fetch when ALAIA_LIVE is unset", async () => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    delete process.env.ALAIA_LIVE;
    await import("./payment.live.test.js");
    await import("./graph.live.test.js");
    expect(network).not.toHaveBeenCalled();
  });

  it("resolveLiveHorizon does not probe other locals when ALAIA_HORIZON is set", async () => {
    const network = vi.fn(async () =>
      new Response(JSON.stringify({ _links: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", network);
    vi.stubEnv("ALAIA_HORIZON", "http://127.0.0.1:9");
    vi.resetModules();
    const { resolveLiveHorizon } = await import("./helpers/horizon.js");
    await expect(resolveLiveHorizon()).rejects.toThrow(/not a reachable standalone Horizon/);
    expect(network.mock.calls.length).toBeGreaterThan(0);
    const urls = (network.mock.calls as unknown as Array<[string]>).map(([url]) => url);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url.includes("127.0.0.1:9"))).toBe(true);
  });

  it("requireLiveStrands rejects ALAIA_STRANDS=0 without a live model", () => {
    vi.stubEnv("ALAIA_STRANDS", "0");
    delete process.env.ALAIA_LIVE;
    expect(() => requireLiveStrands()).toThrow(/ALAIA_STRANDS=1/);
  });

  it("skipUnlessLive does not touch fetch without ALAIA_LIVE", async () => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    vi.stubEnv("ALAIA_LIVE", "");
    delete process.env.ALAIA_LIVE;
    const skipped = skipUnlessLive({ skip: () => {} });
    expect(skipped).toBe(false);
    expect(network).not.toHaveBeenCalled();
  });

  it("ALAIA_LIVE opt-in with unreachable ALAIA_HORIZON fails instead of skipping", async () => {
    vi.stubEnv("ALAIA_LIVE", "1");
    vi.stubEnv("ALAIA_HORIZON", "http://127.0.0.1:1");
    const { resolveLiveHorizon } = await import("./helpers/horizon.js");
    await expect(resolveLiveHorizon()).rejects.toThrow(/not a reachable standalone Horizon/);
  });

  it("withStrandsDisabled restores stubbed ALAIA_STRANDS when callback throws", async () => {
    vi.stubEnv("ALAIA_STRANDS", "1");
    await expect(
      withStrandsDisabled(async () => {
        expect(process.env.ALAIA_STRANDS).toBe("0");
        throw new Error("callback fail");
      }),
    ).rejects.toThrow("callback fail");
    expect(process.env.ALAIA_STRANDS).toBe("1");
  });

  it("withStrandsDisabled restores ALAIA_STRANDS after callback failure", async () => {
    process.env.ALAIA_STRANDS = "1";
    await expect(
      withStrandsDisabled(async () => {
        expect(process.env.ALAIA_STRANDS).toBe("0");
        throw new Error("callback fail");
      }),
    ).rejects.toThrow("callback fail");
    expect(process.env.ALAIA_STRANDS).toBe("1");
  });

  it("withStrandsDisabled deletes ALAIA_STRANDS when previously unset", async () => {
    delete process.env.ALAIA_STRANDS;
    await withStrandsDisabled(async () => {
      expect(process.env.ALAIA_STRANDS).toBe("0");
    });
    expect(process.env.ALAIA_STRANDS).toBeUndefined();
  });
});
