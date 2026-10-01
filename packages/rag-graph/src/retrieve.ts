import { CORPUS_PAYMENTS } from "./corpus.js";
import type { CorpusPayment } from "./types.js";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function sharedTokenScore(queryTokens: string[], memo: string): number {
  if (queryTokens.length === 0) {
    return 0;
  }
  const memoTokens = new Set(tokenize(memo));
  let score = 0;
  for (const token of queryTokens) {
    if (memoTokens.has(token)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Returns up to k corpus rows whose memo shares the most query tokens (case-insensitive).
 * Empty query returns [].
 */
export function retrieve(query: string, k: number): CorpusPayment[] {
  const trimmed = query.trim();
  if (trimmed.length === 0 || k <= 0) {
    return [];
  }

  const queryTokens = tokenize(trimmed);
  const scored = CORPUS_PAYMENTS.map((row, index) => ({
    row,
    index,
    score: sharedTokenScore(queryTokens, row.memo),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  const withHits = scored.filter((entry) => entry.score > 0);
  return withHits.slice(0, k).map((entry) => entry.row);
}
