import { Keypair } from "@stellar/stellar-sdk";
import type { ConsiderInput } from "@alaia/gateway";

const POLICY_VERSION = "budget-v1";

export function isLiveOptIn(): boolean {
  return process.env.ALAIA_LIVE === "1";
}

/** Matches Vitest 2 `it` callback context (`skip` is not on exported `TestContext`). */
export type LiveTestContext = {
  skip(note?: string): void;
};

export function skipUnlessLive(ctx: LiveTestContext): boolean {
  if (!isLiveOptIn()) {
    ctx.skip("Set ALAIA_LIVE=1 for ledger integration");
    return false;
  }
  return true;
}

export function requireLiveQvac(): void {
  if (process.env.ALAIA_QVAC !== "1") {
    throw new Error("ALAIA_LIVE=1 requires local Horizon and ALAIA_QVAC=1");
  }
}

export function normalizeMemoHex(memo: string): string {
  if (/^[0-9a-fA-F]{64}$/.test(memo)) {
    return memo.toLowerCase();
  }
  try {
    const fromBase64 = Buffer.from(memo, "base64");
    if (fromBase64.length === 32) {
      return fromBase64.toString("hex").toLowerCase();
    }
  } catch {
    // fall through
  }
  const hex = memo.startsWith("0x") ? memo.slice(2) : memo;
  return hex.toLowerCase();
}

export function keypairFromFixtureSeed(seedUtf8: string): Keypair {
  const raw = Buffer.alloc(32);
  raw.write(seedUtf8, "utf8");
  return Keypair.fromRawEd25519Seed(raw);
}

export function policyInput(
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
