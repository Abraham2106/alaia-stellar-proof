import { createHash } from "node:crypto";
import { canonicalReceiptBytes } from "./canonical.js";
import type { Receipt } from "./types.js";

export function receiptMemoHash(receipt: Receipt): string {
  const bytes = canonicalReceiptBytes(receipt);
  // DEC-0004: integrity of the receipt, not proof the model ran
  return createHash("sha256").update(bytes).digest("hex");
}
