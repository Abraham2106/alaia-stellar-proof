// DEC-0015: agent spend requires a human grant; policy closes non-payment tools
import { evaluate } from "./evaluate.js";
import type { BudgetPolicy, CanonicalPayment, PolicyDecision } from "./types.js";
import type { EvaluateScope } from "./evaluate.js";

export type GateToolKind =
  | "payment"
  | "changeTrust"
  | "setOptions"
  | "invokeContract";

export type GateToolCallInput = {
  tool: GateToolKind;
  payment?: CanonicalPayment;
  policy?: BudgetPolicy;
  scope?: EvaluateScope;
};

export type GateToolCallResult = {
  decision: PolicyDecision;
  reasons: string[];
  questions: boolean;
};

export function gateToolCall(input: GateToolCallInput): GateToolCallResult {
  const { tool } = input;

  if (tool === "setOptions") {
    return {
      decision: "deny",
      reasons: ["signer_change_denied"],
      questions: false,
    };
  }

  if (tool === "invokeContract") {
    return {
      decision: "deny",
      reasons: ["contract_rail_closed"],
      questions: false,
    };
  }

  if (tool === "changeTrust") {
    return {
      decision: "deny",
      reasons: ["trustline_closed"],
      questions: false,
    };
  }

  const { payment, policy } = input;
  if (payment === undefined || policy === undefined) {
    throw new Error("gateToolCall payment tool requires payment and policy");
  }

  const result = evaluate(payment, policy, input.scope);
  return {
    decision: result.decision,
    reasons: result.reasons,
    questions: result.decision === "allow",
  };
}
