import { assertLocalHorizon } from "@alaia/localnet";

const DEFAULT_TIMEOUT_MS = 15_000;

/** DEC-0011: caller signal cannot remove the bounded deadline. */
function signalWithTimeout(timeoutMs: number, signal?: AbortSignal | null): AbortSignal {
  const deadline = AbortSignal.timeout(timeoutMs);
  if (!signal) {
    return deadline;
  }
  return AbortSignal.any([signal, deadline]);
}

function resolveHorizonUrl(url: string | URL, baseUrl?: string): URL {
  if (url instanceof URL) {
    return url;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return new URL(url);
  }
  if (!baseUrl) {
    throw new Error(`Relative horizon URL requires a base: ${url}`);
  }
  return new URL(url, baseUrl);
}

/** DEC-0011: loopback-only fetch with redirect:error and bounded wait */
export async function localHorizonFetch(
  url: string | URL,
  init: RequestInit & { timeoutMs?: number; baseUrl?: string } = {},
): Promise<Response> {
  const resolved = resolveHorizonUrl(url, init.baseUrl);
  assertLocalHorizon(resolved.href);
  const { timeoutMs = DEFAULT_TIMEOUT_MS, baseUrl: _base, ...fetchInit } = init;
  return fetch(resolved.href, {
    ...fetchInit,
    redirect: "error",
    signal: signalWithTimeout(timeoutMs, fetchInit.signal),
  });
}

export type HorizonAccount = {
  sequence: string;
  thresholds: { low_threshold: number; med_threshold: number; high_threshold: number };
  signers: Array<{ weight: number; key: string; type: string }>;
};

export async function fundViaFriendbot(baseUrl: string, address: string): Promise<void> {
  assertLocalHorizon(baseUrl);
  const primary = new URL(`/friendbot?addr=${encodeURIComponent(address)}`, baseUrl);
  let res = await localHorizonFetch(primary, { timeoutMs: 30_000, baseUrl });
  if (res.status === 404) {
    const root = await localHorizonFetch(baseUrl, { timeoutMs: 10_000, baseUrl });
    const link = root.headers.get("link") ?? "";
    const match = link.match(/<([^>]*friendbot[^>]*)>/i);
    if (match?.[1]) {
      const alt = new URL(match[1], baseUrl);
      assertLocalHorizon(alt.href);
      alt.searchParams.set("addr", address);
      res = await localHorizonFetch(alt, { timeoutMs: 30_000, baseUrl });
    }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 400 && body.includes("already funded")) {
      return;
    }
    throw new Error(
      `friendbot failed (${res.status}) for ${address}: ${body.slice(0, 200)}`,
    );
  }
}

export async function loadAccount(
  baseUrl: string,
  accountId: string,
): Promise<HorizonAccount> {
  const res = await localHorizonFetch(
    `${baseUrl}/accounts/${encodeURIComponent(accountId)}`,
    { baseUrl },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`load account failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return (await res.json()) as HorizonAccount;
}

export async function submitTransaction(
  baseUrl: string,
  xdr: string,
): Promise<{ hash: string }> {
  const body = new URLSearchParams({ tx: xdr });
  const res = await localHorizonFetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    timeoutMs: 30_000,
    baseUrl,
  });
  const json = (await res.json()) as {
    hash?: string;
    title?: string;
    detail?: string;
    extras?: { result_codes?: unknown };
  };
  if (!res.ok) {
    throw new Error(
      `submit failed (${res.status}): ${json.title ?? ""} ${json.detail ?? ""} ${JSON.stringify(json.extras ?? {})}`,
    );
  }
  if (!json.hash) {
    throw new Error("submit response missing hash");
  }
  return { hash: json.hash };
}

export type HorizonSubmitResult = {
  httpStatus: number;
  hash?: string;
  title?: string;
  detail?: string;
  resultCodes?: unknown;
};

export async function submitTransactionRaw(
  baseUrl: string,
  xdr: string,
): Promise<HorizonSubmitResult> {
  const body = new URLSearchParams({ tx: xdr });
  const res = await localHorizonFetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    timeoutMs: 30_000,
    baseUrl,
  });
  const json = (await res.json()) as {
    hash?: string;
    title?: string;
    detail?: string;
    extras?: { result_codes?: unknown };
  };
  return {
    httpStatus: res.status,
    hash: json.hash,
    title: json.title,
    detail: json.detail,
    resultCodes: json.extras?.result_codes,
  };
}

export async function countOutgoingPayments(
  baseUrl: string,
  sourceId: string,
): Promise<number> {
  const res = await localHorizonFetch(
    `${baseUrl}/accounts/${encodeURIComponent(sourceId)}/payments?limit=200`,
    { baseUrl },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`payments list failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    _embedded?: {
      records?: Array<{ from: string; transaction_successful?: boolean }>;
    };
  };
  const records = json._embedded?.records ?? [];
  return records.filter(
    (row) => row.from === sourceId && row.transaction_successful !== false,
  ).length;
}

export async function fetchTransaction(
  baseUrl: string,
  hash: string,
): Promise<{ memo_type: string; memo: string }> {
  const res = await localHorizonFetch(
    `${baseUrl}/transactions/${encodeURIComponent(hash)}`,
    { baseUrl },
  );
  if (!res.ok) {
    throw new Error(`fetch transaction failed (${res.status})`);
  }
  return (await res.json()) as { memo_type: string; memo: string };
}

/** DEC-0016: live graph control without strands-decider restores env even when fn throws */
export async function withStrandsDisabled<T>(fn: () => Promise<T> | T): Promise<T> {
  const previous = process.env.ALAIA_STRANDS;
  process.env.ALAIA_STRANDS = "0";
  try {
    return await fn();
  } finally {
    if (previous === undefined) {
      delete process.env.ALAIA_STRANDS;
    } else {
      process.env.ALAIA_STRANDS = previous;
    }
  }
}
