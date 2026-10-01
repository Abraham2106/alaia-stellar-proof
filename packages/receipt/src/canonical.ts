import type { Receipt } from "./types.js";

const STROOPS_PATTERN = /^(0|[1-9]\d*)$/;
const CREDIT_ASSET_PATTERN = /^credit:[^:]+:[^:]+$/;

function assertStroopsField(name: string, value: string): void {
  if (!STROOPS_PATTERN.test(value)) {
    throw new Error(`${name} must be a decimal string without leading zeros`);
  }
}

function assertAsset(asset: string): void {
  if (asset === "native") {
    return;
  }
  if (!CREDIT_ASSET_PATTERN.test(asset)) {
    throw new Error(`asset must be "native" or credit:<code>:<issuer>`);
  }
}

/** Canonical payload with sorted top-level keys and sorted reasons. */
export function canonicalReceiptObject(receipt: Receipt): Record<string, unknown> {
  assertStroopsField("amountStroops", receipt.amountStroops);
  assertStroopsField("feeStroops", receipt.feeStroops);
  assertAsset(receipt.asset);

  const reasons = [...receipt.reasons].sort();

  const canonical: Record<string, unknown> = {
    amountStroops: receipt.amountStroops,
    asset: receipt.asset,
    decision: receipt.decision,
    destination: receipt.destination,
    feeStroops: receipt.feeStroops,
    policyVersion: receipt.policyVersion,
    reasons,
  };
  if (receipt.judge) {
    if (!/^[0-9a-f]{64}$/.test(receipt.judge.requestHash)) throw new Error("judge requestHash must be a SHA-256 hex digest");
    canonical.judge = {
      codes: [...receipt.judge.codes].sort(), label: receipt.judge.label,
      model: receipt.judge.model, requestHash: receipt.judge.requestHash,
    };
  }
  return Object.fromEntries(Object.entries(canonical).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}

export function canonicalReceiptBytes(receipt: Receipt): Uint8Array {
  const canonical = canonicalReceiptObject(receipt);
  const json = JSON.stringify(canonical);
  return new TextEncoder().encode(json);
}
