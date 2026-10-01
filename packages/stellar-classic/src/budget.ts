import {
  Account,
  Operation,
  TransactionBuilder,
  TimeoutInfinite,
} from "@stellar/stellar-sdk";
import { STANDALONE_PASSPHRASE } from "./constants.js";

export type BudgetAccountSpec = {
  masterWeight: 0;
  lowThreshold: 2;
  medThreshold: 2;
  highThreshold: 2;
  signers: ReadonlyArray<{
    key: "signerA" | "signerB" | "recoverySigner";
    weight: number;
  }>;
};

export type BuildBudgetAccountEnvelopeParams = {
  sourcePublic: string;
  sequence: string | number;
  signerA: string;
  signerB: string;
  recoverySigner: string;
  feeStroops: number;
};

export function budgetAccountSetOptions(): {
  spec: BudgetAccountSpec;
  buildBudgetAccountEnvelope: (
    params: BuildBudgetAccountEnvelopeParams,
  ) => { xdr: string; hash: string };
} {
  const spec: BudgetAccountSpec = {
    masterWeight: 0,
    lowThreshold: 2,
    medThreshold: 2,
    highThreshold: 2,
    signers: [
      { key: "signerA", weight: 1 },
      { key: "signerB", weight: 1 },
      { key: "recoverySigner", weight: 0 },
    ],
  };

  function buildBudgetAccountEnvelope(
    params: BuildBudgetAccountEnvelopeParams,
  ): { xdr: string; hash: string } {
    // DEC-0004: SetOptions adds one signer per op; thresholds + master weight ride the first op.
    const source = new Account(params.sourcePublic, String(params.sequence));
    const builder = new TransactionBuilder(source, {
        fee: String(params.feeStroops),
        networkPassphrase: STANDALONE_PASSPHRASE,
      },
    )
      .addOperation(
        Operation.setOptions({
          masterWeight: 0,
          lowThreshold: 2,
          medThreshold: 2,
          highThreshold: 2,
          signer: { ed25519PublicKey: params.signerA, weight: 1 },
        }),
      )
      .addOperation(
        Operation.setOptions({
          signer: { ed25519PublicKey: params.signerB, weight: 1 },
        }),
      )
      .addOperation(
        Operation.setOptions({
          // DEC-0004 recovery is a separate tested procedure, not a third vote.
          signer: { ed25519PublicKey: params.recoverySigner, weight: 0 },
        }),
      )
      .setTimeout(TimeoutInfinite);

    const transaction = builder.build();
    return {
      xdr: transaction.toXDR(),
      hash: transaction.hash().toString("hex"),
    };
  }

  return { spec, buildBudgetAccountEnvelope };
}
