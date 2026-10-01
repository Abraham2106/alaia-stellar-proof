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
import { STANDALONE_PASSPHRASE } from "./constants.js";

export type BuildPaymentEnvelopeParams = {
  sourcePublic: string;
  sequence: string | number;
  destination: string;
  amountStroops: bigint;
  feeStroops: number;
  memoHash32: string;
  timeBounds?: { minTime?: number; maxTime?: number };
};

function parseMemoHash32(memoHash32: string): Buffer {
  const hex = memoHash32.startsWith("0x") ? memoHash32.slice(2) : memoHash32;
  if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("memoHash32 must be exactly 32 bytes (64 hex characters)");
  }
  return Buffer.from(hex, "hex");
}

function stroopsToAmountString(amountStroops: bigint): string {
  if (amountStroops < 0n) {
    throw new Error("amountStroops must be non-negative");
  }
  return amountStroops.toString(10);
}

export function buildPaymentEnvelope(
  params: BuildPaymentEnvelopeParams,
): { xdr: string; hash: string } {
  const memoBytes = parseMemoHash32(params.memoHash32);
  const source = new Account(params.sourcePublic, String(params.sequence));
  let builder = new TransactionBuilder(source, {
      fee: String(params.feeStroops),
      networkPassphrase: STANDALONE_PASSPHRASE,
    },
  )
    .addMemo(Memo.hash(memoBytes))
    .addOperation(
      Operation.payment({
        destination: params.destination,
        asset: Asset.native(),
        amount: stroopsToAmountString(params.amountStroops),
      }),
    );

  if (params.timeBounds) {
    builder = builder.setTimebounds(params.timeBounds);
  } else {
    builder = builder.setTimeout(TimeoutInfinite);
  }

  const transaction = builder.build();
  return {
    xdr: transaction.toXDR(),
    hash: transaction.hash().toString("hex"),
  };
}

export function signEnvelope(xdr: string, keypairSecret: string): string {
  const keypair = Keypair.fromSecret(keypairSecret);
  const transaction = new Transaction(xdr, STANDALONE_PASSPHRASE);
  transaction.sign(keypair);
  return transaction.toXDR();
}
