// DEC-0004: a graph hit cannot override a policy deny, and an unknown graph cannot create an envelope
import { assess } from "@alaia/rag-graph";
import type { PaymentCandidate } from "@alaia/rag-graph";
import { consider, type ConsiderInput, type ConsiderResult } from "./consider.js";

export function considerWithGraph(
  input: ConsiderInput,
  candidate: PaymentCandidate,
): ConsiderResult {
  const base = consider(input);
  const policyAllows = base.decision === "allow";
  const assessment = assess(candidate, policyAllows);

  if (assessment.accept) {
    return base;
  }

  if (!policyAllows) {
    return { ...base, envelope: null };
  }

  const reasons =
    assessment.graph === "unknown"
      ? [...base.reasons, "graph_unknown"]
      : [...base.reasons];

  return { ...base, reasons, envelope: null };
}
