import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { consider } from "@alaia/gateway";
import { assertLocalHorizon } from "@alaia/localnet";
import {
  budgetAccountSetOptions,
  buildPaymentEnvelope,
  signEnvelope,
} from "@alaia/stellar-classic";
import {
  normalizeMemoHex,
  policyInput,
  requireLiveQvac,
  skipUnlessLive,
} from "./helpers/context.js";
import { liveHorizon } from "./helpers/horizon.js";
import {
  fetchTransaction,
  fundViaFriendbot,
  loadAccount,
  submitTransaction,
  submitTransactionRaw,
} from "./helpers/transport.js";

describe("local Classic payment slice (Quickstart standalone)", () => {
  it("configures 2-of-2 and rejects a weight-0 recovery signature independently of Qwen", async (ctx) => {
    if (!skipUnlessLive(ctx)) {
      return;
    }

    const LIVE_HORIZON = await liveHorizon();
    assertLocalHorizon(LIVE_HORIZON);

    const budget = Keypair.random();
    const signerA = Keypair.random();
    const signerB = Keypair.random();
    const recovery = Keypair.random();

    await fundViaFriendbot(LIVE_HORIZON, budget.publicKey());
    let acct = await loadAccount(LIVE_HORIZON, budget.publicKey());

    const { buildBudgetAccountEnvelope } = budgetAccountSetOptions();
    const setup = buildBudgetAccountEnvelope({
      sourcePublic: budget.publicKey(),
      sequence: acct.sequence,
      signerA: signerA.publicKey(),
      signerB: signerB.publicKey(),
      recoverySigner: recovery.publicKey(),
      feeStroops: 300,
    });
    const setupSigned = signEnvelope(setup.xdr, budget.secret());
    await submitTransaction(LIVE_HORIZON, setupSigned);

    acct = await loadAccount(LIVE_HORIZON, budget.publicKey());
    expect(acct.thresholds.med_threshold).toBe(2);
    const masterSigner = acct.signers.find((s) => s.key === budget.publicKey());
    expect(masterSigner?.weight).toBe(0);

    // DEC-0004: weight-0 recovery must not authorize a payment (not a third vote).
    const recoveryPayDest = Keypair.random().publicKey();
    await fundViaFriendbot(LIVE_HORIZON, recoveryPayDest);
    const recoveryOnlyPayment = buildPaymentEnvelope({
      sourcePublic: budget.publicKey(),
      sequence: acct.sequence,
      destination: recoveryPayDest,
      amountStroops: 1_000_000n,
      feeStroops: 10_000,
      memoHash32: "ab".repeat(32),
    });
    const recoverySigned = signEnvelope(recoveryOnlyPayment.xdr, recovery.secret());
    const recoverySubmit = await submitTransactionRaw(LIVE_HORIZON, recoverySigned);
    expect(recoverySubmit.hash, "weight-0 recovery must not produce a successful submit").toBeUndefined();
    expect(recoverySubmit.httpStatus).toBeGreaterThanOrEqual(400);
    const recoveryCodes = recoverySubmit.resultCodes as
      | { transaction?: string }
      | undefined;
    expect(recoveryCodes?.transaction).toBe("tx_bad_auth");
  });

  it("submits only a payment approved by the real QVAC judge and anchors its receipt", async (ctx) => {
    if (!skipUnlessLive(ctx)) {
      return;
    }
    requireLiveQvac();

    const LIVE_HORIZON = await liveHorizon();
    assertLocalHorizon(LIVE_HORIZON);
    const budget = Keypair.random();
    const signerA = Keypair.random();
    const signerB = Keypair.random();
    const recovery = Keypair.random();
    const allowedDest = Keypair.random().publicKey();
    const deniedDest = Keypair.random().publicKey();
    await fundViaFriendbot(LIVE_HORIZON, budget.publicKey());
    let acct = await loadAccount(LIVE_HORIZON, budget.publicKey());
    const { buildBudgetAccountEnvelope } = budgetAccountSetOptions();
    const setup = buildBudgetAccountEnvelope({
      sourcePublic: budget.publicKey(),
      sequence: acct.sequence,
      signerA: signerA.publicKey(),
      signerB: signerB.publicKey(),
      recoverySigner: recovery.publicKey(),
      feeStroops: 300,
    });
    await submitTransaction(LIVE_HORIZON, signEnvelope(setup.xdr, budget.secret()));
    acct = await loadAccount(LIVE_HORIZON, budget.publicKey());
    await fundViaFriendbot(LIVE_HORIZON, allowedDest);

    const allow = await consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest, {
        userIntent: `Pay 0.5 XLM to ${allowedDest}`,
      }),
    );
    if (allow.decision !== "allow") {
      const judge = allow.receipt.judge;
      throw new Error(
        `expected judge allow, got decision=${allow.decision} reasons=${JSON.stringify(allow.reasons)} ` +
          `judge=${JSON.stringify(judge ? { label: judge.label, codes: judge.codes } : null)}`,
      );
    }
    expect(allow.envelope).not.toBeNull();
    expect(allow.receipt.judge).toMatchObject({ model: "Qwen3-4B", label: "allow", codes: ["ok"] });

    let signed = signEnvelope(allow.envelope!.xdr, signerA.secret());
    signed = signEnvelope(signed, signerB.secret());
    const { hash: paymentHash } = await submitTransaction(LIVE_HORIZON, signed);

    const onChain = await fetchTransaction(LIVE_HORIZON, paymentHash);
    expect(onChain.memo_type).toBe("hash");
    expect(normalizeMemoHex(onChain.memo)).toBe(allow.memoHash);

    const denySetOptions = await consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest, {
        operations: ["payment", "setOptions"],
      }),
    );
    expect(denySetOptions.decision).toBe("deny");
    expect(denySetOptions.envelope).toBeNull();
    expect(denySetOptions.reasons).toContain("admin_operation");

    const denyOverCap = await consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest, {
        amount: 10_000_001n,
      }),
    );
    expect(denyOverCap.decision).toBe("deny");
    expect(denyOverCap.envelope).toBeNull();
    expect(denyOverCap.reasons).toContain("over_cap");

    const denyDest = await consider(
      policyInput(budget.publicKey(), acct.sequence, allowedDest, {
        destination: deniedDest,
      }),
    );
    expect(denyDest.decision).toBe("deny");
    expect(denyDest.envelope).toBeNull();
    expect(denyDest.reasons).toContain("destination_denied");
  });
});
