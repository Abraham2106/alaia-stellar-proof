import { createHash } from "node:crypto";
import {
  MAX_BUNDLE_BYTES,
  MAX_METADATA_STRING,
  MAX_REQUEST_BYTES,
  MAX_XDR_BYTES,
} from "./bounds.js";
import type {
  EvidenceBundle,
  EvidenceEnvelope,
  ModelArtifact,
} from "./bundle-types.js";
import {
  assertBoundedMetadata,
  assertHex64,
  assertNonEmptyString,
  assertPositiveDecimal,
  assertStellarG56,
  utf8ByteLength,
} from "./form.js";
import { receiptMemoHash } from "./hash.js";
import { manifestHashFromPayload, manifestPayloadFromBundle } from "./manifest.js";
import { parseReceiptUnknown } from "./parse-receipt.js";
import type { Receipt } from "./types.js";

const CREATE_INPUT_KEYS = [
  "receipt",
  "networkPassphrase",
  "sourcePublic",
  "sequence",
  "judgeRequestJson",
  "envelope",
  "transactionHash",
  "modelArtifact",
] as const;

export function assertPlainObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function assertStrictCreateInputKeys(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (!(CREATE_INPUT_KEYS as readonly string[]).includes(key)) {
      throw new Error(`unknown key in createEvidenceBundle input: ${key}`);
    }
  }
}

function requestPreimageHash(judgeRequestJson: string): string {
  return createHash("sha256").update(judgeRequestJson, "utf8").digest("hex");
}

export function validateJudgeRequestRules(receipt: Receipt, judgeRequestJson?: string): void {
  if (receipt.judge) {
    if (judgeRequestJson === undefined) {
      throw new Error("judgeRequestJson is required when receipt.judge is present");
    }
    if (typeof judgeRequestJson !== "string") {
      throw new Error("judgeRequestJson must be a string");
    }
    if (utf8ByteLength(judgeRequestJson) > MAX_REQUEST_BYTES) {
      throw new Error("judgeRequestJson exceeds maximum size");
    }
    try {
      JSON.parse(judgeRequestJson);
    } catch {
      throw new Error("judgeRequestJson must be valid JSON");
    }
    const expected = requestPreimageHash(judgeRequestJson);
    if (expected !== receipt.judge.requestHash) {
      throw new Error("judge request hash does not match judgeRequestJson");
    }
  } else if (judgeRequestJson !== undefined) {
    throw new Error("judgeRequestJson must be absent when receipt.judge is missing");
  }
}

export function validateEnvelope(envelope: EvidenceEnvelope): EvidenceEnvelope {
  const xdr = envelope.xdr;
  const hash = envelope.hash;
  if (typeof xdr !== "string" || typeof hash !== "string") {
    throw new Error("envelope must contain xdr and hash strings");
  }
  assertNonEmptyString("envelope.xdr", xdr);
  if (utf8ByteLength(xdr) > MAX_XDR_BYTES) {
    throw new Error("envelope.xdr exceeds maximum size");
  }
  assertHex64("envelope.hash", hash);
  return { xdr, hash };
}

export function validateModelArtifact(artifact: ModelArtifact): ModelArtifact {
  const { sha256, source, runtimeVersion } = artifact;
  if (
    typeof sha256 !== "string" ||
    typeof source !== "string" ||
    typeof runtimeVersion !== "string"
  ) {
    throw new Error("modelArtifact must contain sha256, source, and runtimeVersion");
  }
  assertHex64("modelArtifact.sha256", sha256);
  assertNonEmptyString("modelArtifact.source", source);
  assertBoundedMetadata("modelArtifact.source", source, MAX_METADATA_STRING);
  assertNonEmptyString("modelArtifact.runtimeVersion", runtimeVersion);
  assertBoundedMetadata("modelArtifact.runtimeVersion", runtimeVersion, MAX_METADATA_STRING);
  return { sha256, source, runtimeVersion };
}

export function parseEnvelopeUnknown(value: unknown): EvidenceEnvelope {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("envelope must be an object");
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== 2 || !keys.includes("xdr") || !keys.includes("hash")) {
    throw new Error("envelope must contain only xdr and hash");
  }
  return validateEnvelope({ xdr: obj.xdr as string, hash: obj.hash as string });
}

export function parseModelArtifactUnknown(value: unknown): ModelArtifact {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("modelArtifact must be an object");
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  const allowed = ["sha256", "source", "runtimeVersion"];
  for (const key of keys) {
    if (!allowed.includes(key)) {
      throw new Error(`unknown key in modelArtifact: ${key}`);
    }
  }
  return validateModelArtifact({
    sha256: obj.sha256 as string,
    source: obj.source as string,
    runtimeVersion: obj.runtimeVersion as string,
  });
}

