import { LOCAL_HORIZON, STANDALONE_PASSPHRASE } from "./constants.js";

export type QuickstartPlan = {
  image: "stellar/quickstart";
  network: "local";
  horizon: string;
  passphrase: string;
  publicInternet: false;
};

/** DEC-0004: standalone Quickstart plan — no public internet on the happy path */
export function quickstartPlan(): QuickstartPlan {
  return {
    image: "stellar/quickstart",
    network: "local",
    horizon: LOCAL_HORIZON,
    passphrase: STANDALONE_PASSPHRASE,
    publicInternet: false,
  };
}
