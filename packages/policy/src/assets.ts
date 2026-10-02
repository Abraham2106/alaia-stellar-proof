import type { Asset } from "./types.js";

export function assetsEqual(a: Asset, b: Asset): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === "native") {
    return true;
  }
  return b.kind === "credit" && a.code === b.code && a.issuer === b.issuer;
}

export function assetAllowed(asset: Asset, allowed: readonly Asset[]): boolean {
  return allowed.some((candidate) => assetsEqual(candidate, asset));
}
