import { CORPUS_PAYMENTS } from "./corpus.js";

export type GraphEdge = {
  from: string;
  to: string;
  amountStroops: string;
};

const adjacency = new Map<string, Set<string>>();
const edges: GraphEdge[] = [];

for (const payment of CORPUS_PAYMENTS) {
  edges.push({
    from: payment.from,
    to: payment.to,
    amountStroops: payment.amountStroops,
  });
  if (!adjacency.has(payment.from)) {
    adjacency.set(payment.from, new Set());
  }
  if (!adjacency.has(payment.to)) {
    adjacency.set(payment.to, new Set());
  }
  adjacency.get(payment.from)!.add(payment.to);
  adjacency.get(payment.to)!.add(payment.from);
}

/** Accounts that appear in the synthetic corpus graph. */
export function accountsInGraph(): ReadonlySet<string> {
  return new Set(adjacency.keys());
}

/** Unique neighbor accounts connected by at least one corpus payment edge. */
export function neighbors(account: string): string[] {
  const set = adjacency.get(account);
  if (!set) {
    return [];
  }
  return [...set].sort();
}

export function edgeCount(): number {
  return edges.length;
}

/** True when both accounts appear in the graph and share an edge in either direction. */
export function hasEdgeBetween(a: string, b: string): boolean {
  if (a === b) {
    return adjacency.has(a);
  }
  const na = adjacency.get(a);
  return na !== undefined && na.has(b);
}

export function corpusEdges(): readonly GraphEdge[] {
  return edges;
}
