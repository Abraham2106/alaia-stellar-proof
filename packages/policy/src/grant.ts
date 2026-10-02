import { createHash } from "node:crypto";

/** Human-issued spend receipt bound to destination, asset, and cap. */
export type Grant = {
  walletClass: "human";
  destination: string;
  asset: "native" | `credit:${string}:${string}`;
  maxAmountStroops: string;
  policyVersion: string;
};

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeysDeep(obj[key]);
    }
    return sorted;
  }
  return value;
}

/** SHA-256 hex (lowercase) of canonically key-sorted JSON. DEC-0015 */
export function grantHash(grant: Grant): string {
  const canonical = JSON.stringify(sortKeysDeep(grant));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
