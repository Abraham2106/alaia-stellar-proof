import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { considerWithGraph } from "@alaia/gateway";
import { assertLocalHorizon } from "@alaia/localnet";
import {
  QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
  QUICKSTART_FIXTURE_SOURCE_PUBLIC,
  QUICKSTART_FIXTURE_SOURCE_SEED,
} from "@alaia/rag-graph";
import { budgetAccountSetOptions, signEnvelope } from "@alaia/stellar-classic";
import {
  keypairFromFixtureSeed,
  policyInput,
  skipUnlessLive,
} from "./helpers/context.js";
import { liveHorizon } from "./helpers/horizon.js";
import {
  countOutgoingPayments,
  fundViaFriendbot,
  loadAccount,
  submitTransaction,
  withStrandsDisabled,
} from "./helpers/transport.js";

describe("considerWithGraph live ledger gates", () => {
  it("graph gate: considerWithGraph withholds envelope for unknown corpus edge (no submit)", async (ctx) => {
    if (!skipUnlessLive(ctx)) {
      return;
    }

    const LIVE_HORIZON = await liveHorizon();
    assertLocalHorizon(LIVE_HORIZON);

    const budget = Keypair.random();
    const signerA = Keypair.random();
    const signerB = Keypair.random();
    const recovery = Keypair.random();
    const allowedDest = Keypair.random().publicKey();

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
    await fundViaFriendbot(LIVE_HORIZON, allowedDest);

    const paymentsBefore = await countOutgoingPayments(
      LIVE_HORIZON,
      budget.publicKey(),
    );

    const graphGate = await considerWithGraph(
      policyInput(budget.publicKey(), acct.sequence, allowedDest),
      { from: budget.publicKey(), to: allowedDest },
    );
    // DEC-0007: unknown graph => escalate, policy allow preserved
    expect(graphGate.policyDecision).toBe("allow");
    expect(graphGate.decision).toBe("escalate");
    expect(graphGate.receipt.decision).toBe("escalate");
    expect(graphGate.envelope).toBeNull();
    expect(graphGate.reasons).toContain("graph_unknown");

    const paymentsAfter = await countOutgoingPayments(
      LIVE_HORIZON,
      budget.publicKey(),
    );
    expect(paymentsAfter).toBe(paymentsBefore);
  });

  it("graph gate: known corpus edge stays fail-closed without strands-decider (no submit)", async (ctx) => {
    if (!skipUnlessLive(ctx)) {
      return;
    }

    await withStrandsDisabled(async () => {
      const LIVE_HORIZON = await liveHorizon();
      assertLocalHorizon(LIVE_HORIZON);

      const budget = keypairFromFixtureSeed(QUICKSTART_FIXTURE_SOURCE_SEED);
      expect(budget.publicKey()).toBe(QUICKSTART_FIXTURE_SOURCE_PUBLIC);

      const signerA = Keypair.random();
      const signerB = Keypair.random();
      const recovery = Keypair.random();
      const fixtureDest = QUICKSTART_FIXTURE_DESTINATION_PUBLIC;

      await fundViaFriendbot(LIVE_HORIZON, budget.publicKey());
      await fundViaFriendbot(LIVE_HORIZON, fixtureDest);

      let acct = await loadAccount(LIVE_HORIZON, budget.publicKey());

      if (acct.thresholds.med_threshold !== 2) {
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
      }

      const paymentsBefore = await countOutgoingPayments(
        LIVE_HORIZON,
        budget.publicKey(),
      );

      const graphAllow = await considerWithGraph(
        policyInput(budget.publicKey(), acct.sequence, fixtureDest),
        { from: budget.publicKey(), to: fixtureDest },
      );
      expect(graphAllow.policyDecision).toBe("allow");
      expect(graphAllow.decision).toBe("escalate");
      expect(graphAllow.envelope).toBeNull();
      expect(graphAllow.reasons).toContain("runtime_unavailable");
      expect(graphAllow.reasons).not.toContain("graph_unknown");

      const paymentsAfter = await countOutgoingPayments(
        LIVE_HORIZON,
        budget.publicKey(),
      );
      expect(paymentsAfter).toBe(paymentsBefore);

      const denySetOptions = await considerWithGraph(
        policyInput(budget.publicKey(), acct.sequence, fixtureDest, {
          operations: ["payment", "setOptions"],
        }),
        { from: budget.publicKey(), to: fixtureDest },
      );
      expect(denySetOptions.decision).toBe("deny");
      expect(denySetOptions.envelope).toBeNull();
      expect(denySetOptions.reasons).toContain("admin_operation");
    });
  });
});
