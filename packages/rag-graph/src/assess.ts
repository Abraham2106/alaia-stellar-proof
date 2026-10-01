// DEC-0004: graph does not override policy
import { accountsInGraph, hasEdgeBetween } from "./graph.js";
import { retrieve } from "./retrieve.js";
import { CORPUS_PAYMENTS } from "./corpus.js";
import type { AssessResult, PaymentCandidate } from "./types.js";

function graphStatus(candidate: PaymentCandidate): "known" | "unknown" {
  const accounts = accountsInGraph();
  if (!accounts.has(candidate.from) || !accounts.has(candidate.to)) {
    return "unknown";
  }
  if (!hasEdgeBetween(candidate.from, candidate.to)) {
    return "unknown";
  }
  return "known";
}

export function assess(
  candidate: PaymentCandidate,
  policyAllows: boolean,
): AssessResult {
  const graph = graphStatus(candidate);
  const memo = candidate.memo ?? "";
  const retrieveHits = retrieve(memo, CORPUS_PAYMENTS.length).length;

  // DEC-0004: graph does not override policy
  const accept = policyAllows && graph === "known";

  return { graph, retrieveHits, accept };
}
