// DEC-0009: approved signing binds envelope body before invoking transaction.sign.
import { Asset, Keypair, MemoHash, Transaction } from "@stellar/stellar-sdk";
import { STANDALONE_PASSPHRASE } from "./constants.js";

export type PaymentApproval = {
  decision: "allow" | "deny" | "escalate";
  envelopeHash: string;
  sourcePublic: string;
  destination: string;
  amountStroops: bigint | string | number;
  feeStroops: bigint | string | number;
  /** SHA-256 hex (64 chars) of the canonical receipt; stored as MEMO_HASH on the envelope. */
  memoHash: string;
};

function normalizeHexHash(hash: string): string {
  const hex = hash.startsWith("0x") ? hash.slice(2) : hash;
  if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("envelopeHash must be 64 hex characters");
  }
  return hex.toLowerCase();
}

function normalizeMemoHash(memoHash: string): string {
  const hex = memoHash.startsWith("0x") ? memoHash.slice(2) : memoHash;
  if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("memoHash must be 64 hex characters");
  }
  return hex.toLowerCase();
}

function amountStringToStroops(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const padded = frac.padEnd(7, "0").slice(0, 7);
  return BigInt(whole) * 10_000_000n + BigInt(padded || "0");
}

function stroopsFromApproval(value: bigint | string | number): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("amountStroops must be a non-negative integer");
    }
    return BigInt(value);
  }
  if (!/^\d+$/.test(value)) {
    throw new Error("amountStroops must be a non-negative integer string");
  }
  return BigInt(value);
}

function feeFromApproval(value: bigint | string | number): number {
  if (typeof value === "bigint") {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error("feeStroops out of range");
    }
    return Number(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("feeStroops must be a non-negative integer");
    }
    return value;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error("feeStroops must be a non-negative integer string");
  }
  const n = Number(value);
  if (!Number.isSafeInteger(n)) {
    throw new Error("feeStroops out of range");
  }
  return n;
}

export type ParsedPaymentEnvelope = {
  envelopeHash: string;
  sourcePublic: string;
  destination: string;
  amountStroops: bigint;
  feeStroops: number;
  memoHash: string;
};

/** Hash of the standalone transaction body (unchanged when additional signatures are added). */
export function envelopeBodyHash(xdr: string): string {
  const transaction = new Transaction(xdr, STANDALONE_PASSPHRASE);
  return transaction.hash().toString("hex");
}

export function parsePaymentEnvelope(xdr: string): ParsedPaymentEnvelope {
  const transaction = new Transaction(xdr, STANDALONE_PASSPHRASE);
  const ops = transaction.operations;
  if (ops.length !== 1) {
    throw new Error("envelope must contain exactly one operation");
  }
  const op = ops[0];
  if (op.type !== "payment") {
    throw new Error("envelope operation must be payment");
  }
  if (!op.asset.equals(Asset.native())) {
    throw new Error("payment asset must be native XLM");
  }
  const opSource = (op as { source?: string }).source;
  if (opSource !== undefined && opSource !== transaction.source) {
    throw new Error("payment source account must match transaction source");
  }
  const memo = transaction.memo;
  if (memo.type !== MemoHash) {
    throw new Error("envelope memo must be MEMO_HASH");
  }
  const memoBuf = memo.value as Buffer;
  if (memoBuf.length !== 32) {
    throw new Error("MEMO_HASH must be 32 bytes");
  }
  return {
    envelopeHash: transaction.hash().toString("hex"),
    sourcePublic: transaction.source,
    destination: op.destination!,
    amountStroops: amountStringToStroops(op.amount!),
    feeStroops: Number(transaction.fee),
    memoHash: memoBuf.toString("hex"),
  };
}

function assertApprovalMatchesEnvelope(
  approval: PaymentApproval,
  parsed: ParsedPaymentEnvelope,
): void {
  const expectedHash = normalizeHexHash(approval.envelopeHash);
  if (parsed.envelopeHash !== expectedHash) {
    throw new Error("envelope hash mismatch");
  }
  if (parsed.sourcePublic !== approval.sourcePublic) {
    throw new Error("source public key mismatch");
  }
  if (parsed.destination !== approval.destination) {
    throw new Error("destination mismatch");
  }
  const amount = stroopsFromApproval(approval.amountStroops);
  if (parsed.amountStroops !== amount) {
    throw new Error("amount mismatch");
  }
  const fee = feeFromApproval(approval.feeStroops);
  if (parsed.feeStroops !== fee) {
    throw new Error("fee mismatch");
  }
  const memo = normalizeMemoHash(approval.memoHash);
  if (parsed.memoHash !== memo) {
    throw new Error("memo hash mismatch");
  }
}

/** Rejects tampering that changes the transaction body after signing. */
export function assertEnvelopeBodyHash(xdr: string, expectedHash: string): void {
  const expected = normalizeHexHash(expectedHash);
  const actual = envelopeBodyHash(xdr);
  if (actual !== expected) {
    throw new Error("envelope body hash mismatch after sign");
  }
}

export function signApprovedEnvelope(
  xdr: string,
  approval: PaymentApproval,
  seed: string,
): string {
  if (approval.decision !== "allow") {
    throw new Error("approval decision is not allow");
  }
  const parsed = parsePaymentEnvelope(xdr);
  assertApprovalMatchesEnvelope(approval, parsed);
  const keypair = Keypair.fromSecret(seed);
  const transaction = new Transaction(xdr, STANDALONE_PASSPHRASE);
  const bodyBefore = transaction.hash().toString("hex");
  transaction.sign(keypair);
  const bodyAfter = transaction.hash().toString("hex");
  if (bodyBefore !== bodyAfter) {
    throw new Error("signing altered transaction body");
  }
  return transaction.toXDR();
}
