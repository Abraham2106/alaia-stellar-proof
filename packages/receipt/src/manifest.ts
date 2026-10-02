import { createHash } from "node:crypto";

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted = Object.keys(obj).sort();
    const result: Record<string, unknown> = {};
    for (const key of sorted) {
      result[key] = sortKeysDeep(obj[key]);
    }
    return result;
  }
  return value;
}

/** DEC-0010: SHA-256 of recursively key-sorted JSON, excluding manifestHash. */
export function manifestPayloadFromBundle(bundle: Record<string, unknown>): Record<string, unknown> {
  const { manifestHash: _omit, ...rest } = bundle;
  return sortKeysDeep(rest) as Record<string, unknown>;
}

export function manifestHashFromPayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex");
}
