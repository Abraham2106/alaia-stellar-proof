import { MAX_METADATA_STRING } from "./bounds.js";
import {
  assertBoundedMetadata,
  assertHex64,
  assertNonEmptyString,
  assertStroopsField,
} from "./form.js";
import type { Receipt, ReceiptAsset, ReceiptDecision } from "./types.js";

const CREDIT_ASSET_PATTERN = /^credit:[^:]+:[^:]+$/;
const RECEIPT_DECISIONS = new Set<ReceiptDecision>(["allow", "deny", "escalate"]);
const JUDGE_LABELS = new Set(["allow", "deny", "escalate"]);
// DEC-0016: local strands-decider ask; no QVAC
// DEC-0017: decider-0.8b for new receipts; parse historical 2B and Qwen3-4B
const JUDGE_MODELS = new Set<NonNullable<Receipt["judge"]>["model"]>([
  "decider-0.8b",
  "strands-decider-2B-hobson-v19",
  "Qwen3-4B",
]);

function assertPlainObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
  return value;
}

function assertMetadataString(value: unknown, label: string): string {
  const text = assertString(value, label);
  assertNonEmptyString(label, text);
  assertBoundedMetadata(label, text, MAX_METADATA_STRING);
  return text;
}

function assertStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value.map((item, index) => assertMetadataString(item, `${label}[${index}]`));
}

function parseAsset(value: unknown): ReceiptAsset {
  const asset = assertString(value, "receipt.asset");
  if (asset === "native") {
    return "native";
  }
  if (!CREDIT_ASSET_PATTERN.test(asset)) {
    throw new Error(`receipt.asset must be "native" or credit:<code>:<issuer>`);
  }
  return asset as ReceiptAsset;
}

function parseJudge(value: unknown): Receipt["judge"] {
  const judge = assertPlainObject(value, "receipt.judge");
  const keys = Object.keys(judge);
  const allowed = ["model", "requestHash", "label", "codes"];
  for (const key of keys) {
    if (!allowed.includes(key)) {
      throw new Error(`unknown key in receipt.judge: ${key}`);
    }
  }
  const model = assertMetadataString(judge.model, "receipt.judge.model");
  if (!JUDGE_MODELS.has(model as NonNullable<Receipt["judge"]>["model"])) {
    throw new Error(
      "receipt.judge.model must be decider-0.8b, strands-decider-2B-hobson-v19, or Qwen3-4B",
    );
  }
  const requestHash = assertString(judge.requestHash, "receipt.judge.requestHash");
  assertHex64("receipt.judge.requestHash", requestHash);
  const label = assertString(judge.label, "receipt.judge.label");
  if (!JUDGE_LABELS.has(label)) {
    throw new Error("receipt.judge.label must be allow, deny, or escalate");
  }
  const codes = assertStringArray(judge.codes, "receipt.judge.codes");
  return {
    model: model as NonNullable<Receipt["judge"]>["model"],
    requestHash,
    label: label as "allow" | "deny" | "escalate",
    codes,
  };
}

/** Strict receipt parse from untyped JSON (DEC-0010). */
export function parseReceiptUnknown(value: unknown): Receipt {
  const obj = assertPlainObject(value, "receipt");
  const keys = Object.keys(obj);
  const allowed = [
    "policyVersion",
    "destination",
    "asset",
    "amountStroops",
    "feeStroops",
    "decision",
    "reasons",
    "judge",
  ];
  for (const key of keys) {
    if (!allowed.includes(key)) {
      throw new Error(`unknown key in receipt: ${key}`);
    }
  }

  const policyVersion = assertMetadataString(obj.policyVersion, "receipt.policyVersion");
  const destination = assertMetadataString(obj.destination, "receipt.destination");
  const asset = parseAsset(obj.asset);
  const amountStroops = assertString(obj.amountStroops, "receipt.amountStroops");
  const feeStroops = assertString(obj.feeStroops, "receipt.feeStroops");
  assertStroopsField("receipt.amountStroops", amountStroops);
  assertStroopsField("receipt.feeStroops", feeStroops);

  const decision = assertString(obj.decision, "receipt.decision");
  if (!RECEIPT_DECISIONS.has(decision as ReceiptDecision)) {
    throw new Error("receipt.decision must be allow, deny, or escalate");
  }
  const reasons = assertStringArray(obj.reasons, "receipt.reasons");

  const receipt: Receipt = {
    policyVersion,
    destination,
    asset,
    amountStroops,
    feeStroops,
    decision: decision as ReceiptDecision,
    reasons,
  };
  if (obj.judge !== undefined) {
    receipt.judge = parseJudge(obj.judge);
  }
  return receipt;
}
