import { describe, expect, it } from "vitest";
import {
  Account,
  Asset,
  Keypair,
  Memo,
  Operation,
  Transaction,
  TransactionBuilder,
  TimeoutInfinite,
} from "@stellar/stellar-sdk";
import {
  STANDALONE_PASSPHRASE,
  assertEnvelopeBodyHash,
  buildPaymentEnvelope,
  envelopeBodyHash,
  parsePaymentEnvelope,
  signApprovedEnvelope,
  type PaymentApproval,
} from "../src/index.ts";

const MEMO_HEX =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function approvalFor(
  envelope: { xdr: string; hash: string },
  fields: {
    sourcePublic: string;
    destination: string;
    amountStroops: bigint;
    feeStroops: number;
    memoHash?: string;
    decision?: PaymentApproval["decision"];
    envelopeHash?: string;
  },
): PaymentApproval {
  return {
    decision: fields.decision ?? "allow",
    envelopeHash: fields.envelopeHash ?? envelope.hash,
    sourcePublic: fields.sourcePublic,
    destination: fields.destination,
    amountStroops: fields.amountStroops,
    feeStroops: fields.feeStroops,
    memoHash: fields.memoHash ?? MEMO_HEX,
  };
}

describe("signApprovedEnvelope", () => {
  it("signs when approval matches the standalone payment body", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "7",
      destination: dest,
      amountStroops: 2_500_000n,
      feeStroops: 120,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 2_500_000n,
      feeStroops: 120,
    });
    const signed = signApprovedEnvelope(envelope.xdr, approval, source.secret());
    const tx = new Transaction(signed, STANDALONE_PASSPHRASE);
    expect(tx.signatures.length).toBe(1);
    assertEnvelopeBodyHash(signed, envelope.hash);
  });

  it("allows signer A then signer B on the same body without changing the hash", () => {
    const budgetSource = Keypair.random();
    const signerA = Keypair.random();
    const signerB = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: budgetSource.publicKey(),
      sequence: "3",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: budgetSource.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
    });
    const hashBefore = envelopeBodyHash(envelope.xdr);
    const once = signApprovedEnvelope(envelope.xdr, approval, signerA.secret());
    const twice = signApprovedEnvelope(once, approval, signerB.secret());
    expect(envelopeBodyHash(twice)).toBe(hashBefore);
    const tx = new Transaction(twice, STANDALONE_PASSPHRASE);
    expect(tx.signatures.length).toBe(2);
  });

  it("rejects non-allow decisions before signing", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      decision: "deny",
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, approval, source.secret()),
    ).toThrow(/not allow/);
  });

  it("rejects destination mismatch before signing", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: Keypair.random().publicKey(),
      amountStroops: 1n,
      feeStroops: 100,
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, approval, source.secret()),
    ).toThrow(/destination/);
  });

  it("rejects amount mismatch before signing", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 5_000_000n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 4_999_999n,
      feeStroops: 100,
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, approval, source.secret()),
    ).toThrow(/amount/);
  });

  it("rejects memo hash mismatch before signing", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash: "bb".repeat(32),
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, approval, source.secret()),
    ).toThrow(/memo/);
  });

  it("rejects source mismatch before signing", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: Keypair.random().publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, approval, source.secret()),
    ).toThrow(/source/);
  });

  it("rejects fee mismatch before signing", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 200,
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, approval, source.secret()),
    ).toThrow(/fee/);
  });

  it("rejects envelope hash mismatch before signing", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      envelopeHash: "ff".repeat(32),
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, approval, source.secret()),
    ).toThrow(/envelope hash/);
  });

  it("rejects payment with a third-party source account even when approval matches tx source", () => {
    const budgetSource = Keypair.random();
    const thirdPartyPayer = Keypair.random();
    const dest = Keypair.random().publicKey();
    const memoBytes = Buffer.from(MEMO_HEX, "hex");
    const xdr = new TransactionBuilder(
      new Account(budgetSource.publicKey(), "2"),
      { fee: "100", networkPassphrase: STANDALONE_PASSPHRASE },
    )
      .addMemo(Memo.hash(memoBytes))
      .addOperation(
        Operation.payment({
          source: thirdPartyPayer.publicKey(),
          destination: dest,
          asset: Asset.native(),
          amount: "0.0000001",
        }),
      )
      .setTimeout(TimeoutInfinite)
      .build()
      .toXDR();
    expect(() => parsePaymentEnvelope(xdr)).toThrow(/payment source/);
    const envelope = buildPaymentEnvelope({
      sourcePublic: budgetSource.publicKey(),
      sequence: "2",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: budgetSource.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
    });
    expect(() =>
      signApprovedEnvelope(xdr, approval, budgetSource.secret()),
    ).toThrow(/payment source/);
  });

  it("rejects unsafe integer amount and fee in approval", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const badAmount = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: Number.MAX_SAFE_INTEGER + 1,
      feeStroops: 100,
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, badAmount, source.secret()),
    ).toThrow(/amount/);
    const badFee = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: Number.MAX_SAFE_INTEGER + 1,
    });
    expect(() =>
      signApprovedEnvelope(envelope.xdr, badFee, source.secret()),
    ).toThrow(/fee/);
  });

  it("detects post-sign body tampering via assertEnvelopeBodyHash", () => {
    const source = Keypair.random();
    const dest = Keypair.random().publicKey();
    const tampered = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: Keypair.random().publicKey(),
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const envelope = buildPaymentEnvelope({
      sourcePublic: source.publicKey(),
      sequence: "1",
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
      memoHash32: MEMO_HEX,
    });
    const approval = approvalFor(envelope, {
      sourcePublic: source.publicKey(),
      destination: dest,
      amountStroops: 1n,
      feeStroops: 100,
    });
    const signed = signApprovedEnvelope(envelope.xdr, approval, source.secret());
    expect(() => assertEnvelopeBodyHash(tampered.xdr, envelope.hash)).toThrow(
      /after sign/,
    );
    assertEnvelopeBodyHash(signed, envelope.hash);
  });
});
