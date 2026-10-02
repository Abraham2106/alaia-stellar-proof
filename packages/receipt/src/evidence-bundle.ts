import {
  MAX_METADATA_STRING,
} from "./bounds.js";
import type {
  CreateEvidenceBundleInput,
  EvidenceBundle,
  EvidenceEnvelope,
  ModelArtifact,
} from "./bundle-types.js";
import {
  assertPlainObject,
  assertRawBundleWithinBounds,
  assertStrictCreateInputKeys,
  assertBundleSize,
  parseBundleUnknown,
  parseEnvelopeUnknown,
  parseModelArtifactUnknown,
  validateJudgeRequestRules,
} from "./bundle-parse.js";
import {
  assertBoundedMetadata,
  assertHex64,
  assertNonEmptyString,
  assertPositiveDecimal,
  assertStellarG56,
} from "./form.js";
import { receiptMemoHash } from "./hash.js";
import { manifestHashFromPayload, manifestPayloadFromBundle } from "./manifest.js";
import { parseReceiptUnknown } from "./parse-receipt.js";
import type { Receipt } from "./types.js";

function validateCreateInput(input: unknown): {
  receipt: Receipt;
  memoHash: string;
  networkPassphrase: string;
  sourcePublic: string;
  sequence: string;
  judgeRequestJson?: string;
  envelope?: EvidenceEnvelope;
  transactionHash?: string;
  modelArtifact?: ModelArtifact;
} {
  const obj = assertPlainObject(input, "createEvidenceBundle input");
  assertStrictCreateInputKeys(obj);

  const receipt = parseReceiptUnknown(obj.receipt);

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

  const memoHash = receiptMemoHash(receipt);

  let judgeRequestJson: string | undefined;
  if (obj.judgeRequestJson !== undefined) {
    if (typeof obj.judgeRequestJson !== "string") {
      throw new Error("judgeRequestJson must be a string");
    }
    judgeRequestJson = obj.judgeRequestJson;
  }
  validateJudgeRequestRules(receipt, judgeRequestJson);

  let envelope: EvidenceEnvelope | undefined;
  if (obj.envelope !== undefined) {
    envelope = parseEnvelopeUnknown(obj.envelope);
  }

  let transactionHash: string | undefined;
  if (obj.transactionHash !== undefined) {
    if (typeof obj.transactionHash !== "string") {
      throw new Error("transactionHash must be a string");
    }
    assertHex64("transactionHash", obj.transactionHash);
    transactionHash = obj.transactionHash;
  }

  let modelArtifact: ModelArtifact | undefined;
  if (obj.modelArtifact !== undefined) {
    modelArtifact = parseModelArtifactUnknown(obj.modelArtifact);
  }

  return {
    receipt,
    memoHash,
    networkPassphrase,
    sourcePublic,
    sequence,
    ...(judgeRequestJson !== undefined ? { judgeRequestJson } : {}),
    ...(envelope !== undefined ? { envelope } : {}),
    ...(transactionHash !== undefined ? { transactionHash } : {}),
    ...(modelArtifact !== undefined ? { modelArtifact } : {}),
  };
}

function bundleBodyWithoutManifest(
  fields: Omit<EvidenceBundle, "manifestHash">,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    version: fields.version,
    receipt: fields.receipt,
    memoHash: fields.memoHash,
    networkPassphrase: fields.networkPassphrase,
    sourcePublic: fields.sourcePublic,
    sequence: fields.sequence,
  };
  if (fields.judgeRequestJson !== undefined) {
    body.judgeRequestJson = fields.judgeRequestJson;
  }
  if (fields.envelope !== undefined) {
    body.envelope = fields.envelope;
  }
  if (fields.transactionHash !== undefined) {
    body.transactionHash = fields.transactionHash;
  }
  if (fields.modelArtifact !== undefined) {
    body.modelArtifact = fields.modelArtifact;
  }
  return body;
}

/** DEC-0010 */
export function createEvidenceBundle(input: CreateEvidenceBundleInput): EvidenceBundle {
  const fields = validateCreateInput(input);
  const body = bundleBodyWithoutManifest({ version: 1, ...fields });
  const manifestHash = manifestHashFromPayload(manifestPayloadFromBundle(body));
  const bundle: EvidenceBundle = { ...fields, version: 1, manifestHash };
  assertBundleSize(bundle);
  return bundle;
}

/** DEC-0010 */
export function evidenceBundleHash(bundle: EvidenceBundle | Record<string, unknown>): string {
  const record =
    bundle !== null && typeof bundle === "object"
      ? (bundle as Record<string, unknown>)
      : (() => {
          throw new Error("bundle must be an object");
        })();
  const payload = manifestPayloadFromBundle(record);
  return manifestHashFromPayload(payload);
}

/** DEC-0010: throws when invalid; manifest alone does not authenticate the bundle. */
export function verifyEvidenceBundle(bundle: unknown): void {
  assertRawBundleWithinBounds(bundle);
  parseBundleUnknown(bundle);
}
