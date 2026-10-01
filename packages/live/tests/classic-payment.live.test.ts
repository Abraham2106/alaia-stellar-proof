import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { consider, type ConsiderInput } from "@alaia/gateway";
import {
  assertLocalHorizon,
  LOCAL_HORIZON,
} from "@alaia/localnet";
import {
  budgetAccountSetOptions,
  signEnvelope,
} from "@alaia/stellar-classic";

const POLICY_VERSION = "budget-v1";
const SKIP_MESSAGE =
  "Local Horizon not reachable at http://127.0.0.1:8000 — start Quickstart (--local) and retry.";

type HorizonAccount = {
  sequence: string;
  thresholds: { low_threshold: number; med_threshold: number; high_threshold: number };
  signers: Array<{ weight: number; key: string; type: string }>;
};

async function horizonResponds(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/`, {
      signal: AbortSignal.timeout(3_000),
    });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function fundViaFriendbot(baseUrl: string, address: string): Promise<void> {
  const primary = new URL(`/friendbot?addr=${encodeURIComponent(address)}`, baseUrl);
  let res = await fetch(primary, { signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) {
    const root = await fetch(baseUrl, { signal: AbortSignal.timeout(10_000) });
    const link = root.headers.get("link") ?? "";
    const match = link.match(/<([^>]*friendbot[^>]*)>/i);
    if (match?.[1]) {
      const alt = new URL(match[1]);
      alt.searchParams.set("addr", address);
      res = await fetch(alt, { signal: AbortSignal.timeout(30_000) });
    }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `friendbot failed (${res.status}) for ${address}: ${body.slice(0, 200)}`,
    );
  }
}

async function loadAccount(
  baseUrl: string,
  accountId: string,
): Promise<HorizonAccount> {
  const res = await fetch(
    `${baseUrl}/accounts/${encodeURIComponent(accountId)}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`load account failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return (await res.json()) as HorizonAccount;
}

async function submitTransaction(
  baseUrl: string,
  xdr: string,
): Promise<{ hash: string }> {
  const body = new URLSearchParams({ tx: xdr });
  const res = await fetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
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

async function fetchTransaction(
  baseUrl: string,
  hash: string,
): Promise<{ memo_type: string; memo: string }> {
  const res = await fetch(
    `${baseUrl}/transactions/${encodeURIComponent(hash)}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) {
    throw new Error(`fetch transaction failed (${res.status})`);
  }
  return (await res.json()) as { memo_type: string; memo: string };
}

function normalizeMemoHex(memo: string): string {
  const hex = memo.startsWith("0x") ? memo.slice(2) : memo;
  return hex.toLowerCase();
}

function policyInput(
  sourcePublic: string,
  sequence: string,
  allowedDest: string,
  overrides: Partial<ConsiderInput> = {},
): ConsiderInput {
  return {
    policyVersion: POLICY_VERSION,
    policy: {
      maxAmountStroops: 10_000_000n,
      allowedDestinations: [allowedDest],
      allowedAssets: [{ kind: "native" }],
      maxFeeStroops: 100_000n,
    },
    sourcePublic,
    sequence,
    destination: allowedDest,
    asset: { kind: "native" },
    amount: 5_000_000n,
    feeStroops: 10_000n,
    operations: ["payment"],
    ...overrides,
  };
}

const horizonUp = await horizonResponds(LOCAL_HORIZON);

describe("local Classic payment slice (Quickstart standalone)", () => {
  it("funds budget account, submits allowed payment, and denies without submit", async (ctx) => {
    if (!horizonUp) {
      ctx.skip(true, SKIP_MESSAGE);
      return;
    }

    assertLocalHorizon(LOCAL_HORIZON);

    const budget = Keypair.random();
    const signerA = Keypair.random();
    const signerB = Keypair.random();
    const recovery = Keypair.random();
    const allowedDest = Keypair.random().publicKey();
    const deniedDest = Keypair.random().publicKey();

    await fundViaFriendbot(LOCAL_HORIZON, budget.publicKey());
    let acct = await loadAccount(LOCAL_HORIZON, budget.publicKey());

    const { buildBudgetAccountEnvelope } = budgetAccountSetOptions();
    const setup = buildBudgetAccountEnvelope({
      sourcePublic: budget.publicKey(),
      sequence: acct.sequence,
      signerA: signerA.publicKey(),
      signerB: signerB.publicKey(),
      recoverySigner: recovery.publicKey(),
      feeStroops: 300,
    });
    const setupSigned = signEnvelope(setup.xdr, budget.secret());
    await submitTransaction(LOCAL_HORIZON, setupSigned);

    acct = await loadAccount(LOCAL_HORIZON, budget.publicKey());
    expect(acct.thresholds.med_threshold).toBe(2);
    const masterSigner = acct.signers.find((s) => s.key === budget.publicKey());
    expect(masterSigner?.weight).toBe(0);

    await fundViaFriendbot(LOCAL_HORIZON, budget.publicKey());
    acct = await loadAccount(LOCAL_HORIZON, budget.publicKey());

    const allow = consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest),
    );
    expect(allow.decision).toBe("allow");
    expect(allow.envelope).not.toBeNull();

    let signed = signEnvelope(allow.envelope!.xdr, signerA.secret());
    signed = signEnvelope(signed, signerB.secret());
    const { hash: paymentHash } = await submitTransaction(LOCAL_HORIZON, signed);

    const onChain = await fetchTransaction(LOCAL_HORIZON, paymentHash);
    expect(onChain.memo_type).toBe("hash");
    expect(normalizeMemoHex(onChain.memo)).toBe(allow.memoHash);

    const denySetOptions = consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest, {
        operations: ["payment", "setOptions"],
      }),
    );
    expect(denySetOptions.decision).toBe("deny");
    expect(denySetOptions.envelope).toBeNull();
    expect(denySetOptions.reasons).toContain("admin_operation");

    const denyOverCap = consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest, {
        amount: 10_000_001n,
      }),
    );
    expect(denyOverCap.decision).toBe("deny");
    expect(denyOverCap.envelope).toBeNull();
    expect(denyOverCap.reasons).toContain("over_cap");

    const denyDest = consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest, {
        destination: deniedDest,
      }),
    );
    expect(denyDest.decision).toBe("deny");
    expect(denyDest.envelope).toBeNull();
    expect(denyDest.reasons).toContain("destination_denied");
  });
});