export function assertBundleSize(bundle: EvidenceBundle): void {
  const json = JSON.stringify(bundle);
  if (utf8ByteLength(json) > MAX_BUNDLE_BYTES) {
    throw new Error("evidence bundle exceeds maximum size");
  }
}

/** Reject oversized raw bundle JSON before strict parse (DEC-0010). */
export function assertRawBundleWithinBounds(bundle: unknown): void {
  if (typeof bundle === "string") {
    if (utf8ByteLength(bundle) > MAX_BUNDLE_BYTES) {
      throw new Error("evidence bundle exceeds maximum size");
    }
    return;
  }
  const json = JSON.stringify(bundle);
  if (utf8ByteLength(json) > MAX_BUNDLE_BYTES) {
    throw new Error("evidence bundle exceeds maximum size");
  }
}

function bundleManifestHash(record: Record<string, unknown>): string {
  const payload = manifestPayloadFromBundle(record);
  return manifestHashFromPayload(payload);
}

export function parseBundleUnknown(value: unknown): EvidenceBundle {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("bundle must be an object");
  }
  const obj = value as Record<string, unknown>;
  const topKeys = Object.keys(obj);
  const allowedTop = [
    "version",
    "receipt",
    "memoHash",
    "networkPassphrase",
    "sourcePublic",
    "sequence",
    "judgeRequestJson",
    "envelope",
    "transactionHash",
    "modelArtifact",
    "manifestHash",
  ];
  for (const key of topKeys) {
    if (!allowedTop.includes(key)) {
      throw new Error(`unknown key in bundle: ${key}`);
    }
  }

  if (obj.version !== 1) {
    throw new Error("bundle version must be 1");
  }

  const receipt = parseReceiptUnknown(obj.receipt);
  const memoHash = obj.memoHash;
  if (typeof memoHash !== "string") {
    throw new Error("memoHash must be a string");
  }
  assertHex64("memoHash", memoHash);

  const networkPassphrase = obj.networkPassphrase;
  if (typeof networkPassphrase !== "string") {
    throw new Error("networkPassphrase must be a string");
  }
  assertNonEmptyString("networkPassphrase", networkPassphrase);
  assertBoundedMetadata("networkPassphrase", networkPassphrase, MAX_METADATA_STRING);

  const sourcePublic = obj.sourcePublic;
  if (typeof sourcePublic !== "string") {
    throw new Error("sourcePublic must be a string");
  }
  assertStellarG56("sourcePublic", sourcePublic);

  const sequence = obj.sequence;
  if (typeof sequence !== "string") {
    throw new Error("sequence must be a string");
  }
  assertPositiveDecimal("sequence", sequence);
  assertBoundedMetadata("sequence", sequence, MAX_METADATA_STRING);

  let judgeRequestJson: string | undefined;
  if (obj.judgeRequestJson !== undefined) {
    if (typeof obj.judgeRequestJson !== "string") {
      throw new Error("judgeRequestJson must be a string");
    }
    judgeRequestJson = obj.judgeRequestJson;
  }

  let envelope: EvidenceEnvelope | undefined;
  if (obj.envelope !== undefined) {
    envelope = parseEnvelopeUnknown(obj.envelope);
  }

  let transactionHash: string | undefined;
  if (obj.transactionHash !== undefined) {
    if (typeof obj.transactionHash !== "string") {
      throw new Error("transactionHash must be a string");
    }
    const hash = obj.transactionHash as string;
    assertHex64("transactionHash", hash);
    transactionHash = hash;
  }

  let modelArtifact: ModelArtifact | undefined;
  if (obj.modelArtifact !== undefined) {
    modelArtifact = parseModelArtifactUnknown(obj.modelArtifact);
  }

  const manifestHash = obj.manifestHash;
  if (typeof manifestHash !== "string") {
    throw new Error("manifestHash must be a string");
  }
  assertHex64("manifestHash", manifestHash);

  validateJudgeRequestRules(receipt, judgeRequestJson);

  if (memoHash !== receiptMemoHash(receipt)) {
    throw new Error("memoHash does not match receipt");
  }

  const bundle: EvidenceBundle = {
    version: 1,
    receipt,
    memoHash,
    networkPassphrase,
    sourcePublic,
    sequence,
    manifestHash,
    ...(judgeRequestJson !== undefined ? { judgeRequestJson } : {}),
    ...(envelope !== undefined ? { envelope } : {}),
    ...(transactionHash !== undefined ? { transactionHash } : {}),
    ...(modelArtifact !== undefined ? { modelArtifact } : {}),
  };

  const expectedManifest = bundleManifestHash(obj);
  if (manifestHash !== expectedManifest) {
    throw new Error("manifestHash mismatch");
  }

  assertBundleSize(bundle);
  return bundle;
}
