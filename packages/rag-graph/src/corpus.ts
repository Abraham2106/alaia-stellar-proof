import type { CorpusPayment } from "./types.js";
import {
  QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
  QUICKSTART_FIXTURE_SOURCE_PUBLIC,
} from "./quickstartFixture.js";

/** Fixed allowlist of corpus payment destinations (valid ed25519 strkeys). */
export const DESTINATION_ALLOWLIST: readonly [string, string, string] = [
  "GBYBGUIMY3Q2WHVWRNSU3K7XCUQBHVUNSWQDHDY2OLK7TFETTXU6PQW3",
  "GCHLKOAKNJOOYS6FXUWZO6IL5ZW2ESFNR6O5ITIBLVBIMUUDM54GYUAC",
  "GBZVZWDUSNT3UW5A56SPUVPQMKA4YTXOZK65HWGU7Z3LC2D4UHJQA6LW",
] as const;

const [DEST_A, DEST_B, DEST_C] = DESTINATION_ALLOWLIST;

/** Synthetic valid Classic payments — not copied from a live ledger. */
export const CORPUS_PAYMENTS: readonly CorpusPayment[] = [
  {
    from: "GDZZZCGWYOFYA2VUPQFXZLTGOSCF2JXHMXU66MJVQTSYJMLJMGKD7VVF",
    to: DEST_A,
    asset: "native",
    amountStroops: "250000000",
    feeStroops: "100",
    memo: "invoice office supplies",
  },
  {
    from: "GAX5OEJ2TWMMAM5ZQLYAAZ6UASIX3JB7A2MZ27RCNTJME34WQT7VYPE",
    to: DEST_B,
    asset: "native",
    amountStroops: "1000000000",
    feeStroops: "100",
    memo: "monthly cloud hosting",
  },
  {
    from: DEST_A,
    to: DEST_B,
    asset: "native",
    amountStroops: "50000000",
    feeStroops: "100",
    memo: "internal rebalancing Q3",
  },
  {
    from: DEST_B,
    to: DEST_C,
    asset: "native",
    amountStroops: "75000000",
    feeStroops: "100",
    memo: "vendor settlement batch",
  },
  {
    from: "GCQ3SAM4A3E3LLZ2R44X3TX5FYHTEUZ4R96Q4XKJ5J2R2H5NQGVYVSE",
    to: DEST_C,
    asset: "native",
    amountStroops: "120000000",
    feeStroops: "100",
    memo: "travel reimbursement",
  },
  {
    from: DEST_C,
    to: DEST_A,
    asset: "native",
    amountStroops: "30000000",
    feeStroops: "100",
    memo: "petty cash top-up",
  },
  {
    from: "GB3V2XMWY43YNY3CIFJEY6HGZF6KCI3Z7RBTLYNU3NPT3F2ZMBHZSFI",
    to: DEST_A,
    asset: "native",
    amountStroops: "99000000",
    feeStroops: "100",
    memo: "contractor design sprint",
  },
  {
    from: DEST_A,
    to: DEST_C,
    asset: "native",
    amountStroops: "41000000",
    feeStroops: "100",
    memo: "hardware peripherals",
  },
  {
    from: "GDIILJCHOZUA3XNR2BWQR76G27TT6FPDUQ3GIWCMB66HL4WSDMZ5WIF",
    to: DEST_B,
    asset: "native",
    amountStroops: "180000000",
    feeStroops: "100",
    memo: "annual software license",
  },
  {
    from: QUICKSTART_FIXTURE_SOURCE_PUBLIC,
    to: QUICKSTART_FIXTURE_DESTINATION_PUBLIC,
    asset: "native",
    amountStroops: "5000000",
    feeStroops: "10000",
    memo: "local Quickstart fixture payment",
  },
];
