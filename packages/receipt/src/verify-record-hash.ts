// DEC-0015: agent spend requires a human grant; policy closes non-payment tools

import { createHash } from "node:crypto";
import type { VerifyRecord } from "./verify-types.js";

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

/** SHA-256 hex of JSON.stringify with recursively sorted object keys (arrays keep order). */
export function verifyRecordHash(record: VerifyRecord): string {
  const canonical = sortKeysDeep(record);
  const json = JSON.stringify(canonical);
  return createHash("sha256").update(json).digest("hex");
}
