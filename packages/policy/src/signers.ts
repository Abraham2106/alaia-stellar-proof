import type { SignerWeight } from "./types.js";

/** DEC-0004 budget account: two spenders, weight 1 each. Not a signature check. */
export const BUDGET_SIGNERS: readonly SignerWeight[] = [
  { id: "signerA", weight: 1 },
  { id: "signerB", weight: 1 },
];

export function signerWeight(signers: readonly SignerWeight[]): number {
  return signers.reduce((sum, signer) => sum + signer.weight, 0);
}

export function thresholdReasons(
  signers: readonly SignerWeight[],
  threshold: number,
): string[] {
  if (signerWeight(signers) >= threshold) {
    return [];
  }
  return ["threshold_unmet"];
}
