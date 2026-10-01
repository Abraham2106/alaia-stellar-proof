/** DEC-0004: Stellar Quickstart standalone network passphrase */
export const STANDALONE_PASSPHRASE = "Standalone Network ; February 2017";

/** DEC-0004: local Horizon on Quickstart standalone */
export const LOCAL_HORIZON = "http://127.0.0.1:8000";

/** Hint only — not executed by this package (no shell, no Docker dependency). */
export const QUICKSTART_HINT =
  "docker run --rm -p 8000:8000 -p 11626:11626 stellar/quickstart --local";
