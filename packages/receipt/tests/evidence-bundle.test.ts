import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createEvidenceBundle,
  evidenceBundleHash,
  receiptMemoHash,
  verifyEvidenceBundle,
  type CreateEvidenceBundleInput,
  type Receipt,
} from "../src/index.ts";

const G_DEST = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const G_SOURCE = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const PASSPHRASE = "Standalone Network ; February 2017";

function sampleReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    policyVersion: "1",
    destination: G_DEST,
    asset: "native",
    amountStroops: "10000000",
    feeStroops: "100",
    decision: "allow",
    reasons: ["within_budget"],
    ...overrides,
  };
}

function baseInput(overrides: Partial<CreateEvidenceBundleInput> = {}): CreateEvidenceBundleInput {
  const receipt = sampleReceipt();
  return {
    receipt,
    networkPassphrase: PASSPHRASE,
    sourcePublic: G_SOURCE,
    sequence: "42",
    ...overrides,
  };
}

describe("createEvidenceBundle / verifyEvidenceBundle", () => {
  it("roundtrips through JSON parse and verify", () => {
    const bundle = createEvidenceBundle(baseInput());
    const json = JSON.stringify(bundle);
    const parsed = JSON.parse(json) as unknown;
    verifyEvidenceBundle(parsed);
    expect(evidenceBundleHash(parsed as typeof bundle)).toBe(bundle.manifestHash);
  });

  it("roundtrips with receipt reasons and judge codes out of canonical sort order", () => {
    const request = JSON.stringify({ model: "Qwen3-4B", prompt: "x" });
    const requestHash = createHash("sha256").update(request, "utf8").digest("hex");
    const receipt = sampleReceipt({
      reasons: ["z", "a"],
      judge: {
        model: "Qwen3-4B",
        requestHash,
        label: "allow",
        codes: ["untrusted_instruction", "intent_ambiguous"],
      },
    });
    const bundle = createEvidenceBundle(
      baseInput({ receipt, judgeRequestJson: request }),
    );
    expect(bundle.receipt.reasons).toEqual(["z", "a"]);
    expect(bundle.receipt.judge?.codes).toEqual([
      "untrusted_instruction",
      "intent_ambiguous",
    ]);
    const parsed = JSON.parse(JSON.stringify(bundle)) as unknown;
    verifyEvidenceBundle(parsed);
    expect(evidenceBundleHash(parsed as typeof bundle)).toBe(bundle.manifestHash);
  });

  it("manifest is stable when only object key order differs (DEC-0010)", () => {
    const bundle = createEvidenceBundle(baseInput());
    const reordered = {
      sequence: bundle.sequence,
      sourcePublic: bundle.sourcePublic,
      networkPassphrase: bundle.networkPassphrase,
      memoHash: bundle.memoHash,
      receipt: bundle.receipt,
      version: bundle.version,
      manifestHash: bundle.manifestHash,
    };
    expect(evidenceBundleHash(reordered)).toBe(bundle.manifestHash);
    verifyEvidenceBundle(reordered);
  });

  it("manifest changes when receipt array order changes even if memoHash is unchanged", () => {
    const reasonsA = sampleReceipt({ reasons: ["a", "z"] });
    const reasonsZ = sampleReceipt({ reasons: ["z", "a"] });
    expect(receiptMemoHash(reasonsA)).toBe(receiptMemoHash(reasonsZ));
    const bundleA = createEvidenceBundle(baseInput({ receipt: reasonsA }));
    const bundleZ = createEvidenceBundle(baseInput({ receipt: reasonsZ }));
    expect(bundleA.memoHash).toBe(bundleZ.memoHash);
    expect(bundleA.manifestHash).not.toBe(bundleZ.manifestHash);
    expect(evidenceBundleHash(bundleA)).toBe(bundleA.manifestHash);
    expect(evidenceBundleHash(bundleZ)).toBe(bundleZ.manifestHash);
  });

  it("includes optional envelope and modelArtifact metadata", () => {
    const bundle = createEvidenceBundle(
      baseInput({
        envelope: { xdr: "AAAAAgAAAAB", hash: "c".repeat(64) },
        transactionHash: "d".repeat(64),
        modelArtifact: {
          sha256: "e".repeat(64),
          source: "local-cache",
          runtimeVersion: "0.0.1",
        },
      }),
    );
    verifyEvidenceBundle(bundle);
    expect(bundle.envelope?.xdr).toBe("AAAAAgAAAAB");
    expect(bundle.modelArtifact?.source).toBe("local-cache");
  });

  it("requires judgeRequestJson when receipt has judge", () => {
    const request = JSON.stringify({ model: "Qwen3-4B", prompt: "hello" });
    const requestHash = createHash("sha256").update(request, "utf8").digest("hex");
    const receipt = sampleReceipt({
      judge: {
        model: "Qwen3-4B",
        requestHash,
        label: "allow",
        codes: ["ok"],
      },
    });
    const bundle = createEvidenceBundle(
      baseInput({ receipt, judgeRequestJson: request }),
    );
    verifyEvidenceBundle(bundle);
    expect(() =>
      createEvidenceBundle(baseInput({ receipt })),
    ).toThrow(/judgeRequestJson is required/);
  });

  it("rejects judgeRequestJson without receipt.judge", () => {
    expect(() =>
      createEvidenceBundle(baseInput({ judgeRequestJson: "{}" })),
    ).toThrow(/must be absent/);
  });

  it("detects tampered receipt memoHash", () => {
    const bundle = createEvidenceBundle(baseInput());
    const tampered = { ...bundle, memoHash: "f".repeat(64) };
    expect(() => verifyEvidenceBundle(tampered)).toThrow(/memoHash/);
  });

  it("detects tampered judgeRequestJson", () => {
    const request = JSON.stringify({ model: "Qwen3-4B", prompt: "a" });
    const requestHash = createHash("sha256").update(request, "utf8").digest("hex");
    const receipt = sampleReceipt({
      judge: {
        model: "Qwen3-4B",
        requestHash,
        label: "allow",
        codes: ["ok"],
      },
    });
    const bundle = createEvidenceBundle(
      baseInput({ receipt, judgeRequestJson: request }),
    );
    const bad = { ...bundle, judgeRequestJson: JSON.stringify({ model: "Qwen3-4B", prompt: "b" }) };
    expect(() => verifyEvidenceBundle(bad)).toThrow(/request hash/);
  });

  it("detects tampered manifestHash", () => {
    const bundle = createEvidenceBundle(baseInput());
    const tampered = { ...bundle, manifestHash: "0".repeat(64) };
    expect(() => verifyEvidenceBundle(tampered)).toThrow(/manifestHash mismatch/);
  });

  it("rejects unknown top-level keys", () => {
    const bundle = createEvidenceBundle(baseInput());
    const withSecret = { ...bundle, apiKey: "sk-live-not-in-bundle" };
    expect(() => verifyEvidenceBundle(withSecret)).toThrow(/unknown key/);
  });

  it("rejects unknown receipt keys", () => {
    const bundle = createEvidenceBundle(baseInput());
    const tampered = {
      ...bundle,
      receipt: { ...bundle.receipt, seed: "must-not-persist" },
    };
    expect(() => verifyEvidenceBundle(tampered)).toThrow(/unknown key in receipt/);
  });

  it("rejects malformed types", () => {
    const bundle = createEvidenceBundle(baseInput());
    expect(() => verifyEvidenceBundle({ ...bundle, sequence: 42 })).toThrow(/sequence must be a string/);
    expect(() => verifyEvidenceBundle({ ...bundle, version: 2 })).toThrow(/version must be 1/);
    expect(() =>
      verifyEvidenceBundle({ ...bundle, memoHash: "NOT_HEX" }),
    ).toThrow(/memoHash must be a lowercase/);
  });

  it("rejects invalid sourcePublic format", () => {
    expect(() =>
      createEvidenceBundle(baseInput({ sourcePublic: "not-a-stellar-key" })),
    ).toThrow(/sourcePublic/);
    expect(() => createEvidenceBundle(baseInput({ sequence: "01" }))).toThrow(/sequence/);
  });

  it("rejects invalid envelope and metadata bounds", () => {
    expect(() =>
      createEvidenceBundle(
        baseInput({
          envelope: { xdr: "x", hash: "UPPERCASEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" },
        }),
      ),
    ).toThrow(/envelope.hash/);
    expect(() =>
      createEvidenceBundle(
        baseInput({
          modelArtifact: {
            sha256: "a".repeat(64),
            source: "x".repeat(2049),
            runtimeVersion: "1",
          },
        }),
      ),
    ).toThrow(/modelArtifact.source/);
  });

  it("sets memoHash from receipt integrity", () => {
    const receipt = sampleReceipt();
    const bundle = createEvidenceBundle(baseInput({ receipt }));
    expect(bundle.memoHash).toBe(receiptMemoHash(receipt));
  });

  it("manifest hash changes when nested receipt field changes", () => {
    const a = createEvidenceBundle(baseInput());
    const b = createEvidenceBundle(
      baseInput({ receipt: sampleReceipt({ amountStroops: "999" }) }),
    );
    expect(a.manifestHash).not.toBe(b.manifestHash);
  });

  it("create rejects unknown top-level input keys", () => {
    expect(() =>
      createEvidenceBundle({ ...baseInput(), apiKey: "sk-live" } as CreateEvidenceBundleInput),
    ).toThrow(/unknown key in createEvidenceBundle input/);
  });

  it("create rejects unknown receipt keys", () => {
    const receipt = { ...sampleReceipt(), seed: "must-not-persist" } as Receipt;
    expect(() => createEvidenceBundle(baseInput({ receipt }))).toThrow(/unknown key in receipt/);
  });

  it("create rejects unknown receipt.judge keys", () => {
    const receipt = sampleReceipt({
      judge: {
        model: "Qwen3-4B",
        requestHash: "a".repeat(64),
        label: "allow",
        codes: ["ok"],
        extra: "no",
      } as Receipt["judge"] & { extra: string },
    });
    expect(() => createEvidenceBundle(baseInput({ receipt }))).toThrow(/unknown key in receipt.judge/);
  });

  it("create rejects unknown envelope keys", () => {
    expect(() =>
      createEvidenceBundle(
        baseInput({
          envelope: { xdr: "AAAA", hash: "b".repeat(64), note: "x" } as never,
        }),
      ),
    ).toThrow(/envelope must contain only xdr and hash/);
  });

  it("create rejects unknown modelArtifact keys", () => {
    expect(() =>
      createEvidenceBundle(
        baseInput({
          modelArtifact: {
            sha256: "a".repeat(64),
            source: "local",
            runtimeVersion: "1",
            weights: "secret",
          } as never,
        }),
      ),
    ).toThrow(/unknown key in modelArtifact/);
  });

  it("create rejects non-string sequence", () => {
    expect(() =>
      createEvidenceBundle(baseInput({ sequence: 42 as unknown as string })),
    ).toThrow(/sequence must be a string/);
  });

  it("rejects sequence exceeding metadata string bound on create and verify", () => {
    const longSeq = "1" + "0".repeat(2048);
    expect(() => createEvidenceBundle(baseInput({ sequence: longSeq }))).toThrow(
      /sequence exceeds maximum length/,
    );
    const bundle = createEvidenceBundle(baseInput());
    const bad = { ...bundle, sequence: longSeq };
    expect(() => verifyEvidenceBundle(bad)).toThrow(/sequence exceeds maximum length/);
  });

  it("create rejects empty metadata strings", () => {
    expect(() =>
      createEvidenceBundle(baseInput({ receipt: sampleReceipt({ policyVersion: "" }) })),
    ).toThrow(/receipt.policyVersion/);
    expect(() =>
      createEvidenceBundle(
        baseInput({
          envelope: { xdr: "", hash: "c".repeat(64) },
        }),
      ),
    ).toThrow(/envelope.xdr/);
  });

  it("verify rejects oversized raw bundle before parse", () => {
    const bundle = createEvidenceBundle(baseInput());
    const huge = { ...bundle, padding: "x".repeat(MAX_BUNDLE_BYTES) };
    expect(() => verifyEvidenceBundle(huge)).toThrow(/exceeds maximum size/);
    const json = JSON.stringify(huge);
    expect(() => verifyEvidenceBundle(json)).toThrow(/exceeds maximum size/);
  });
});

const MAX_BUNDLE_BYTES = 1 << 20;
