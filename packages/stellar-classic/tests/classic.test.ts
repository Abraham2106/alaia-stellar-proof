import { describe, expect, it } from "vitest";
import {
  Keypair,
  MemoHash,
  Transaction,
  xdr,
} from "@stellar/stellar-sdk";
import {
  STANDALONE_PASSPHRASE,
  buildPaymentEnvelope,
  budgetAccountSetOptions,
  signEnvelope,
} from "../src/index.ts";

const MEMO_HEX =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function memoHashFromEnvelope(xdrBase64: string): Buffer {
  const tx = new Transaction(xdrBase64, STANDALONE_PASSPHRASE);
  const memo = tx.memo;
  if (memo.type !== MemoHash) {
    throw new Error(`expected MEMO_HASH, got ${memo.type}`);
  }
  return memo.value as Buffer;
}

describe("buildPaymentEnvelope", () => {
  it("encodes explicit time bounds using the SDK's two-argument API", () => {
    const { xdr } = buildPaymentEnvelope({
      sourcePublic: Keypair.random().publicKey(), sequence: "1",
      destination: Keypair.random().publicKey(), amountStroops: 1n,
      feeStroops: 100, memoHash32: MEMO_HEX,
      timeBounds: { minTime: 100, maxTime: 200 },
    });
    const tx = new Transaction(xdr, STANDALONE_PASSPHRASE);
    expect(tx.timeBounds).toEqual({ minTime: "100", maxTime: "200" });
  });

  it("unsigned envelope carries MEMO_HASH from input", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const { xdr } = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 10_000_000n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    expect(memoHashFromEnvelope(xdr).toString("hex")).toBe(MEMO_HEX);
  });

  it("tampering destination before sign changes the hash", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const otherDest = Keypair.random().publicKey();
    const base = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 5_000_000n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const tampered = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: otherDest,
      amountStroops: 5_000_000n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    expect(tampered.hash).not.toBe(base.hash);
  });

  it("signed envelope verifies with the source key", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const { xdr } = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "42",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const signed = signEnvelope(xdr, source.secret());
    const tx = new Transaction(signed, STANDALONE_PASSPHRASE);
    expect(tx.signatures.length).toBeGreaterThan(0);
    const digest = tx.hash();
    const ok = tx.signatures.every((sig) =>
      source.verify(digest, sig.signature()),
    );
    expect(ok).toBe(true);
  });

  it("uses the standalone network passphrase", () => {
    expect(STANDALONE_PASSPHRASE).toBe("Standalone Network ; February 2017");
    const source = Keypair.random();
    const { xdr } = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: Keypair.random().publicKey(),
      amountStroops: 100n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const signed = signEnvelope(xdr, source.secret());
    const standaloneTx = new Transaction(signed, STANDALONE_PASSPHRASE);
    const publicTx = new Transaction(
      signed,
      "Public Global Stellar Network ; September 2015",
    );
    const sig = standaloneTx.signatures[0]!.signature();
    expect(source.verify(standaloneTx.hash(), sig)).toBe(true);
    expect(source.verify(publicTx.hash(), sig)).toBe(false);
  });

  it("rejects memo hashes that are not 32 bytes", () => {
    const source = Keypair.random();
    expect(() =>
      buildPaymentEnvelope({
        sourcePublic: source.publicKey(),
        sequence: "1",
        destination: Keypair.random().publicKey(),
        amountStroops: 1n,
        feeStroops: 100,
        memoHash32: "abcd",
      }),
    ).toThrow(/32 bytes/);
  });
});

describe("budgetAccountSetOptions", () => {
  it("spec has masterWeight 0 and medThreshold 2", () => {
    const { spec } = budgetAccountSetOptions();
    expect(spec.masterWeight).toBe(0);
    expect(spec.medThreshold).toBe(2);
    expect(spec.lowThreshold).toBe(2);
    expect(spec.highThreshold).toBe(2);
    expect(spec.signers.map((s) => s.key)).toEqual(["signerA", "signerB"]);
  });

  it("builds two SetOptions ops without deprecated recoverySigner", () => {
    const source = Keypair.random();
    const signerA = Keypair.random();
    const signerB = Keypair.random();
    const { buildBudgetAccountEnvelope } = budgetAccountSetOptions();
    const { xdr: envelopeXdr } = buildBudgetAccountEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      signerA: signerA.publicKey(),
      signerB: signerB.publicKey(),
      feeStroops: 300,
    });
    const envelope = xdr.TransactionEnvelope.fromXDR(envelopeXdr, "base64");
    const ops =
      envelope.v1().tx().operations() ?? envelope.v0().tx().operations();
    expect(ops.length).toBe(2);
  });

  it("builds a single SetOptions transaction with three signer ops", () => {
    const source = Keypair.random();
    const signerA = Keypair.random();
    const signerB = Keypair.random();
    const recovery = Keypair.random();
    const { buildBudgetAccountEnvelope } = budgetAccountSetOptions();
    const { xdr: envelopeXdr } = buildBudgetAccountEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      signerA: signerA.publicKey(),
      signerB: signerB.publicKey(),
      recoverySigner: recovery.publicKey(),
      feeStroops: 300,
    });
    const envelope = xdr.TransactionEnvelope.fromXDR(envelopeXdr, "base64");
    const ops =
      envelope.v1().tx().operations() ??
      envelope.v0().tx().operations();
    expect(ops.length).toBe(3);
    const first = ops[0].body().setOptionsOp();
    expect(first.masterWeight()).toBe(0);
    expect(first.medThreshold()).toBe(2);
  });
});
