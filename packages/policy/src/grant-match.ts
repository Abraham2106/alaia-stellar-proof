import type { Asset } from "./types.js";
import type { Grant } from "./grant.js";

export function paymentAssetGrantString(asset: Asset): string {
  if (asset.kind === "native") {
    return "native";
  }
  return `credit:${asset.code}:${asset.issuer}`;
}

export function grantCoversPayment(
  payment: { destination: string; asset: Asset; amount: bigint },
  grant: Grant,
): boolean {
  if (payment.destination !== grant.destination) {
    return false;
  }
  if (paymentAssetGrantString(payment.asset) !== grant.asset) {
    return false;
  }
  if (payment.amount > BigInt(grant.maxAmountStroops)) {
    return false;
  }
  return true;
}
