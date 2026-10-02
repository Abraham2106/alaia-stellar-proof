// DEC-0015: agent spend requires a human grant; policy closes non-payment tools

import { assertHex64, assertNonEmptyString } from "./form.js";
import type { VerifyDecision, VerifyRecord, VerifyWalletClass } from "./verify-types.js";

const VERIFY_STANDARD = "alaia-verify-1";
const WALLET_CLASSES = new Set<VerifyWalletClass>(["human", "agent"]);
const VERIFY_DECISIONS = new Set<VerifyDecision>(["allow", "deny", "escalate"]);
const MAX_NEIGHBOR_IDS = 8;
const MAX_NEIGHBOR_ID_LENGTH = 64;

const ALLOWED_KEYS = [
  "standard",
  "walletClass",
  "decision",
  "artifactSha256",
  "corpusSha256",
  "neighborIds",
  "grantHash",
] as const;

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

function parseNeighborIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("verifyRecord.neighborIds must be an array");
  }
  if (value.length > MAX_NEIGHBOR_IDS) {
    throw new Error(`verifyRecord.neighborIds must have at most ${MAX_NEIGHBOR_IDS} entries`);
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const id = assertString(value[index], `verifyRecord.neighborIds[${index}]`);
    assertNonEmptyString(`verifyRecord.neighborIds[${index}]`, id);
    if (id.length > MAX_NEIGHBOR_ID_LENGTH) {
      throw new Error(`verifyRecord.neighborIds[${index}] exceeds maximum length`);
    }
    if (seen.has(id)) {
      throw new Error("verifyRecord.neighborIds must not contain duplicates");
    }
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function grantHashRequired(walletClass: VerifyWalletClass, decision: VerifyDecision): boolean {
  return walletClass === "agent" && decision === "allow";
}

/** Strict parse of an ALAIA Verify 1 record from untyped JSON. */
export function parseVerifyRecord(value: unknown): VerifyRecord {
  const obj = assertPlainObject(value, "verifyRecord");
  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_KEYS as readonly string[]).includes(key)) {
      throw new Error(`unknown key in verifyRecord: ${key}`);
    }
  }

  const standard = assertString(obj.standard, "verifyRecord.standard");
  if (standard !== VERIFY_STANDARD) {
    throw new Error(`verifyRecord.standard must be "${VERIFY_STANDARD}"`);
  }

  const walletClass = assertString(obj.walletClass, "verifyRecord.walletClass");
  if (!WALLET_CLASSES.has(walletClass as VerifyWalletClass)) {
    throw new Error("verifyRecord.walletClass must be human or agent");
  }
  const wallet = walletClass as VerifyWalletClass;

  const decision = assertString(obj.decision, "verifyRecord.decision");
  if (!VERIFY_DECISIONS.has(decision as VerifyDecision)) {
    throw new Error("verifyRecord.decision must be allow, deny, or escalate");
  }
  const resolvedDecision = decision as VerifyDecision;

  const artifactSha256 = assertString(obj.artifactSha256, "verifyRecord.artifactSha256");
  assertHex64("verifyRecord.artifactSha256", artifactSha256);
  const corpusSha256 = assertString(obj.corpusSha256, "verifyRecord.corpusSha256");
  assertHex64("verifyRecord.corpusSha256", corpusSha256);

  const neighborIds = parseNeighborIds(obj.neighborIds);

  const needsGrant = grantHashRequired(wallet, resolvedDecision);
  const hasGrantKey = Object.prototype.hasOwnProperty.call(obj, "grantHash");

  if (needsGrant) {
    if (!hasGrantKey || obj.grantHash === undefined) {
      throw new Error("verifyRecord.grantHash is required when walletClass is agent and decision is allow");
    }
    const grantHash = assertString(obj.grantHash, "verifyRecord.grantHash");
    assertHex64("verifyRecord.grantHash", grantHash);
    return {
      standard: VERIFY_STANDARD,
      walletClass: wallet,
      decision: resolvedDecision,
      artifactSha256,
      corpusSha256,
      neighborIds,
      grantHash,
    };
  }

  if (hasGrantKey) {
    throw new Error("verifyRecord.grantHash must be omitted unless walletClass is agent and decision is allow");
  }

  return {
    standard: VERIFY_STANDARD,
    walletClass: wallet,
    decision: resolvedDecision,
    artifactSha256,
    corpusSha256,
    neighborIds,
  };
}
