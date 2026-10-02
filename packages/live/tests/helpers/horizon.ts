import {
  assertLocalHorizon,
  LOCAL_HORIZON,
  STANDALONE_PASSPHRASE,
} from "@alaia/localnet";
import { localHorizonFetch } from "./transport.js";

type HorizonRoot = {
  _links?: { account?: unknown };
  network_passphrase?: string;
};

/** DEC-0011: standalone passphrase required (Horizon root documents network_passphrase). */
export function assertStandaloneHorizonRoot(body: HorizonRoot): void {
  if (!body._links?.account) {
    return;
  }
  if (body.network_passphrase !== STANDALONE_PASSPHRASE) {
    throw new Error(
      `Horizon network_passphrase must be standalone (${STANDALONE_PASSPHRASE}), got ${body.network_passphrase ?? "missing"}`,
    );
  }
}

/** Quickstart publishes stellar-core on 11626; Horizon is usually 8000 on localhost. */
export async function isHorizonApi(baseUrl: string): Promise<boolean> {
  try {
    assertLocalHorizon(baseUrl);
    const res = await localHorizonFetch(baseUrl, { timeoutMs: 3_000, baseUrl });
    if (!res.ok) {
      return false;
    }
    const body = (await res.json()) as HorizonRoot;
    assertStandaloneHorizonRoot(body);
    return Boolean(body._links?.account);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("network_passphrase must be standalone")
    ) {
      throw err;
    }
    return false;
  }
}

/** DEC-0011: explicit ALAIA_HORIZON only — no silent fallback to other locals. */
export async function resolveLiveHorizon(): Promise<string> {
  const fromEnv = process.env.ALAIA_HORIZON?.trim().replace(/\/+$/, "");
  if (fromEnv) {
    assertLocalHorizon(fromEnv);
    if (await isHorizonApi(fromEnv)) {
      return fromEnv;
    }
    throw new Error(`ALAIA_HORIZON is not a reachable standalone Horizon: ${fromEnv}`);
  }

  const candidates = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    LOCAL_HORIZON,
  ];
  const seen = new Set<string>();
  for (const base of candidates) {
    if (seen.has(base)) {
      continue;
    }
    seen.add(base);
    assertLocalHorizon(base);
    if (await isHorizonApi(base)) {
      return base;
    }
  }
  throw new Error("No reachable local Horizon endpoint");
}

let cachedLiveHorizon: string | undefined;

/** Resolve and probe Horizon only after ALAIA_LIVE opt-in (DEC-0007). */
export async function liveHorizon(): Promise<string> {
  if (cachedLiveHorizon) {
    return cachedLiveHorizon;
  }
  const base = await resolveLiveHorizon();
  if (!(await isHorizonApi(base))) {
    throw new Error("ALAIA_LIVE=1 requires local Horizon");
  }
  cachedLiveHorizon = base;
  return base;
}
